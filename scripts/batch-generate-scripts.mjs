/**
 * 批量生成人生副本脚本
 * 零依赖，仅使用 Node 18+ 原生 fetch
 *
 * 用法：node scripts/batch-generate-scripts.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── 加载 .env.local ────────────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env.local');
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 缺少必要环境变量：OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// ─── 20 个人生副本主题 ──────────────────────────────────────────────
const TOPICS = [
  { title: '战地记者', subtitle: '从炮火中传递真相的人', tags: ['战争', '新闻', '纪实', '勇气'], mood: 'dark', category: '新闻', era: '现代', emoji: '📰' },
  { title: '米其林厨师', subtitle: '从洗碗工到三星的厨房修行', tags: ['美食', '追梦', '匠心', '奋斗'], mood: 'passionate', category: '美食', era: '现代', emoji: '🍳' },
  { title: '宇航员', subtitle: '从小镇到太空的失重人生', tags: ['航天', '科学', '孤独', '探索'], mood: 'inspiring', category: '航天', era: '现代', emoji: '🚀' },
  { title: 'FBI侧写师', subtitle: '在连环杀手脑海里行走的人', tags: ['犯罪', '心理', '悬疑', '黑暗'], mood: 'dark', category: '犯罪', era: '现代', emoji: '🔍' },
  { title: '街头涂鸦艺术家', subtitle: '从地铁隧道到苏富比拍卖行', tags: ['艺术', '街头', '叛逆', '创造'], mood: 'passionate', category: '艺术', era: '现代', emoji: '🎨' },
  { title: '外科医生', subtitle: '生死线上的十二小时', tags: ['医疗', '生死', '压力', '责任'], mood: 'dark', category: '医疗', era: '现代', emoji: '🔪' },
  { title: '奥运短跑冠军', subtitle: '九秒六九的重量', tags: ['体育', '奥运', '速度', '荣耀'], mood: 'passionate', category: '体育', era: '现代', emoji: '🏃' },
  { title: '独立电影导演', subtitle: '三十万拍出的金棕榈', tags: ['电影', '创作', '独立', '艺术'], mood: 'inspiring', category: '电影', era: '现代', emoji: '🎬' },
  { title: '硅谷创业者', subtitle: '从车库到纳斯达克敲钟', tags: ['创业', '科技', '商业', '野心'], mood: 'passionate', category: '商业', era: '现代', emoji: '💻' },
  { title: '深海潜水员', subtitle: '一百米下的黑暗与寂静', tags: ['探险', '海洋', '孤独', '极限'], mood: 'dark', category: '探险', era: '现代', emoji: '🤿' },
  { title: '珠峰登山家', subtitle: '死亡地带里的每一步', tags: ['登山', '极限', '生死', '自然'], mood: 'dark', category: '探险', era: '现代', emoji: '⛰️' },
  { title: '朋克摇滚乐手', subtitle: '从地下室到温布利球场', tags: ['音乐', '摇滚', '叛逆', '热血'], mood: 'passionate', category: '音乐', era: '现代', emoji: '🎸' },
  { title: '冷战间谍', subtitle: '柏林墙两边的双重人生', tags: ['间谍', '冷战', '背叛', '悬疑'], mood: 'dark', category: '谍战', era: '近代', emoji: '🕵️' },
  { title: '战斗机飞行员', subtitle: '三马赫速度下的生死决断', tags: ['军事', '飞行', '战争', '勇气'], mood: 'passionate', category: '军事', era: '现代', emoji: '✈️' },
  { title: '量子物理学家', subtitle: '追捕上帝粒子的三十年', tags: ['科学', '物理', '执念', '真理'], mood: 'inspiring', category: '科学', era: '现代', emoji: '⚛️' },
  { title: '野生动物摄影师', subtitle: '与狮群共处的三百天', tags: ['自然', '摄影', '冒险', '生命'], mood: 'inspiring', category: '自然', era: '现代', emoji: '📸' },
  { title: '职业扑克玩家', subtitle: '德州扑克桌上的暗面', tags: ['赌博', '心理', '风险', '策略'], mood: 'dark', category: '竞技', era: '现代', emoji: '🃏' },
  { title: '大航海时代水手', subtitle: '绕过好望角的亡命之旅', tags: ['航海', '冒险', '历史', '勇气'], mood: 'passionate', category: '冒险', era: '古代', emoji: '⚓' },
  { title: '京剧名角', subtitle: '台上一分钟台下十年功', tags: ['京剧', '艺术', '传承', '匠心'], mood: 'inspiring', category: '艺术', era: '近代', emoji: '🎭' },
  { title: '战地军医', subtitle: '诺曼底海滩上的无影灯', tags: ['战争', '医疗', '生死', '人性'], mood: 'dark', category: '军事', era: '近代', emoji: '⚔️' },
];

// ─── Prompt 构建器（与 DIY 生成保持一致，但适配官方副本格式）────────
function buildBatchPrompt(topic) {
  return `你是一个顶级纪实文学作家。请写一篇沉浸式人生体验故事，质量必须达到出版物级别。

## 核心规则（必须严格遵守）

1. **视角**：全程使用第二人称"你"叙述，读者就是主角
2. **结构**：分8-12个人生阶段，每个阶段标题以emoji开头（如"🥀 童年：在暴力中觉醒"、"🎮 觉醒：从黑暗到光明"），用换行分隔不同阶段
3. **篇幅**：总字数5000-6500字，每个阶段400-700字
4. **叙事风格**：纪实文学风格，像在讲一个真实发生过的人生。不煽情、不说教、不灌鸡汤
5. **细节密度**：每个段落必须有具体的数字、地点、物品、对话。说"650美元买了入门控制器"，不说"花了不少钱买设备"
6. **情感克制**：用事实和细节传递情绪，不直接说"你很伤心/开心"。读者自己感受到的情绪才是真的
7. **行业术语**：大量使用${topic.title}领域的真实术语、黑话、行规，让内行觉得这就是真的
8. **人物弧线**：主角必须经历 觉醒→学徒→入行→巅峰→危机→结局 完整弧线
9. **对手/参照人物**：必须有一个贯穿全文的对照人物，推动主角成长或构成对比
10. **结局**：不要大团圆。留有余味。最好的结局让读者沉默30秒

## 写作禁忌
- 禁止使用"仿佛""犹如""宛如"等比喻词
- 禁止每段开头都用"你"
- 禁止出现"命运的齿轮开始转动"等网文套话
- 禁止在结尾总结人生道理
- 不要在最开头加"副本X：${topic.title}"这样的总标题行
- 不要在开头写"今天你要体验的人生副本是..."

## 主题

体验的人生：${topic.title}
副标题指引：${topic.subtitle}

## 输出要求

第一行直接从第一个emoji阶段标题开始。故事写完后，另起一行输出（用三个短横线分隔）：

---

## 最终总结
用2-3句话总结这个人的一生，语气冷静克制，像墓志铭一样精炼。

## 高光句子
从故事中挑选5-8句最震撼人心的句子（必须是故事原文中的原句），每句单独一行，用「」包裹。这些句子应该覆盖人生的不同阶段，能让人不读全文也被击中。`;
}

// ─── OpenAI API 调用 ────────────────────────────────────────────────
async function callOpenAI(prompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 16000,
      temperature: 0.85,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`OpenAI API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ─── Supabase 插入 ──────────────────────────────────────────────────
async function insertScript(topic, content) {
  const wordCount = content.replace(/\s/g, '').length;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/scripts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      title: topic.title,
      subtitle: topic.subtitle,
      content,
      tags: topic.tags,
      mood: topic.mood,
      category: topic.category,
      era: topic.era,
      word_count: wordCount,
      is_official: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Supabase insert error (${res.status}): ${err}`);
  }

  return res.json();
}

// ─── 主流程 ─────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const startIndex = args[0] ? parseInt(args[0], 10) - 1 : 0;
  const count = args[1] ? parseInt(args[1], 10) : TOPICS.length;
  const topics = TOPICS.slice(startIndex, startIndex + count);

  console.log(`\n🚀 开始批量生成 ${topics.length} 篇人生副本（#${startIndex + 1} - #${startIndex + topics.length}）\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const num = startIndex + i + 1;
    console.log(`\n[${num}/${startIndex + topics.length}] ⏳ 正在生成：${topic.emoji} ${topic.title} — ${topic.subtitle}`);

    try {
      // 生成内容
      const prompt = buildBatchPrompt(topic);
      console.log(`   → 调用 OpenAI gpt-4o ...`);
      const content = await callOpenAI(prompt);

      if (!content || content.length < 1000) {
        throw new Error(`生成内容过短 (${content.length} 字符)`);
      }

      // 插入数据库
      console.log(`   → 插入 Supabase (${content.replace(/\s/g, '').length} 字) ...`);
      const result = await insertScript(topic, content);
      success++;
      console.log(`   ✅ 完成！id: ${result[0]?.id?.slice(0, 8) || 'unknown'}`);
    } catch (err) {
      failed++;
      console.error(`   ❌ 失败: ${err.message}`);
    }

    // 避免 rate limit，间隔 3 秒
    if (i < topics.length - 1) {
      console.log(`   ⏸  等待 3 秒...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`📊 生成完成：✅ ${success} 成功 / ❌ ${failed} 失败 / 共 ${topics.length} 篇`);
  console.log(`${'═'.repeat(50)}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
