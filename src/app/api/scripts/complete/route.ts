import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { script_id } = await request.json();
  if (!script_id) {
    return NextResponse.json({ error: '缺少 script_id' }, { status: 400 });
  }

  const { error } = await supabase
    .from('completed_scripts')
    .upsert({ user_id: user.id, script_id }, { onConflict: 'user_id,script_id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ completed: [] });
  }

  const { data } = await supabase
    .from('completed_scripts')
    .select('script_id')
    .eq('user_id', user.id);

  return NextResponse.json({
    completed: data?.map((r) => r.script_id) ?? [],
  });
}
