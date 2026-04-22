import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];

  // Check if already checked in today
  const { data: existing } = await supabase
    .from('check_ins')
    .select('id')
    .eq('user_id', user.id)
    .eq('check_in_date', today)
    .single();

  if (existing) {
    return NextResponse.json({ error: '今日已签到' }, { status: 400 });
  }

  // Record check-in
  const { error: checkInError } = await supabase
    .from('check_ins')
    .insert({
      user_id: user.id,
      check_in_date: today,
      reward_type: 'script',
    });

  if (checkInError) {
    return NextResponse.json({ error: checkInError.message }, { status: 500 });
  }

  // Add 1 script token
  const { error: tokenError } = await supabase.rpc('add_token', {
    p_user_id: user.id,
    p_token_type: 'script',
    p_amount: 1,
    p_reason: '每日签到',
  });

  if (tokenError) {
    return NextResponse.json({ error: tokenError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, reward: '1枚副本印记' });
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];
  const { data: checkedIn } = await supabase
    .from('check_ins')
    .select('id')
    .eq('user_id', user.id)
    .eq('check_in_date', today)
    .single();

  return NextResponse.json({ checkedIn: !!checkedIn });
}
