import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { callAI } from '@/lib/ai-providers';

// GET /api/fortune — 获取今日签文
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ fortune: null });
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: fortune } = await supabase
    .from('daily_fortunes')
    .select('*')
    .eq('user_id', user.id)
    .eq('fortune_date', today)
    .single();

  return NextResponse.json({ fortune });
}

// POST /api/fortune — 求签（生成今日签文）
export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];

  // 已求过签则返回已有结果
  const { data: existing } = await supabase
    .from('daily_fortunes')
    .select('*')
    .eq('user_id', user.id)
    .eq('fortune_date', today)
    .single();

  if (existing) {
    return NextResponse.json({ fortune: existing });
  }

  // 获取用户 AI 配置
  const { data: profile } = await supabase
    .from('profiles')
    .select('ai_config')
    .eq('id', user.id)
    .single();

  const aiConfig = profile?.ai_config;
  if (!aiConfig?.api_key) {
    return NextResponse.json({ error: '请先配置 AI 密钥' }, { status: 400 });
  }

  // 获取用户最近读过的副本
  const { data: completed } = await supabase
    .from('completed_scripts')
    .select('script_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  let readHistory = '';
  let sourceTitle = null;
  let sourceId = null;

  if (completed && completed.length > 0) {
    const ids = completed.map(c => c.script_id);
    const { data: scripts } = await supabase
      .from('scripts')
      .select('id, title, tags, mood, category')
      .in('id', ids);

    if (scripts && scripts.length > 0) {
      readHistory = scripts
        .map(s => `《${s.title}》(${s.tags?.join('/') || s.category || '未知'})`)
        .join('、');
      sourceTitle = scripts[0].title;
      sourceId = scripts[0].id;
    }
  }

  if (!readHistory) {
    readHistory = '尚未阅读过人生副本';
  }

  const prompt = `你是一位古代的命运签文大师。根据用户读过的故事，生成一句个性化命运签。

用户已读过的人生：${readHistory}

要求：
1. 签文本身：一句15-30字的中国古典风格签文（七言或长短句）
2. 解签：2-3句话解读，结合用户阅读偏好给出人生启示
3. 出处：从用户读过的人生中引用一句相关的感悟（没有读过则自己写一句）
4. 语气：神秘而温暖，像一位智者的低语

格式严格如下（不要加其他内容）：
签文：xxxxxxx
解签：xxxx
出处：「xxxx」——《xxxx》`;

  try {
    const fortuneText = await callAI(aiConfig, prompt, { maxTokens: 500, temperature: 0.9 });

    // 保存签文
    const { data: fortune, error } = await supabase
      .from('daily_fortunes')
      .insert({
        user_id: user.id,
        fortune_date: today,
        fortune_text: fortuneText.trim(),
        source_title: sourceTitle,
        source_id: sourceId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ fortune });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '生成签文失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/fortune — 分享签文领奖励
export async function PUT() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: fortune } = await supabase
    .from('daily_fortunes')
    .select('*')
    .eq('user_id', user.id)
    .eq('fortune_date', today)
    .single();

  if (!fortune) {
    return NextResponse.json({ error: '今日尚未求签' }, { status: 400 });
  }

  if (fortune.shared) {
    return NextResponse.json({ error: '今日已领取分享奖励' }, { status: 400 });
  }

  // 标记已分享
  await supabase
    .from('daily_fortunes')
    .update({ shared: true })
    .eq('id', fortune.id);

  // 奖励1枚副本印记
  await supabase.rpc('add_token', {
    p_user_id: user.id,
    p_token_type: 'script',
    p_amount: 1,
    p_reason: '分享命运签',
  });

  return NextResponse.json({ success: true, reward: '1枚副本印记' });
}
