import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { callAI } from '@/lib/ai-providers';
import type { AIConfig } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const personId = parseInt(id);
  const { questions } = await request.json();

  const { data: person } = await supabase
    .from('hall_of_fame')
    .select('name, intro, category, era')
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

  const qaText = questions
    ?.filter((q: { question: string; answer: string }) => q.answer)
    .map((q: { question: string; answer: string }) => `${q.question}\n用户选择：${q.answer}`)
    .join('\n\n') || '';

  const prompt = `你是一个顶级纪实文学作家。请以第二人称"你"的视角，写一篇沉浸式人生体验故事，让读者体验${person.name}的一生。

## 核心规则（必须严格遵守）

1. **视角**：全程使用第二人称"你"叙述，读者就是${person.name}
2. **结构**：分8-12个人生阶段，每个阶段用emoji+标题标注
3. **篇幅**：总字数6000-8000字
4. **叙事风格**：纪实文学风格，像在讲一个真实发生过的人生
5. **细节密度**：每个段落必须有具体的数字、地点、物品、对话
6. **历史背景**：融入${person.era}时期的历史背景和社会环境
7. **人物弧线**：主角必须经历完整的成长弧线
8. **结局**：不要大团圆，留有余味

## 人物信息
姓名：${person.name}
类别：${person.category}
时代：${person.era}
简介：${person.intro || ''}

${qaText ? `## 用户的个性化选择\n${qaText}` : ''}

## 输出要求
直接输出故事正文，不要标题行，不要前言后记。第一行从第一个emoji阶段开始。`;

  try {
    const generatedContent = await callAI(aiConfig, prompt, { maxTokens: 16000 });

    const { data: script, error: scriptError } = await supabase
      .from('scripts')
      .insert({
        title: `${person.name}的一生`,
        content: generatedContent,
        tags: ['名人堂', person.category],
        mood: '震撼',
        category: '冒险',
        word_count: generatedContent.length,
        author_id: user.id,
        is_official: false,
      })
      .select()
      .single();

    if (scriptError) throw scriptError;

    await supabase
      .from('hall_of_fame_explorations')
      .upsert({
        user_id: user.id,
        person_id: personId,
        explored: true,
        script_id: script.id,
      }, { onConflict: 'user_id,person_id' });

    return NextResponse.json({ script });
  } catch (err) {
    const message = err instanceof Error ? err.message : '生成失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
