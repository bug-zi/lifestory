import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { data: tokens } = await supabase
    .from('user_tokens')
    .select('*')
    .eq('user_id', user.id);

  return NextResponse.json({ tokens: tokens || [] });
}
