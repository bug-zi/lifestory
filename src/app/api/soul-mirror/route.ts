import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { callAI } from '@/lib/ai-providers';
import type { AIConfig } from '@/types';

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  // Fetch user's library with script details
  const { data: items } = await supabase
    .from('my_library')
    .select('script_id, saved_at, scripts(title, category, era, tags, mood, word_count, content)')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false });

  if (!items || items.length === 0) {
    return NextResponse.json({ error: '人生库为空，无法生成灵魂画像' }, { status: 400 });
  }

  // Build summary data (don't send full content to save tokens)
  const lifeSummaries = items.map((item: Record<string, unknown>) => {
    const script = item.scripts as Record<string, unknown> | null;
    return {
      title: script?.title || '未命名',
      category: script?.category || '未知',
      era: script?.era || '未知',
      tags: script?.tags || [],
      mood: script?.mood || null,
      wordCount: script?.word_count || 0,
    };
  });

  const categoryCounts: Record<string, number> = {};
  const eraCounts: Record<string, number> = {};
  const moodCounts: Record<string, number> = {};
  const allTags: string[] = [];

  for (const s of lifeSummaries) {
    const cat = s.category as string;
    const era = s.era as string;
    const mood = s.mood as string;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    eraCounts[era] = (eraCounts[era] || 0) + 1;
    if (mood) moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    for (const t of s.tags as string[]) allTags.push(t);
  }

  const topCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const topEras = Object.entries(eraCounts).sort((a, b) => b[1] - a[1]);
  const topMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
  const uniqueTags = [...new Set(allTags)];

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

  const prompt = `你是一位洞悉人性的灵魂观察者。根据以下数据，为这个人生探索者生成一份「灵魂画像」。

## 探索者数据

- 共收藏了 ${lifeSummaries.length} 条人生副本
- 偏爱类别：${topCategories.map(([k, v]) => `${k}(${v}次)`).join('、')}
- 偏爱时代：${topEras.map(([k, v]) => `${k}(${v}次)`).join('、')}
${topMoods.length > 0 ? `- 常见心境：${topMoods.map(([k, v]) => `${k}(${v}次)`).join('、')}` : ''}
- 标签云：${uniqueTags.slice(0, 20).join('、')}
- 所有体验的副本：${lifeSummaries.map(s => s.title).join('、')}

## 输出格式（严格遵守）

请用以下 JSON 格式输出：

{
  "soulTitle": "一个2-4字的灵魂称谓，如「自由浪子」「权力信徒」「暗夜行者」",
  "soulColor": "一个代表灵魂的颜色描述，如「墨色中透出一缕金光」",
  "soulAnimal": "灵魂对应的动物，如「孤狼」「白鹤」",
  "coreTrait": "核心性格特征，一句话，不超过20字",
  "shadow": "被压抑的阴暗面，一句话，不超过20字",
  "destiny": "命运关键词，3-5个",
  "mirrorNarrative": "灵魂画像正文，200-300字，像在描述一个真实存在的人。要有洞察力，不要鸡汤，不要说教。直接指出矛盾和盲点。结尾用一个意象收束。",
  "advice": "给这个灵魂的建议，一句话，犀利但不刻薄",
  "missingPiece": "他/她还没探索但灵魂深处渴望的人生方向"
}

## 规则
- 不要使用任何emoji
- 不要说教、不要鸡汤
- 要有洞察力，指出矛盾和盲点
- 语气像一个老朋友在深夜和你说话
- 不要用"仿佛""犹如"等比喻词`;

  try {
    const text = await callAI(aiConfig, prompt, { maxTokens: 1500, temperature: 0.9 });
    const stripped = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(stripped);

    return NextResponse.json({ soul: result, stats: { totalLives: lifeSummaries.length, topCategories, topEras } });
  } catch (e) {
    return NextResponse.json({ error: '灵魂画像生成失败，请重试' }, { status: 500 });
  }
}
