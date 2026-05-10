/**
 * 批量生成30篇新人生副本
 * 零依赖，仅使用 Node 18+ 原生 fetch
 *
 * 用法：node scripts/batch/batch-30-new.mjs [startIndex] [count]
 * 例：node scripts/batch/batch-30-new.mjs        → 全部30篇
 *     node scripts/batch/batch-30-new.mjs 1 5    → 第1~5篇
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── 加载 .env.local ────────────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(__dirname, '..', '..', '.env.local');
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

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!ANTHROPIC_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 缺少必要环境变量：ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// ─── 30 个新人生副本主题 ─────────────────────────────────────────────
const TOPICS = [
  { title: '火星殖民先驱', subtitle: '单程票上的红色星球拓荒者', tags: ['太空', '殖民', '孤独', '科学'], mood: 'dark', category: '科幻', era: '未来', emoji: '🔴' },
  { title: '顶级调香师', subtitle: '用一万种气味重建逝去的记忆', tags: ['香水', '嗅觉', '艺术', '记忆'], mood: 'inspiring', category: '艺术', era: '现代', emoji: '🌸' },
  { title: '无国界医生', subtitle: '在埃博拉疫区手握手术刀', tags: ['医疗', '人道', '生死', '勇气'], mood: 'dark', category: '医疗', era: '现代', emoji: '🏥' },
  { title: '卧底缉毒警', subtitle: '在毒枭身边潜伏的一千个日夜', tags: ['卧底', '犯罪', '正义', '牺牲'], mood: 'dark', category: '犯罪', era: '现代', emoji: '🔫' },
  { title: '歌剧女高音', subtitle: '从矿井小镇到大都会歌剧院', tags: ['歌剧', '音乐', '奋斗', '天赋'], mood: 'inspiring', category: '音乐', era: '现代', emoji: '🎵' },
  { title: '金字塔建造者', subtitle: '用二十年搬动二百三十万块石头', tags: ['古埃及', '建筑', '奴隶', '历史'], mood: 'dark', category: '历史', era: '古代', emoji: '🏛️' },
  { title: '冰球守门员', subtitle: '挡住时速一百六十公里的冰球', tags: ['冰球', '体育', '孤独', '压力'], mood: 'passionate', category: '体育', era: '现代', emoji: '🥅' },
  { title: '量子计算工程师', subtitle: '在绝对零度旁制造不可能的机器', tags: ['量子', '科技', '计算', '前沿'], mood: 'inspiring', category: '科技', era: '现代', emoji: '💠' },
  { title: '古董修复师', subtitle: '用三个月让宋瓷重新呼吸', tags: ['古董', '修复', '匠心', '历史'], mood: 'inspiring', category: '艺术', era: '现代', emoji: '🏺' },
  { title: '极地科考队员', subtitle: '在南极点熬过半年极夜', tags: ['南极', '科考', '孤独', '极限'], mood: 'dark', category: '探险', era: '现代', emoji: '🧊' },
  { title: '战地摄影师', subtitle: '用胶卷挡住子弹的眼睛', tags: ['摄影', '战争', '纪实', '真相'], mood: 'dark', category: '新闻', era: '现代', emoji: '📷' },
  { title: '马戏团驯兽师', subtitle: '在铁笼里与猛兽建立信任', tags: ['马戏', '动物', '信任', '冒险'], mood: 'passionate', category: '表演', era: '现代', emoji: '🦁' },
  { title: '拆弹专家', subtitle: '红线还是蓝线，你有三秒钟', tags: ['拆弹', '军事', '生死', '冷静'], mood: 'dark', category: '军事', era: '现代', emoji: '💣' },
  { title: '茶道宗师', subtitle: '一碗抹茶里的四百年传承', tags: ['茶道', '日本', '禅意', '传承'], mood: 'inspiring', category: '文化', era: '近代', emoji: '🍵' },
  { title: '自由潜水冠军', subtitle: '一口气潜入214米的蔚蓝深渊', tags: ['潜水', '极限', '自由', '海洋'], mood: 'passionate', category: '体育', era: '现代', emoji: '🌊' },
  { title: '黑帮律师', subtitle: '在法律与地下秩序之间走钢丝', tags: ['法律', '黑帮', '道德', '灰色'], mood: 'dark', category: '犯罪', era: '现代', emoji: '⚖️' },
  { title: '绝命毒师', subtitle: '化学天才在地下室炼出的帝国', tags: ['化学', '犯罪', '堕落', '家庭'], mood: 'dark', category: '犯罪', era: '现代', emoji: '⚗️' },
  { title: '北极探险家', subtitle: '靠狗拉雪橇穿越未知的白色荒原', tags: ['北极', '探险', '极寒', '意志'], mood: 'passionate', category: '探险', era: '近代', emoji: '❄️' },
  { title: '顶级服装设计师', subtitle: '用针线缝进整个时代的野心', tags: ['时尚', '设计', '奢侈', '创造'], mood: 'passionate', category: '时尚', era: '现代', emoji: '👗' },
  { title: '东京地铁推手', subtitle: '把梦想塞进末班车的缝隙', tags: ['日本', '都市', '底层', '生存'], mood: 'dark', category: '社会', era: '现代', emoji: '🚃' },
  { title: '火山学家', subtitle: '站在岩浆湖边测量地球的体温', tags: ['火山', '地质', '危险', '科学'], mood: 'passionate', category: '科学', era: '现代', emoji: '🌋' },
  { title: '古墓考古学家', subtitle: '用毛刷刷出三千年前的一滴泪', tags: ['考古', '历史', '发现', '执念'], mood: 'inspiring', category: '科学', era: '现代', emoji: '🪦' },
  { title: '职业电竞选手', subtitle: '从网吧通宵到世界赛决赛舞台', tags: ['电竞', '游戏', '青春', '竞技'], mood: 'passionate', category: '竞技', era: '现代', emoji: '🎮' },
  { title: '国际象棋大师', subtitle: '在六十四个格子里推演整个人生', tags: ['棋艺', '智力', '孤独', '执念'], mood: 'inspiring', category: '竞技', era: '现代', emoji: '♟️' },
  { title: '急救直升机飞行员', subtitle: '在暴风雨中抢救每一条黄金时间', tags: ['飞行', '急救', '生死', '责任'], mood: 'dark', category: '医疗', era: '现代', emoji: '🚁' },
  { title: '调酒大师', subtitle: '一杯酒听懂所有不想说的话', tags: ['调酒', '夜生活', '故事', '倾听'], mood: 'inspiring', category: '生活', era: '现代', emoji: '🍸' },
  { title: '华尔街量化交易员', subtitle: '用数学公式收割市场的每一秒', tags: ['金融', '量化', '算法', '贪婪'], mood: 'dark', category: '商业', era: '现代', emoji: '📈' },
  { title: '殡葬师', subtitle: '送走一万个陌生人的最后一程', tags: ['死亡', '尊严', '告别', '生命'], mood: 'dark', category: '社会', era: '现代', emoji: '🕊️' },
  { title: '沙漠寻路人', subtitle: '在撒哈拉用星星代替GPS', tags: ['沙漠', '导航', '生存', '自然'], mood: 'passionate', category: '探险', era: '现代', emoji: '🐪' },
  { title: '百年酒庄酿酒师', subtitle: '等一棵葡萄藤长出第四十年的味道', tags: ['红酒', '匠心', '等待', '传承'], mood: 'inspiring', category: '美食', era: '现代', emoji: '🍷' },
];

// ─── Prompt 构建器 ──────────────────────────────────────────────────
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

// ─── Anthropic Claude API 调用（带重试）────────────────────────────────
async function callAI(prompt, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 16000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => '');
        if ((res.status === 429 || res.status === 529) && attempt < retries) {
          const wait = 10 * (attempt + 1);
          console.log(`   ⚠️  Rate limited, 等待 ${wait}s 后重试...`);
          await new Promise(r => setTimeout(r, wait * 1000));
          continue;
        }
        throw new Error(`Anthropic API error (${res.status}): ${err}`);
      }

      const data = await res.json();
      const text = data.content?.map(b => b.text).join('') || '';
      return text;
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(`   ⚠️  第 ${attempt + 1} 次失败，重试中...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

// ─── Supabase 插入（带去重检查）─────────────────────────────────────
async function insertScript(topic, content) {
  // 先检查是否已存在同名副本
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/scripts?title=eq.${encodeURIComponent(topic.title)}&select=id`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  if (checkRes.ok) {
    const existing = await checkRes.json();
    if (existing.length > 0) {
      console.log(`   ⏭️  已存在同名副本「${topic.title}」，跳过`);
      return null;
    }
  }

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

  console.log(`\n🚀 开始批量生成 ${topics.length} 篇新人生副本（#${startIndex + 1} - #${startIndex + topics.length}）\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const num = startIndex + i + 1;
    console.log(`\n[${num}/${startIndex + topics.length}] ⏳ 正在生成：${topic.emoji} ${topic.title} — ${topic.subtitle}`);

    try {
      const prompt = buildBatchPrompt(topic);
      console.log(`   → 调用 Anthropic Claude ...`);
      const content = await callAI(prompt);

      if (!content || content.length < 1000) {
        throw new Error(`生成内容过短 (${content?.length || 0} 字符)`);
      }

      console.log(`   → 插入 Supabase (${content.replace(/\s/g, '').length} 字) ...`);
      const result = await insertScript(topic, content);

      if (result === null) {
        skipped++;
      } else {
        success++;
        console.log(`   ✅ 完成！id: ${result[0]?.id?.slice(0, 8) || 'unknown'}`);
      }
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
  console.log(`📊 生成完成：✅ ${success} 成功 / ⏭️ ${skipped} 跳过 / ❌ ${failed} 失败 / 共 ${topics.length} 篇`);
  console.log(`${'═'.repeat(50)}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
