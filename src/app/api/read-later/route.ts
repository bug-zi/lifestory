import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/read-later - list user's read later items
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  // Get read_later items
  const { data: items, error: readLaterError } = await supabase
    .from('read_later')
    .select('*')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false });

  if (readLaterError) {
    return NextResponse.json({ error: readLaterError.message }, { status: 500 });
  }

  // Collect script_ids
  const scriptIds = items?.map(item => item.script_id) || [];

  // Fetch scripts separately
  const { data: scripts } = await supabase
    .from('scripts')
    .select('*')
    .in('id', scriptIds.length > 0 ? scriptIds : ['00000000-0000-0000-0000-000000000000']);

  // Create script map
  const scriptMap = new Map(scripts?.map(s => [s.id, s]) || []);

  // Merge data
  const itemsWithScripts = items?.map(item => ({
    ...item,
    script: scriptMap.get(item.script_id) || null,
  })) || [];

  return NextResponse.json({ items: itemsWithScripts });
}

// POST /api/read-later - add script to read later
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { script_id } = await request.json();

  if (!script_id) {
    return NextResponse.json({ error: '缺少剧本ID' }, { status: 400 });
  }

  // Verify script exists before inserting
  const { data: script, error: scriptCheckError } = await supabase
    .from('scripts')
    .select('id')
    .eq('id', script_id)
    .maybeSingle();

  if (scriptCheckError) {
    console.error('[read-later] Script check error:', scriptCheckError);
    return NextResponse.json({ error: '查询剧本失败' }, { status: 500 });
  }

  if (!script) {
    return NextResponse.json({ error: '剧本不存在' }, { status: 404 });
  }

  const { error } = await supabase
    .from('read_later')
    .insert({
      user_id: user.id,
      script_id,
    });

  if (error) {
    console.error('[read-later] Insert error:', error);
    // Handle unique violation (already in read later)
    if (error.code === '23505') {
      return NextResponse.json({ success: true, message: '已在稍后再读中' });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: '已添加到稍后再读' });
}

// DELETE /api/read-later - remove from read later
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { script_id } = await request.json();

  const { error } = await supabase
    .from('read_later')
    .delete()
    .eq('user_id', user.id)
    .eq('script_id', script_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
