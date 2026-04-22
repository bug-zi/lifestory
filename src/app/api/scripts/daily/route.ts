import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createServerSupabaseClient();

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Check if member (members have unlimited access)
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_member, member_expires_at')
      .eq('id', user.id)
      .single();

    const isMember =
      profile?.is_member &&
      profile.member_expires_at &&
      new Date(profile.member_expires_at) > new Date();

    if (!isMember) {
      // Check token balance
      const { data: token } = await supabase
        .from('user_tokens')
        .select('balance')
        .eq('user_id', user.id)
        .eq('token_type', 'script')
        .single();

      if (!token || token.balance <= 0) {
        return NextResponse.json(
          { error: '副本印记不足' },
          { status: 402 }
        );
      }

      // Deduct token
      await supabase.rpc('deduct_token', {
        p_user_id: user.id,
        p_token_type: 'script',
        p_amount: 1,
        p_reason: '阅读副本',
      });
    }
  }

  // Get a random script using database function
  // Use date-based seed for "daily" feel, but allow multiple reads
  const { data: scripts, error } = await supabase
    .from('scripts')
    .select('*')
    .eq('is_official', true);

  if (error || !scripts || scripts.length === 0) {
    return NextResponse.json(
      { error: '暂无可用副本' },
      { status: 404 }
    );
  }

  // Random selection
  const randomIndex = Math.floor(Math.random() * scripts.length);
  const script = scripts[randomIndex];

  // Increment view count
  await supabase
    .from('scripts')
    .update({ view_count: script.view_count + 1 })
    .eq('id', script.id);

  return NextResponse.json({ script });
}
