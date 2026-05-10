/**
 * 批量生成第二批30篇新人生副本
 * 使用项目内置 AI Provider（deepseek/zhipu/qwen/doubao/chatgpt）
 *
 * 用法：node scripts/batch/batch-31-new.mjs [startIndex] [count]
 * 例：node scripts/batch/batch-31-new.mjs        → 全部30篇
 *     node scripts/batch/batch-31-new.mjs 1 5    → 第1~5篇
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 缺少必要环境变量：NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// ─── Provider endpoints（与项目 ai-providers.ts 对齐）────────────────────
const PROVIDER_ENDPOINTS = {
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  doubao:   'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  zhipu:    'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  qwen:     'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  chatgpt:  'https://api.openai.com/v1/chat/completions',
};

// ─── 第二批30个全新人生副本主题 ─────────────────────────────────────────
const TOPICS = [
  { title: '深海沉船探险家', subtitle: '在海底一千米触摸一百年前的幽灵', tags: ['深海', '沉船', '探险', '孤独'], mood: 'dark', category: '探险', era: '现代', emoji: '🤿' },
  { title: '走钢丝艺术家', subtitle: '在四百米高空用三厘米宽的钢丝丈量勇气', tags: ['高空', '钢丝', '极限', '艺术'], mood: 'passionate', category: '表演', era: '现代', emoji: '🎪' },
  { title: '米其林三星厨师', subtitle: '从城中村大排档烧到世界之巅', tags: ['美食', '米其林', '奋斗', '匠心'], mood: 'inspiring', category: '美食', era: '现代', emoji: '👨‍🍳' },
  { title: '珠峰登山向导', subtitle: '在死亡地带用绳索连接生与死', tags: ['登山', '珠峰', '向导', '生死'], mood: 'dark', category: '探险', era: '现代', emoji: '🏔️' },
  { title: '密码破译员', subtitle: '在布莱切利园用铅笔打赢一场秘密战争', tags: ['二战', '密码', '情报', '天才'], mood: 'inspiring', category: '历史', era: '近代', emoji: '🔐' },
  { title: '丛林飞行员', subtitle: '在亚马逊雨林上空用螺旋桨劈开命运', tags: ['飞行', '亚马逊', '丛林', '生存'], mood: 'passionate', category: '探险', era: '现代', emoji: '✈️' },
  { title: '职业扑克选手', subtitle: '在拉斯维加斯的牌桌上读懂一千双眼睛', tags: ['扑克', '赌场', '心理', '博弈'], mood: 'dark', category: '竞技', era: '现代', emoji: '🃏' },
  { title: '空间站宇航员', subtitle: '在离地四百公里的铁罐子里度过三百六十五天', tags: ['太空', '空间站', '孤独', '科学'], mood: 'inspiring', category: '科技', era: '现代', emoji: '🚀' },
  { title: '法医病理学家', subtitle: '用解剖刀替死者说出最后一句话', tags: ['法医', '解剖', '死亡', '真相'], mood: 'dark', category: '医疗', era: '现代', emoji: '🔬' },
  { title: '野生动物兽医', subtitle: '在非洲草原上给一头麻醉的狮子缝针', tags: ['非洲', '动物', '兽医', '野外'], mood: 'passionate', category: '科学', era: '现代', emoji: '🦁' },
  { title: '纪录片导演', subtitle: '在无人区架好机器然后等了一整年', tags: ['纪录片', '摄影', '坚持', '真实'], mood: 'inspiring', category: '艺术', era: '现代', emoji: '🎬' },
  { title: '钢琴调音师', subtitle: '在八十八个琴键之间寻找绝对完美的振动', tags: ['钢琴', '调音', '声音', '执念'], mood: 'inspiring', category: '音乐', era: '现代', emoji: '🎹' },
  { title: '太空碎片清理员', subtitle: '在地球轨道上捡拾人类遗忘的垃圾', tags: ['太空', '碎片', '清理', '孤独'], mood: 'dark', category: '科幻', era: '未来', emoji: '🛰️' },
  { title: '世纪珠宝大盗', subtitle: '在监控死角用三分钟拿走价值连城的冷静', tags: ['盗窃', '珠宝', '犯罪', '天才'], mood: 'dark', category: '犯罪', era: '现代', emoji: '💎' },
  { title: '特技替身演员', subtitle: '从十楼跳下来然后走回家吃晚饭', tags: ['特技', '替身', '电影', '危险'], mood: 'passionate', category: '表演', era: '现代', emoji: '💥' },
  { title: '刑辩律师', subtitle: '在法庭上为所有人都觉得该死的人说话', tags: ['法律', '辩护', '正义', '道德'], mood: 'dark', category: '社会', era: '现代', emoji: '⚖️' },
  { title: '咖啡寻豆师', subtitle: '从埃塞俄比亚的火山土到你的早餐杯', tags: ['咖啡', '寻豆', '旅行', '味觉'], mood: 'inspiring', category: '美食', era: '现代', emoji: '☕' },
  { title: '冰川学家', subtitle: '站在正在消失的冰面上记录世界的倒计时', tags: ['冰川', '气候', '科学', '消融'], mood: 'dark', category: '科学', era: '现代', emoji: '🧊' },
  { title: '灯塔守护人', subtitle: '在世界尽头独自点亮了三十年的灯', tags: ['灯塔', '孤独', '海洋', '坚守'], mood: 'inspiring', category: '生活', era: '近代', emoji: '🔦' },
  { title: '绑架谈判专家', subtitle: '在电话线这一端用声音接住一条命', tags: ['谈判', '绑架', '心理', '生死'], mood: 'dark', category: '社会', era: '现代', emoji: '📞' },
  { title: '地铁驾驶员', subtitle: '在黑暗隧道里开了一万天的末班车', tags: ['地铁', '都市', '重复', '孤独'], mood: 'dark', category: '生活', era: '现代', emoji: '🚇' },
  { title: '海洋生物学家', subtitle: '在鲸鱼的歌声里听懂了地球的心跳', tags: ['海洋', '鲸鱼', '研究', '自然'], mood: 'inspiring', category: '科学', era: '现代', emoji: '🐋' },
  { title: '破产清算师', subtitle: '在企业废墟里清点别人的最后一滴血', tags: ['破产', '清算', '商业', '人性'], mood: 'dark', category: '商业', era: '现代', emoji: '📉' },
  { title: '雪山救援队员', subtitle: '在零下四十度的暴风雪中寻找迷途者', tags: ['雪山', '救援', '极寒', '生死'], mood: 'passionate', category: '探险', era: '现代', emoji: '⛷️' },
  { title: '刺绣艺术家', subtitle: '用十年时间把一整条河流绣进丝绸', tags: ['刺绣', '手艺', '坚持', '艺术'], mood: 'inspiring', category: '艺术', era: '现代', emoji: '🪡' },
  { title: '难民营教师', subtitle: '在帐篷里教战争的孩子仰望星空', tags: ['难民', '教育', '战争', '希望'], mood: 'dark', category: '社会', era: '现代', emoji: '📚' },
  { title: '烟花设计师', subtitle: '在火药和星光之间绽放最美的三秒钟', tags: ['烟花', '设计', '火药', '短暂'], mood: 'passionate', category: '艺术', era: '现代', emoji: '🎆' },
  { title: '钟表修复师', subtitle: '用放大镜和镊子对抗三百年的时间', tags: ['钟表', '修复', '精密', '时间'], mood: 'inspiring', category: '艺术', era: '现代', emoji: '⏰' },
  { title: '冰川登山家', subtitle: '在K2的杀人峰上用冰镐刻下遗书', tags: ['K2', '登山', '极限', '死亡'], mood: 'dark', category: '探险', era: '现代', emoji: '🧗' },
  { title: '街头涂鸦艺术家', subtitle: '在警察追捕中把整座城市变成画布', tags: ['涂鸦', '街头', '反叛', '艺术'], mood: 'passionate', category: '艺术', era: '现代', emoji: '🎨' },
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

// ─── 获取 AI 配置（从 profiles 表读第一个有 api_key 的用户）──────────
async function getAIConfig() {
  // 取所有有 ai_config 的 profiles，在 JS 侧过滤
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?select=ai_config&limit=50`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`获取 AI 配置失败 (${res.status}): ${await res.text()}`);
  }

  const profiles = await res.json();
  const withKey = profiles.find(p => p.ai_config?.api_key);
  if (!withKey) {
    throw new Error('未找到有效的 AI 配置（profiles 表中无用户配置了 api_key）');
  }

  return withKey.ai_config;
}

// ─── AI API 调用（OpenAI 兼容格式，带重试）──────────────────────────────
async function callAI(config, prompt, retries = 2) {
  const endpoint = PROVIDER_ENDPOINTS[config.provider];
  if (!endpoint) throw new Error(`不支持的 provider: ${config.provider}`);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.api_key}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 8192,
          temperature: 0.8,
        }),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => '');
        if ((res.status === 429 || res.status === 529) && attempt < retries) {
          const wait = 15 * (attempt + 1);
          console.log(`   ⚠️  Rate limited, 等待 ${wait}s 后重试...`);
          await new Promise(r => setTimeout(r, wait * 1000));
          continue;
        }
        throw new Error(`AI API error (${res.status}): ${err}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
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
  // 1. 获取 AI 配置
  console.log('📡 正在获取 AI 配置...');
  const aiConfig = await getAIConfig();
  console.log(`   ✅ Provider: ${aiConfig.provider}, Model: ${aiConfig.model}`);

  const args = process.argv.slice(2);
  const startIndex = args[0] ? parseInt(args[0], 10) - 1 : 0;
  const count = args[1] ? parseInt(args[1], 10) : TOPICS.length;
  const topics = TOPICS.slice(startIndex, startIndex + count);

  console.log(`\n🚀 开始批量生成第二批 ${topics.length} 篇新人生副本（#${startIndex + 1} - #${startIndex + topics.length}）\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const num = startIndex + i + 1;
    console.log(`\n[${num}/${startIndex + topics.length}] ⏳ 正在生成：${topic.emoji} ${topic.title} — ${topic.subtitle}`);

    try {
      const prompt = buildBatchPrompt(topic);
      console.log(`   → 调用 ${aiConfig.provider} (${aiConfig.model}) ...`);
      const content = await callAI(aiConfig, prompt);

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
