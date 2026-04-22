import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/library - list user's library
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  // 先获取 library 项
  const { data: items, error: libError } = await supabase
    .from('my_library')
    .select('*')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false });

  if (libError) {
    return NextResponse.json({ error: libError.message }, { status: 500 });
  }

  // 收集所有 script_id
  const scriptIds = items?.map(item => item.script_id).filter(Boolean) || [];

  // 单独查询 scripts（避免 JOIN 失效问题）
  const { data: scripts } = await supabase
    .from('scripts')
    .select('*')
    .in('id', scriptIds.length > 0 ? scriptIds : ['00000000-0000-0000-0000-000000000000']);

  // 创建 script 映射
  const scriptMap = new Map(scripts?.map(s => [s.id, s]) || []);

  // 手动合并数据
  const itemsWithScripts = items?.map(item => ({
    ...item,
    script: scriptMap.get(item.script_id) || null,
  })) || [];

  return NextResponse.json({ items: itemsWithScripts });
}

// POST /api/library - save script to library
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const body = await request.json();
  const { script_id, custom_content, note } = body;

  const { error } = await supabase
    .from('my_library')
    .upsert({
      user_id: user.id,
      script_id,
      custom_content: custom_content || null,
      is_customized: !!custom_content,
      note: note || null,
      saved_at: new Date().toISOString(),
    }, { onConflict: 'user_id,script_id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/library - remove from library
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { script_id } = await request.json();

  const { error } = await supabase
    .from('my_library')
    .delete()
    .eq('user_id', user.id)
    .eq('script_id', script_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
