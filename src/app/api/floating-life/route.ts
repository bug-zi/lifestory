import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');
  const era = searchParams.get('era');
  const search = searchParams.get('search');
  const archived = searchParams.get('archived');

  let query = supabase
    .from('floating_life_stories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (source && source !== 'all') {
    query = query.eq('source', source);
  }

  if (era && era !== 'all') {
    query = query.eq('era', era);
  }

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  if (archived === 'true') {
    query = query.eq('is_archived', true);
  } else if (archived === 'false') {
    query = query.eq('is_archived', false);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch user's readings if authenticated
  const { data: { user } } = await supabase.auth.getUser();
  let readings: string[] = [];

  if (user) {
    const { data: readData } = await supabase
      .from('floating_life_readings')
      .select('story_id')
      .eq('user_id', user.id);
    readings = readData?.map((r) => r.story_id) ?? [];
  }

  return NextResponse.json({ items: data, readings });
}
