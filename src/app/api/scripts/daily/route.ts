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

  // Get a random script, excluding completed ones for logged-in users
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

  // Exclude completed scripts for logged-in users
  let available = scripts;
  if (user) {
    const { data: completed } = await supabase
      .from('completed_scripts')
      .select('script_id')
      .eq('user_id', user.id);

    if (completed && completed.length > 0) {
      const completedIds = new Set(completed.map((r) => r.script_id));
      available = scripts.filter((s) => !completedIds.has(s.id));
    }
  }

  if (available.length === 0) {
    return NextResponse.json(
      { error: '你已读完全部副本', allCompleted: true },
      { status: 200 }
    );
  }

  // Random selection
  const randomIndex = Math.floor(Math.random() * available.length);
  const script = available[randomIndex];

  // Increment view count
  await supabase
    .from('scripts')
    .update({ view_count: script.view_count + 1 })
    .eq('id', script.id);

  return NextResponse.json({ script });
}
