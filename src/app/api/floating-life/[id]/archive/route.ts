import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: story, error: fetchError } = await supabase
    .from('floating_life_stories')
    .select('is_archived')
    .eq('id', id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: '故事不存在' }, { status: 404 });
  }

  const newArchived = !story?.is_archived;

  const { error } = await supabase
    .from('floating_life_stories')
    .update({
      is_archived: newArchived,
      archived_at: newArchived ? new Date().toISOString() : null,
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ is_archived: newArchived });
}
