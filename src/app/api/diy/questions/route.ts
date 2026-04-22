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

  const { input_life, introduction } = await request.json();

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

  // Demo questions for fallback (场景化示例，适配常见人生类型)
  const demoQuestionsMap: Record<string, any[]> = {
    '毒枭': [
      {
        id: 1,
        stage: '初出茅庐',
        question: '你的第一个货柜在边境被扣押，线人说是内部有人出卖。此时你刚接手家族生意，根基未稳。你会',
        options: [
          '立刻清洗所有可疑人员，用血腥手段立威',
          '暗中调查，确凿证据后再动手',
          '装作不知，设局让叛徒自露马脚',
          '暂时按兵不动，观察对方下一步动作',
        ],
      },
      {
        id: 2,
        stage: '扩张期',
        question: '军政府的一位将军找上门，要求你提供"特殊服务"（运送违禁品），报酬丰厚但风险极高。这可能是你打入权力圈的机会。你会',
        options: [
          '拒绝，不与军队沾边保持独立性',
          '接受，但把风险转嫁给竞争对手',
          '接受，借此建立军方保护伞',
          '假意接受，暗中收集筹码作为日后的把柄',
        ],
      },
      {
        id: 3,
        stage: '掌控期',
        question: '你发现最信任的副手在背地里做一笔你不知情的大买卖，金额巨大且涉及你禁止的生意类型。他声称是为了"组织的发展"。你会',
        options: [
          '立即处决，杀鸡儆猴',
          '公开羞辱后流放，让他活着受罪',
          '私下谈判，分一杯羹但要收回控制权',
          '装作不知，暗中监控他的下一步',
        ],
      },
      {
        id: 4,
        stage: '巅峰抉择',
        question: '国际刑警组织的一位高级官员私下联系你，表示愿意睁一只眼闭一只眼，条件是你提供其他帮派的情报。这是背叛同道的出卖，也可能是你洗白的唯一机会。你会',
        options: [
          '拒绝，道义比个人前途重要',
          '接受，开始策划退出路线',
          '假意合作，实际上利用他铲除对手',
          '立即除掉这个隐患，不留后患',
        ],
      },
    ],
    '富豪': [
      {
        id: 1,
        stage: '创业初期',
        question: '你的创业公司濒临破产，最后一位投资人提出苛刻条件：他控股80%，你保留20%但必须全权交出经营权。你的梦想还是你的吗？你会',
        options: [
          '拒绝，宁可公司倒闭也要保持控制权',
          '接受，先活下来再说',
          '拖延，同时寻找其他融资渠道',
          '拒绝，但提出对赌协议争取空间',
        ],
      },
      {
        id: 2,
        stage: '成长期',
        question: '你的产品发现重大安全隐患，召回会损失几十亿且可能导致股价崩盘。如果悄悄修复，风险是万分之一被曝光。你会',
        options: [
          '立即公开召回，承担一切损失',
          '低调处理，不扩大影响',
          '分批次逐步修复，避免引起注意',
          '召开董事会，集体决策',
        ],
      },
      {
        id: 3,
        stage: '扩张期',
        question: '你的竞争对手恶意收购你的公司股份，已经持有29.9%。他私下找你，表示如果你支持他收购，他会让你担任董事长，保留实际经营权。你会',
        options: [
          '坚决抵抗，毒丸计划反击',
          '接受，从企业家变成职业经理人',
          '假意同意，暗中寻找白衣骑士',
          '反向要约收购，孤注一掷',
        ],
      },
      {
        id: 4,
        stage: '传承期',
        question: '你的大儿子和二儿子为公司控制权争斗，已经影响到业务。董事会建议你指定继承人，但你认为两人都不够成熟。你会',
        options: [
          '强行指定一个，维护公司稳定',
          '引入职业经理人，子女只做股东',
          '让他们继续竞争，优胜劣汰',
          '分割公司资产，一人一半各自经营',
        ],
      },
    ],
    '总统': [
      {
        id: 1,
        stage: '活动人士',
        question: '你作为社区活动人士，发现当地议员与开发商勾结，强拆居民区。居民们聚集抗议，警方准备清场。议员私下找你，承诺改善补偿条件，要求你劝散抗议。你会',
        options: [
          '拒绝妥协，带领居民继续抗议',
          '接受条件，保护居民利益优先',
          '假意接受，暗中收集证据',
          '扩大事态，吸引媒体关注',
        ],
      },
      {
        id: 2,
        stage: '市议员',
        question: '你当选市议员后，市长暗示你支持他的市政建设计划，作为交换，他会支持你提出的教育改革法案。但这个计划会损害你的选区利益。你会',
        options: [
          '坚持选区利益，反对市长的计划',
          '政治交易，换取教育改革',
          '表面支持，实际拖延',
          '公开揭露，占据道德高地',
        ],
      },
      {
        id: 3,
        stage: '州长',
        question: '一场自然灾害袭击你的州，联邦援助迟迟不到。你的政治对手是联邦项目负责人，他暗示"某些姿态"可能加快援助。你会',
        options: [
          '公开批评联邦政府，施压援助',
          '私下妥协，换取援助',
          '自力更生，不依赖联邦',
          '联合其他州长，集体施压',
        ],
      },
      {
        id: 4,
        stage: '总统候选人',
        question: '党内初选关键阶段，你的竞选团队发现对手的丑闻证据。是否公开？公开可能赢得初选，但会被认为手段肮脏。你会',
        options: [
          '立即公开，不惜一切代价',
          '私下威胁对手，迫其退选',
          '暂时保留，作为最后筹码',
          '拒绝使用，坚持正面竞选',
        ],
      },
      {
        id: 5,
        stage: '当选总统',
        question: '胜选后第二天，情报机构简报：你的主要竞选赞助商涉嫌重大经济犯罪。证据确凿，但起诉会动摇市场信心，并可能引发政治报复。你会',
        options: [
          '依法办事，下令调查',
          '暂时搁置，观察形势',
          '私下谈判，达成协议',
          '装作不知，让司法独立处理',
        ],
      },
      {
        id: 6,
        stage: '任期中期',
        question: '国际危机爆发，你的军事顾问建议先发制人打击，外交团队建议通过联合国斡旋。时间紧迫，盟国等待你的表态。你会',
        options: [
          '立即军事打击，展示决心',
          '外交优先，争取国际支持',
          '双轨并行，军事施压的同时谈判',
          '等待对方行动后再反应',
        ],
      },
    ],
  };

  // 根据input_life匹配或生成通用demo问题
  const demoQuestions = demoQuestionsMap[input_life] || [
    {
      id: 1,
      question: `作为${input_life}，你面临第一个重大抉择：摆在面前有两条路，一条稳但慢，一条快但险。你会`,
      options: [
        '选择稳扎稳打，步步为营',
        '冒险一搏，追求快速突破',
        '先稳后险，积累实力再冲刺',
        '寻找第三条路，打破二选一的困局',
      ],
    },
    {
      id: 2,
      question: `在${input_life}的道路上，你遇到了一个可以走捷径的机会，但代价是违背你的原则。同时，坚持原则意味着你要多付出三年的努力。你会`,
      options: [
        '坚守原则，多花三年又何妨',
        '妥协一次，下不为例',
        '寻找既能接近目标又不完全违背原则的中间路线',
        '放弃这个目标，重新评估这条路是否值得',
      ],
    },
    {
      id: 3,
      question: `你的${input_life}事业初见成效，但身边的人开始因为你而改变——有人疏远，有人趋附。最让你意外的是，你最信任的伙伴提出了一个你无法接受的合作提议。你会`,
      options: [
        '断然拒绝，即使失去这个伙伴',
        '部分妥协，保留核心立场',
        '拖延回应，希望对方自己放弃',
        '认真听取，也许自己太固执了',
      ],
    },
    {
      id: 4,
      question: `多年后，你作为${input_life}已经达到了某个高度。此时一个更大的机会出现，但它要求你放弃现有的一切，从头再来。年龄、家庭、责任都在告诉你该止步了。你会`,
      options: [
        '知足常乐，守住现有的成果',
        '放手一搏，人生只有一次',
        '让别人去冒险，自己做幕后支持',
        '把现有事业交给他人，自己重新出发',
      ],
    },
  ];

  if (!aiConfig.api_key) {
    return NextResponse.json({ error: '请先配置 AI API Key' }, { status: 400 });
  }

  const prompt = `你是一个顶级人生体验设计师。

## 用户想体验的人生

${input_life}

## 这个人生的概览介绍（请基于此介绍来设计问题）

${introduction || '（暂无介绍）'}

---

## 核心任务

基于上述介绍，为这个人生设计**4-8个关键抉择问题**。

**要求：**
1. **完全基于介绍中的内容**——问题中的场景、人物、挑战都要从介绍里提取
2. **按时间线展开**——从入门到巅峰，每个问题对应一个成长阶段
3. **具体情境**——描述一个具体的场景/事件，不要问"你希望怎样"
4. **真实两难**——每个选项都有代价和合理性
5. **有画面感**——用具体的细节、数字、地点

**禁止：**
- ❌ 不要用任何模板或套话（如"命运齿轮""人生十字路口"）
- ❌ 不要问抽象的价值观问题
- ❌ 不要重复介绍里没有的元素

## 输出格式

只返回JSON数组：
[
  {"id": 1, "stage": "[阶段名称]", "question": "[具体场景问题]", "options": ["选项1", "选项2", "选项3", "选项4"]},
  ...
]

每个问题必须包含 stage 字段。`;

  try {
    // 根据输入类型动态调整token
    const complexityKeywords = ['总统', 'CEO', '将军', '部长', '主席', '大帝', '毒枭', '黑帮', '军阀', '教父'];
    const isComplex = complexityKeywords.some(kw => input_life.includes(kw));
    const maxTokens = isComplex ? 3000 : 2000;

    const text = await callAI(aiConfig, prompt, { maxTokens, temperature: 0.8 });
    const questions = JSON.parse(text);
    return NextResponse.json({ questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : '生成问题失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
