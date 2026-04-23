import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { callAI } from '@/lib/ai-providers';
import type { AIConfig } from '@/types';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const personId = parseInt(id);

  const { data: person } = await supabase
    .from('hall_of_fame')
    .select('name, intro, category')
    .eq('id', personId)
    .single();

  if (!person) {
    return NextResponse.json({ error: '人物不存在' }, { status: 404 });
  }

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

  const prompt = `你是历史情景模拟专家。根据以下人物介绍，生成4个关键人生抉择时刻的情景选择题。

## 核心规则
1. 每个问题代表该人物人生中的一个重要转折点
2. 提供4个选项，每个选项代表不同的决策方向
3. 必须基于真实历史背景，选项可包含假设性路径
4. 标注每个问题对应的人生阶段
5. 选项要具体有代入感，像在讲一个故事

## 人物信息
姓名：${person.name}
类别：${person.category}
简介：${person.intro || '暂无详细简介'}

直接输出JSON数组，不要其他文字：
[{"id":1,"stage":"阶段名","question":"情景描述...你会","options":["选项A","选项B","选项C","选项D"]}]`;

  try {
    const response = await callAI(aiConfig, prompt, { maxTokens: 2000 });

    // Strip markdown code fences if AI wraps output
    const stripped = response.replace(/```(?:json)?\s*/g, '').replace(/```/g, '');
    const jsonMatch = stripped.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI返回格式错误' }, { status: 500 });
    }

    // Clean control characters (newlines, tabs, etc.) that break JSON.parse
    const cleaned = jsonMatch[0].replace(/[\x00-\x1f\x7f]/g, (ch) => {
      if (ch === '\n' || ch === '\r') return ' ';
      if (ch === '\t') return ' ';
      return '';
    });

    const questions = JSON.parse(cleaned);
    return NextResponse.json({ questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : '生成问题失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
