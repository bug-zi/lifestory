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

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_member, member_expires_at, ai_config')
    .eq('id', user.id)
    .single();

  const isMember =
    profile?.is_member &&
    profile.member_expires_at &&
    new Date(profile.member_expires_at) > new Date();

  if (!isMember) {
    const { data: token } = await supabase
      .from('user_tokens')
      .select('balance')
      .eq('user_id', user.id)
      .eq('token_type', 'diy')
      .single();

    if (!token || token.balance <= 0) {
      return NextResponse.json({ error: 'DIY印记不足' }, { status: 402 });
    }

    await supabase.rpc('deduct_token', {
      p_user_id: user.id,
      p_token_type: 'diy',
      p_amount: 1,
      p_reason: 'DIY生成副本',
    });
  }

  const body = await request.json();
  const { input_life, questions } = body;

  const { data: generation, error } = await supabase
    .from('diy_generations')
    .insert({
      user_id: user.id,
      input_life,
      questions: questions || null,
      status: 'generating',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userConfig = profile?.ai_config as AIConfig | null;
  const fallbackConfig: AIConfig = {
    provider: 'chatgpt',
    api_key: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4o-mini',
  };
  const aiConfig = (userConfig?.api_key) ? userConfig : fallbackConfig;

  try {
    const prompt = buildPrompt(input_life, questions);
    const generatedContent = await callAI(aiConfig, prompt, { maxTokens: 16000 });

    const { data: script, error: scriptError } = await supabase
      .from('scripts')
      .insert({
        title: `${input_life}的一生`,
        content: generatedContent,
        tags: ['DIY'],
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
      .from('diy_generations')
      .update({
        generated_script_id: script.id,
        status: 'completed',
      })
      .eq('id', generation.id);

    return NextResponse.json({ script, generation_id: generation.id });
  } catch (err) {
    await supabase
      .from('diy_generations')
      .update({ status: 'failed' })
      .eq('id', generation.id);

    const message = err instanceof Error ? err.message : '生成失败，请稍后重试';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildPrompt(
  inputLife: string,
  questions: { question: string; answer: string }[] | null
): string {
  const qaText = questions
    ? questions
        .filter((q) => q.answer)
        .map((q) => `${q.question}\n用户选择：${q.answer}`)
        .join('\n\n')
    : '';

  return `你是一个顶级纪实文学作家。请写一篇沉浸式人生体验故事，质量必须达到出版物级别。

## 核心规则（必须严格遵守）

1. **视角**：全程使用第二人称"你"叙述，读者就是主角
2. **结构**：分8-12个人生阶段，每个阶段用「## 标题」标注（如"## 童年：在暴力中觉醒"）
3. **篇幅**：总字数6000-8000字，每个阶段500-900字
4. **叙事风格**：纪实文学风格，像在讲一个真实发生过的人生。不煽情、不说教、不灌鸡汤
5. **细节密度**：每个段落必须有具体的数字、地点、物品、对话。拒绝空洞描述。说"650美元买了入门控制器"，不说"花了不少钱买设备"
6. **情感克制**：用事实和细节传递情绪，不直接说"你很伤心/开心"。读者自己感受到的情绪才是真的
7. **行业术语**：大量使用${inputLife}领域的真实术语、黑话、行规，让内行觉得这就是真的
8. **人物弧线**：主角必须经历 觉醒→学徒→入行→巅峰→危机→结局 完整弧线
9. **反派/对手**：必须有一个贯穿全文的对照人物（类似马库斯加里时之于DJ），推动主角成长
10. **结局**：不要大团圆。留有余味。最好的结局让读者沉默30秒

## 写作禁忌
- 禁止使用任何emoji表情符号
- 禁止使用"仿佛""犹如""宛如"等比喻词
- 禁止每段开头都用"你"
- 禁止出现"命运的齿轮开始转动"等网文套话
- 禁止在结尾总结人生道理

## 用户定制信息

体验的人生：${inputLife}

${qaText ? `用户的个性化选择：\n${qaText}` : ''}

## 输出要求

直接输出故事正文，不要标题行，不要前言后记，不要解释。第一行就从第一个阶段标题开始（用##标记）。

故事写完后，另起一行输出以下内容（用三个短横线分隔）：

---

## 最终总结
用2-3句话总结这个人的一生，语气冷静克制，像墓志铭一样精炼。

## 高光句子
从故事中挑选5-8句最震撼人心的句子（必须是故事原文中的原句），每句单独一行，用「」包裹。这些句子应该覆盖人生的不同阶段，能让人不读全文也被击中。`;
}
