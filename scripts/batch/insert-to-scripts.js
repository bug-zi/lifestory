/**
 * 批量插入100篇人生副本到 scripts 表（每日副本）
 * 用法: node insert-to-scripts.js [--dry-run] [--force]
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_HOST = process.env.SUPABASE_URL || 'vfufynwrbejtkbpmpgfk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || (() => { throw new Error('Set SUPABASE_KEY env var'); })();
const TABLE = 'scripts';
const BATCH_DIR = path.join(__dirname);

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');

function supabaseReq(method, pathSuffix, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: SUPABASE_HOST,
      path: '/rest/v1/' + pathSuffix,
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=representation',
      },
    };
    if (postData) opts.headers['Content-Length'] = Buffer.byteLength(postData);
    const req = https.request(opts, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, data: d }); }
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
    cover_image: null,
    tags: story.tags || [],
    mood: story.mood || null,
    category: story.category || null,
    era: story.era || '现代',
    word_count: story.word_count || 0,
    author_id: null,
    is_official: true,
    view_count: 0,
    rating_avg: null,
  };
}

async function main() {
  const files = fs.readdirSync(BATCH_DIR).filter(f => /^story_\d{3}_/.test(f)).sort();
  console.log(`\n===== 插入每日副本 (scripts表) =====`);
  console.log(`故事: ${files.length} 篇 | 模式: ${DRY_RUN ? 'DRY-RUN' : 'LIVE'}\n`);

  let existingTitles = new Set();
  if (!FORCE) {
    const { status, data } = await supabaseReq('GET', `${TABLE}?select=title`);
    if (status === 200 && Array.isArray(data)) {
      existingTitles = new Set(data.map(s => s.title));
      console.log(`已有副本: ${existingTitles.size} 篇\n`);
    }
  }

  let ok = 0, skip = 0, fail = 0;

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    try {
      const story = JSON.parse(fs.readFileSync(path.join(BATCH_DIR, f), 'utf8'));

      if (existingTitles.has(story.title)) {
        skip++;
        continue;
      }

      const row = storyToDbRow(story);

      if (DRY_RUN) { skip++; continue; }

      const { status, data } = await supabaseReq('POST', TABLE, row);
      if (status === 201) {
        ok++;
        existingTitles.add(story.title);
        if ((i+1) % 10 === 0) console.log(`[${i+1}/${files.length}] ${ok} ok, ${skip} skip, ${fail} fail`);
      } else {
        fail++;
        console.log(`FAIL [${f}]: status=${status}`, JSON.stringify(data).substring(0, 150));
      }

      if ((i+1) % 5 === 0) await new Promise(r => setTimeout(r, 150));
    } catch(e) {
      fail++;
      console.log(`ERR [${f}]: ${e.message}`);
    }
  }

  console.log(`\n===== 结果 =====`);
  console.log(`成功: ${ok} | 跳过: ${skip} | 失败: ${fail}`);

  const { data: all } = await supabaseReq('GET', `${TABLE}?select=id`);
  console.log(`DB总副本数: ${all?.length || '?'}`);

  if (!DRY_RUN) {
    const { data: official } = await supabaseReq('GET', `${TABLE}?select=id&is_official=eq.true`);
    console.log(`官方副本数: ${official?.length || '?'}`);
  }
  console.log('===== 完成 =====\n');
}

main().catch(e => { console.error(e); process.exit(1); });
