import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { callAI } from '@/lib/ai-providers';
import type { AIConfig } from '@/types';

const MOODS = ['遗憾', '温暖', '离别', '思念', '重逢', '错过', '守护', '放手'];
const THEMES = [
  '一段错过多年的初恋，在某个意想不到的场景中重逢',
  '两个人因为一个误会错过，多年后真相浮出水面',
  '一对恋人在城市变迁中反复相遇又错过',
  '一个关于等待与归来的故事，跨越漫长岁月',
  '一段被时代洪流冲散的感情，在异乡重新连接',
  '两个人在生命的最后阶段重新理解了爱的含义',
  '一封迟到的信揭开了尘封多年的秘密',
  '一个关于承诺的故事——年轻时说过的话，最终以意想不到的方式兑现',
  '一段因家庭变故而中断的青梅竹马之情',
  '在人生的岔路口，选择了一条路却始终惦记着另一条路上的人',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const prompt = (mood: string, theme: string) => `你是一个顶级中文情感文学作家。请创作一篇沉浸式的情感故事。

## 核心规则（必须严格遵守）

1. **视角**：全程使用第二人称"你"叙述
2. **结构**：分5-8个章节，每个章节用「## 标题」标注
3. **篇幅**：总字数5000-8000字
4. **细节密度**：每个段落必须有具体的场景、物品、对话、感官描写
5. **情感基调**：${mood}
6. **主题**：${theme}
7. **人物弧线**：主角必须经历完整的情感变化，从一种状态到另一种状态
8. **结局**：不要大团圆，留有余味，让读者意难平
9. **禁止emoji**：不要使用任何emoji表情符号
10. **叙事风格**：像在讲述一个真实发生过的故事，克制、细腻、有画面感

## 输出格式

第一行是故事标题（不要加任何标记，直接写标题文本）。
第二行空行。
从第三行开始是故事正文，第一行从第一个章节标题开始（用##标记）。

故事写完后，另起一行输出以下内容（用三个短横线分隔）：

---

## 故事感悟
用1-2句话写出这个故事想要表达的情感内核。`;

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  // Get user's AI config
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

  if (!aiConfig.api_key) {
    return NextResponse.json({ error: '请先配置 AI API Key' }, { status: 400 });
  }

  const mood = pickRandom(MOODS);
  const theme = pickRandom(THEMES);

  try {
    const generatedContent = await callAI(aiConfig, prompt(mood, theme), { maxTokens: 16000 });

    // Parse title and content
    const lines = generatedContent.split('\n');
    let title = '无题';
    let contentStart = 0;

    // First non-empty line is the title
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed && !trimmed.startsWith('#')) {
        title = trimmed;
        contentStart = i + 1;
        break;
      }
      if (trimmed.startsWith('#') && !trimmed.startsWith('##')) {
        title = trimmed.replace(/^#+\s*/, '');
        contentStart = i + 1;
        break;
      }
    }

    const content = lines.slice(contentStart).join('\n').trim();
    const wordCount = content.replace(/[^\u4e00-\u9fff]/g, '').length;

    const { data: story, error } = await supabase
      .from('floating_life_stories')
      .insert({
        title,
        content,
        source: 'AI原创',
        mood,
        tags: [mood, 'AI生成'],
        word_count: wordCount,
        author: 'AI共创',
        sort_order: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ story });
  } catch (err) {
    const message = err instanceof Error ? err.message : '生成失败，请稍后再试';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
