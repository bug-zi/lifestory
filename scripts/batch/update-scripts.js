/**
 * 批量更新 scripts 表中已有的人生副本（用修复后的JSON内容覆盖）
 * 匹配方式: title → 找到记录 → 更新 content/subtitle/tags/mood/category/era/word_count
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

async function main() {
  const files = fs.readdirSync(BATCH_DIR).filter(f => /^story_\d{3}_/.test(f)).sort();
  console.log(`\n===== 更新每日副本内容 =====`);
  console.log(`JSON文件: ${files.length} | 模式: ${DRY_RUN ? 'DRY-RUN' : 'LIVE'}\n`);

  // 1. 获取所有已有副本
  const { status, data: existing } = await supabaseReq('GET', `${TABLE}?select=id,title&is_official=eq.true`);
  if (status !== 200) {
    console.error('Failed to fetch existing scripts:', status);
    process.exit(1);
  }
  const titleToId = new Map(existing.map(s => [s.title, s.id]));
  console.log(`DB中官方副本: ${existing.length} 篇\n`);

  let updated = 0, notFound = 0, failed = 0;

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    try {
      const story = JSON.parse(fs.readFileSync(path.join(BATCH_DIR, f), 'utf8'));
      const recordId = titleToId.get(story.title);

      if (!recordId) {
        notFound++;
        if (notFound <= 5) console.log(`NOT FOUND: "${story.title}"`);
        continue;
      }

      const patch = {
        subtitle: story.subtitle || null,
        content: story.content,
        tags: story.tags || [],
        mood: story.mood || null,
        category: story.category || null,
        era: story.era || '现代',
        word_count: story.word_count || 0,
      };

      if (DRY_RUN) {
        console.log(`[${i+1}] WOULD UPDATE: "${story.title}"`);
        continue;
      }

      const encodedId = encodeURIComponent(recordId);
      const { status: updStatus, data: updData } = await supabaseReq(
        'PATCH',
        `${TABLE}?id=eq.${encodedId}`,
        patch
      );

      if (updStatus === 200) {
        updated++;
        if ((i+1) % 10 === 0) console.log(`[${i+1}/${files.length}] ${updated} updated, ${notFound} missing, ${failed} failed`);
      } else {
        failed++;
        console.log(`FAIL [${f}]: status=${updStatus}`, JSON.stringify(updData).substring(0, 150));
      }

      if ((i+1) % 5 === 0) await new Promise(r => setTimeout(r, 100));
    } catch(e) {
      failed++;
      console.log(`ERR [${f}]: ${e.message}`);
    }
  }

  console.log(`\n===== 结果 =====`);
  console.log(`更新成功: ${updated} | 未找到: ${notFound} | 失败: ${failed}`);
  console.log('===== 完成 =====\n');
}

main().catch(e => { console.error(e); process.exit(1); });
