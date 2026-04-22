import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const era = searchParams.get('era');
  const country = searchParams.get('country');
  const search = searchParams.get('search');

  let query = supabase
    .from('hall_of_fame')
    .select('*')
    .order('id', { ascending: true });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (era && era !== 'all') {
    query = query.eq('era', era);
  }

  if (country && country !== 'all') {
    query = query.eq('country', country);
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data });
}
