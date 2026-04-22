import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { AIConfig } from '@/types';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, ai_config, is_member, member_expires_at, created_at')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mask API key before sending to client
  if (profile?.ai_config?.api_key) {
    profile.ai_config.api_key = maskKey(profile.ai_config.api_key);
  }

  return NextResponse.json({ profile });
}

export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.username !== undefined) {
    updates.username = body.username;
  }
  if (body.avatar_url !== undefined) {
    updates.avatar_url = body.avatar_url;
  }

  // Handle AI config update
  if (body.ai_config !== undefined) {
    const newConfig = body.ai_config as AIConfig;
    // If api_key is masked (contains •••), keep the old one
    if (newConfig.api_key && newConfig.api_key.includes('•••')) {
      const { data: current } = await supabase
        .from('profiles')
        .select('ai_config')
        .eq('id', user.id)
        .single();
      newConfig.api_key = current?.ai_config?.api_key || '';
    }
    updates.ai_config = newConfig;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select('id, username, avatar_url, ai_config, is_member, member_expires_at, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (profile?.ai_config?.api_key) {
    profile.ai_config.api_key = maskKey(profile.ai_config.api_key);
  }

  return NextResponse.json({ profile });
}

function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}
