import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=wechat_denied', request.url));
  }

  // CSRF: verify state
  const savedState = request.cookies.get('wechat_oauth_state')?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL('/login?error=invalid_state', request.url));
  }

  const appId = process.env.WECHAT_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
    return NextResponse.redirect(new URL('/login?error=server_config', request.url));
  }

  // Step 1: Exchange code for access_token + openid
  const tokenRes = await fetch(
    `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`
  );
  const tokenData = await tokenRes.json();

  if (tokenData.errcode) {
    console.error('WeChat token error:', tokenData);
    return NextResponse.redirect(new URL('/login?error=wechat_token', request.url));
  }

  const { openid, access_token: wechatAccessToken, unionid } = tokenData;

  // Step 2: Get user profile from WeChat
  const userRes = await fetch(
    `https://api.weixin.qq.com/sns/userinfo?access_token=${wechatAccessToken}&openid=${openid}`
  );
  const userData = await userRes.json();

  if (userData.errcode) {
    console.error('WeChat userinfo error:', userData);
    return NextResponse.redirect(new URL('/login?error=wechat_userinfo', request.url));
  }

  const { nickname, headimgurl } = userData;

  // Step 3: Create or find Supabase user via admin API
  const adminClient = createAdminClient();
  const email = `wechat_${openid}@lifeclone.internal`;

  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });

  if (linkError || !linkData?.properties?.action_link) {
    console.error('Supabase generateLink error:', linkError);
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
  }

  // Update user metadata with WeChat info
  if (linkData.user) {
    await adminClient.auth.admin.updateUserById(linkData.user.id, {
      user_metadata: {
        wechat_openid: openid,
        wechat_unionid: unionid || null,
        username: nickname,
        avatar_url: headimgurl,
        provider: 'wechat',
      },
    });
  }

  // Step 4: Verify OTP to establish session (sets cookies)
  const actionLink = linkData.properties.action_link;
  const tokenHash = new URL(actionLink).searchParams.get('token_hash');

  if (!tokenHash) {
    console.error('No token_hash in magic link');
    return NextResponse.redirect(new URL('/login?error=token_missing', request.url));
  }

  // Use SSR client with response-based cookie handler
  const response = NextResponse.redirect(new URL('/', request.url));

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'magiclink',
  });

  if (verifyError) {
    console.error('OTP verify error:', verifyError);
    return NextResponse.redirect(new URL('/login?error=session_failed', request.url));
  }

  // Clear OAuth state cookie
  response.cookies.set('wechat_oauth_state', '', { maxAge: 0, path: '/' });
  return response;
}
