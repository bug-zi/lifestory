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

  const { input_life } = await request.json();

  if (!input_life) {
    return NextResponse.json({ error: '请输入想体验的人生' }, { status: 400 });
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

  const prompt = `你是一个人生体验设计师。用户想体验"${input_life}"的人生。

请为用户生成一段**人生概览介绍**，帮助用户了解这个人生的真实面貌。

## 要求

1. **字数**：200-300字
2. **结构**：
   - 第一句：用一句话定义这个人生（"XX是一条..."）
   - 中间：描述这个人生的典型阶段/关键特征（3-4句话）
   - 最后：点出这个人生的核心矛盾或终极挑战

3. **风格**：
   - 真实、不美化、不贬低
   - 用具体细节（数字、地点、场景）
   - 有画面感，让用户能"看到"这个人生

4. **禁止**：
   - 不要用比喻句（"仿佛""犹如"）
   - 不要说教或鸡汤
   - 不要用"你会经历..."这种第二人称，用客观叙述
   - 不要使用任何emoji表情符号

## 示例格式

**总统**：总统是一个国家最高权力的执掌者，这条路从社区活动人士开始，经历市议员、州长、联邦选举，最终入主白宫。四年一届的选举周期意味着你永远在下一次竞选中，内阁成员、国会、最高法院、外国盟友、媒体——所有人都在审视你的每一个决定。战争与和平只能二选一，经济危机和道德困境接踵而至。当核按钮在你手边时，你准备好独自承担全人类的命运了吗？

## 输出

直接返回介绍文字，不要任何JSON包装或格式标记。`;

  try {
    const introduction = await callAI(aiConfig, prompt, { maxTokens: 800, temperature: 0.7 });

    return NextResponse.json({
      introduction: introduction.trim(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '生成介绍失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
