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
  const body = await request.json().catch(() => ({}));
  const questions = body.questions || [];

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

  const isFictional = person.category === '文学' || person.category === '影视';

  const commonRules = `## 核心规则（必须严格遵守）

1. **视角**：全程使用第二人称"你"叙述，读者就是${person.name}
2. **结构**：分8-12个人生阶段，每个阶段用「## 标题」标注
3. **篇幅**：总字数6000-8000字
4. **细节密度**：每个段落必须有具体的场景、物品、对话
5. **人物弧线**：主角必须经历完整的成长弧线
6. **结局**：不要大团圆，留有余味
7. **禁止emoji**：不要使用任何emoji表情符号`;

  const prompt = isFictional
    ? `你是一个顶级文学改写大师，精通将经典小说和影视作品中的虚构角色人生，改编为沉浸式的第二人称体验故事。

${commonRules}
8. **原著忠诚**：必须严格遵循原著小说/影视剧的剧情线，人物经历、关键事件、人际关系、结局都必须忠于原作，禁止魔改、禁止穿越到现代、禁止架空重写
9. **世界观还原**：故事必须在原著设定的世界观中展开，使用原著中的地名、门派、武功、物品等专有名词
10. **经典场景还原**：必须覆盖原著中最经典的3-5个名场面，用沉浸式描写让读者重新经历这些时刻
11. **禁止现代元素**：绝对不要出现手机、学校、校服、景区、人民币等现代事物，保持原著的时代感

## 人物信息
姓名：${person.name}
类别：${person.category}
时代：${person.era}
简介：${person.intro || ''}

## 原著剧情遵循指南
你必须严格按照${person.name}在原著中的真实经历来写，按照时间线展开。以下是关键要求：
- 开头从角色的身世/出场写起，忠于原著设定
- 中间按原著剧情推进，涵盖所有重要转折点
- 结局忠于原著的最终结局（无论是悲剧、开放式还是圆满结局）
- 对话要体现角色的性格特征和语言风格
- 配角出场要与原著一致（如亲友、对手、爱人等）

${qaText ? `## 用户的个性化选择\n${qaText}` : ''}

## 输出要求
直接输出故事正文，不要标题行，不要前言后记。第一行从第一个阶段标题开始（用##标记）。

故事写完后，另起一行输出以下内容（用三个短横线分隔）：

---

## 最终总结
用2-3句话总结这个角色的一生，语气冷静克制，像墓志铭一样精炼。

## 高光句子
从故事中挑选5-8句最震撼人心的句子（必须是故事原文中的原句），每句单独一行，用「」包裹。这些句子应该覆盖人生的不同阶段，能让人不读全文也被击中。`
    : `你是一个顶级纪实文学作家。请以第二人称"你"的视角，写一篇沉浸式人生体验故事，让读者体验${person.name}的一生。

${commonRules}
8. **叙事风格**：纪实文学风格，像在讲一个真实发生过的人生
9. **历史背景**：融入${person.era}时期的历史背景和社会环境

## 人物信息
姓名：${person.name}
类别：${person.category}
时代：${person.era}
简介：${person.intro || ''}

${qaText ? `## 用户的个性化选择\n${qaText}` : ''}

## 输出要求
直接输出故事正文，不要标题行，不要前言后记。第一行从第一个阶段标题开始（用##标记）。

故事写完后，另起一行输出以下内容（用三个短横线分隔）：

---

## 最终总结
用2-3句话总结这个人的一生，语气冷静克制，像墓志铭一样精炼。

## 高光句子
从故事中挑选5-8句最震撼人心的句子（必须是故事原文中的原句），每句单独一行，用「」包裹。这些句子应该覆盖人生的不同阶段，能让人不读全文也被击中。`;

  try {
    const generatedContent = await callAI(aiConfig, prompt, { maxTokens: 16000 });

    // Delete old script if regenerating
    const { data: oldExploration } = await supabase
      .from('hall_of_fame_explorations')
      .select('script_id')
      .eq('user_id', user.id)
      .eq('person_id', personId)
      .single();

    if (oldExploration?.script_id) {
      await supabase.from('scripts').delete().eq('id', oldExploration.script_id);
    }

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
