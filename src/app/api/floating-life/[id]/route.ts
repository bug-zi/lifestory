import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: story, error } = await supabase
    .from('floating_life_stories')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !story) {
    return NextResponse.json({ error: '故事不存在' }, { status: 404 });
  }

  // Increment view count using admin client (fire-and-forget)
  createAdminClient()
    .from('floating_life_stories')
    .update({ view_count: story.view_count + 1 })
    .eq('id', id)
    .then(() => {});

  return NextResponse.json({ story });
}
