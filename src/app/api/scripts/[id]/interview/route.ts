import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { callAI } from '@/lib/ai-providers';

// POST /api/scripts/[id]/interview — 与主角对话
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  // 检查会员/印记
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_member, member_expires_at')
    .eq('id', user.id)
    .single();

  const isMember =
    profile?.is_member &&
    profile.member_expires_at &&
    new Date(profile.member_expires_at) > new Date();

  // 非会员检查是否已有对话记录（首次扣费，后续免费）
  if (!isMember) {
    const { data: existingMsgs } = await supabase
      .from('interview_messages')
      .select('id')
      .eq('user_id', user.id)
      .eq('script_id', id)
      .limit(1);

    if (!existingMsgs || existingMsgs.length === 0) {
      // 首次对话，扣除印记
      const { data: token } = await supabase
        .from('user_tokens')
        .select('balance')
        .eq('user_id', user.id)
        .eq('token_type', 'script')
        .single();

      if (!token || token.balance <= 0) {
        return NextResponse.json({ error: '副本印记不足' }, { status: 402 });
      }

      await supabase.rpc('deduct_token', {
        p_user_id: user.id,
        p_token_type: 'script',
        p_amount: 1,
        p_reason: 'AI人生面试',
      });
    }
  }

  // 获取故事内容
  const { data: script } = await supabase
    .from('scripts')
    .select('id, title, content')
    .eq('id', id)
    .single();

  if (!script) {
    return NextResponse.json({ error: '副本不存在' }, { status: 404 });
  }

  // 提取纯故事内容（去掉最终总结和高光句子）
  let storyContent = script.content;
  const cutIdx = storyContent.search(/\n---\n/);
  if (cutIdx > 0) storyContent = storyContent.slice(0, cutIdx);
  else {
    const summaryCut = storyContent.search(/\n##\s*最终总结/);
    if (summaryCut > 0) storyContent = storyContent.slice(0, summaryCut);
  }

  // 限制故事长度用于 prompt（取前 4000 字）
  if (storyContent.length > 4000) storyContent = storyContent.slice(0, 4000) + '...';

  const { message } = await request.json();
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
  }

  // 获取 AI 配置
  const { data: profileFull } = await supabase
    .from('profiles')
    .select('ai_config')
    .eq('id', user.id)
    .single();

  const aiConfig = profileFull?.ai_config;
  if (!aiConfig?.api_key) {
    return NextResponse.json({ error: '请先配置 AI 密钥' }, { status: 400 });
  }

  // 保存用户消息
  await supabase.from('interview_messages').insert({
    user_id: user.id,
    script_id: id,
    role: 'user',
    content: message,
  });

  // 获取最近 10 条对话作为上下文
  const { data: history } = await supabase
    .from('interview_messages')
    .select('role, content')
    .eq('user_id', user.id)
    .eq('script_id', id)
    .order('created_at', { ascending: false })
    .limit(11); // 10 history + the one we just inserted

  const contextMessages = (history || [])
    .reverse()
    .slice(-10)
    .map(m => ({ role: m.role === 'user' ? 'user' as const : 'assistant' as const, content: m.content }));

  const systemPrompt = `你是《${script.title}》的主角。以下是你的完整人生经历：

${storyContent}

规则：
1. 始终以第一人称"我"回答
2. 语气符合角色的性格和处境
3. 只基于故事中已有的经历回答，不要编造新情节
4. 可以分享内心感受、思考和遗憾
5. 保持角色的时代感和职业特征
6. 回答简洁，每次不超过200字
7. 不要说"根据故事"、"在故事中"等打破角色的用语`;

  // 构建 messages 数组
  const aiMessages = [
    { role: 'user' as const, content: systemPrompt },
    { role: 'assistant' as const, content: '好，我已经准备好。你可以问我任何关于我人生的问题。' },
    ...contextMessages,
  ];

  try {
    // 使用 OpenAI 兼容格式的多轮对话
    const PROVIDER_ENDPOINTS: Record<string, string> = {
      deepseek: 'https://api.deepseek.com/v1/chat/completions',
      doubao: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      zhipu: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      chatgpt: 'https://api.openai.com/v1/chat/completions',
    };

    const endpoint = PROVIDER_ENDPOINTS[aiConfig.provider];
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.api_key}`,
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: aiMessages,
        max_tokens: 512,
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`AI API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || '...';

    // 保存 AI 回复
    await supabase.from('interview_messages').insert({
      user_id: user.id,
      script_id: id,
      role: 'assistant',
      content: reply,
    });

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '对话失败';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET /api/scripts/[id]/interview — 获取对话历史
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ messages: [] });
  }

  const { data: messages } = await supabase
    .from('interview_messages')
    .select('*')
    .eq('user_id', user.id)
    .eq('script_id', id)
    .order('created_at', { ascending: true });

  return NextResponse.json({ messages: messages || [] });
}
