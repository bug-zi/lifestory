import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { callAI } from '@/lib/ai-providers';
import type { AIConfig } from '@/types';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { ai_config } = await request.json() as { ai_config: AIConfig };

  if (!ai_config?.provider || !ai_config?.api_key || !ai_config?.model) {
    return NextResponse.json({ ok: false, error: '请完整填写服务商、模型和 API Key' });
  }

  try {
    const start = Date.now();
    const reply = await callAI(ai_config, '请回复"连接成功"四个字，不要回复其他内容。', {
      maxTokens: 20,
      temperature: 0,
    });
    const latency = Date.now() - start;

    return NextResponse.json({
      ok: true,
      reply: reply.trim(),
      latency,
      provider: ai_config.provider,
      model: ai_config.model,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '连接失败';
    return NextResponse.json({ ok: false, error: message });
  }
}
