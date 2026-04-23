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

  const { script_id } = await request.json();
  if (!script_id) {
    return NextResponse.json({ error: '缺少 script_id' }, { status: 400 });
  }

  // Fetch script content
  const { data: script } = await supabase
    .from('scripts')
    .select('id, title, content, category, era')
    .eq('id', script_id)
    .single();

  if (!script) {
    return NextResponse.json({ error: '副本不存在' }, { status: 404 });
  }

  // Get AI config
  const { data: profile } = await supabase
    .from('profiles')
    .select('ai_config')
    .eq('id', user.id)
    .single();

  const userConfig = profile?.ai_config as AIConfig | null;
  const fallbackConfig: AIConfig = {
    provider: 'chatgpt',
    api_key: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4o-mini',
  };
  const aiConfig = (userConfig?.api_key) ? userConfig : fallbackConfig;

  const prompt = `你是一位文学编辑，擅长从长篇故事中提取最触动人心的句子。

请从以下人生副本故事中，提取一句最有冲击力、最令人回味的句子作为「人生明信片」文案。

## 故事内容
${(script.content as string).slice(0, 8000)}

## 要求
1. 只提取原文中的一句话，不要改写
2. 这句话要有画面感和情感冲击力
3. 长度在15-50字之间
4. 不要使用任何emoji
5. 不要选"你"开头的句子（因为脱离上下文会奇怪）

## 输出格式
只输出这句话本身，不要任何其他文字、标点包装或解释。`;

  try {
    const quote = await callAI(aiConfig, prompt, { maxTokens: 200, temperature: 0.5 });
    const cleanQuote = quote.trim().replace(/^[""「」]|[""「」]$/g, '');

    return NextResponse.json({
      quote: cleanQuote,
      title: script.title,
      category: script.category,
      era: script.era,
    });
  } catch {
    return NextResponse.json({ error: '明信片生成失败' }, { status: 500 });
  }
}
