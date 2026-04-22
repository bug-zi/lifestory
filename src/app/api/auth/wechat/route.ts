import { NextResponse } from 'next/server';

export async function GET() {
  const appId = process.env.WECHAT_APP_ID;

  if (!appId || appId === 'your_wechat_app_id') {
    return NextResponse.json(
      { error: '微信登录未配置' },
      { status: 503 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  const redirectUri = encodeURIComponent(`${baseUrl}/api/auth/wechat/callback`);
  const state = crypto.randomUUID();

  const url =
    `https://open.weixin.qq.com/connect/qrconnect` +
    `?appid=${appId}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=snsapi_login` +
    `&state=${state}#wechat_redirect`;

  const response = NextResponse.redirect(url);
  response.cookies.set('wechat_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return response;
}
