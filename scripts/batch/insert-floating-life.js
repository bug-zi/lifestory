/**
 * 批量插入修复后的100篇浮生记故事到 Supabase floating_life_stories 表
 * 用法: node insert-floating-life.js [--dry-run] [--force]
 *   --dry-run  只检查不插入
 *   --force    跳过已存在检查，强制插入
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || 'vfufynwrbejtkbpmpgfk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || (() => { throw new Error('Set SUPABASE_KEY env var'); })();
const TABLE = 'floating_life_stories';
const BATCH_DIR = path.join(__dirname);

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');

function supabaseRequest(method, pathSuffix, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      hostname: SUPABASE_URL,
      path: `/rest/v1/${pathSuffix}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation',
      },
    };
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function storyToDbRow(story) {
  return {
    title: story.title,
    subtitle: story.subtitle || null,
    content: story.content,
    source: story.source || 'AI原创',
    era: story.era || '当代',
    mood: story.mood || null,
    tags: story.tags || [],
    word_count: story.word_count || null,
    cover_image: null,
    author: null,
    is_featured: false,
    is_archived: false,
    sort_order: 0,
    view_count: 0,
  };
}

async function main() {
  const files = fs.readdirSync(BATCH_DIR)
    .filter(f => /^story_\d{3}_/.test(f))
    .sort();

  console.log(`\n========== 浮生记批量插入 ==========\n`);
  console.log(`故事文件: ${files.length} 个`);
  console.log(`模式: ${DRY_RUN ? 'DRY RUN (只检查)' : 'LIVE (实际插入)'}`);
  console.log(`跳过存在检查: ${FORCE ? '是' : '否'}\n`);

  // 1. 获取已有故事标题（用于去重）
  let existingTitles = new Set();
  if (!FORCE) {
    console.log('正在获取已有故事列表...');
    const { status, data } = await supabaseRequest('GET', `${TABLE}?select=title`);
    if (status === 200 && Array.isArray(data)) {
      existingTitles = new Set(data.map(s => s.title));
      console.log(`已有故事: ${existingTitles.size} 篇\n`);
    } else {
      console.log(`获取已有故事失败 (status ${status}), 将跳过去重检查\n`);
    }
  }

  let inserted = 0;
  let skipped = 0;
  let failed = 0;
  let errors = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(BATCH_DIR, file);

    try {
      const story = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // 去重检查
      if (existingTitles.has(story.title)) {
        skipped++;
        console.log(`[${i + 1}/${files.length}] SKIP: "${story.title}" (已存在)`);
        continue;
      }

      const row = storyToDbRow(story);

      if (DRY_RUN) {
        skipped++;
        console.log(`[${i + 1}/${files.length}] WOULD INSERT: "${story.title}" (${row.word_count}字, ${row.source}, ${row.era})`);
        continue;
      }

      // 实际插入
      const { status, data } = await supabaseRequest('POST', TABLE, row);

      if (status === 201 && Array.isArray(data) && data[0]?.id) {
        inserted++;
        existingTitles.add(story.title);
        console.log(`[${i + 1}/${files.length}] OK: "${story.title}" (id=${data[0].id})`);
      } else {
        failed++;
        const errMsg = Array.isArray(data) ? JSON.stringify(data) : (data?.message || JSON.stringify(data)).substring(0, 200);
        errors.push({ file, title: story.title, error: errMsg });
        console.log(`[${i + 1}/${files.length}] FAIL: "${story.title}" - ${errMsg}`);
      }

      // 小延迟避免并发限制
      if ((i + 1) % 5 === 0) {
        await new Promise(r => setTimeout(r, 200));
      }

    } catch (e) {
      failed++;
      errors.push({ file, error: e.message });
      console.log(`[${i + 1}/${files.length}] ERROR: ${file} - ${e.message}`);
    }
  }

  console.log(`\n========== 结果 ==========\n`);
  console.log(`插入成功: ${inserted}`);
  console.log(`跳过(已存在/dry-run): ${skipped}`);
  console.log(`失败: ${failed}`);

  if (errors.length > 0) {
    console.log(`\n失败详情:`);
    errors.forEach(e => console.log(`  ${e.file}: ${e.error}`));
  }

  // 最终验证：获取总数
  console.log(`\n正在验证数据库中的故事总数...`);
  const { status, data } = await supabaseRequest('GET', `${TABLE}?select=id`);
  if (status === 200 && Array.isArray(data)) {
    console.log(`数据库中共有 ${data.length} 篇浮生记故事`);
  }

  console.log('\n========== 完成 ==========\n');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
