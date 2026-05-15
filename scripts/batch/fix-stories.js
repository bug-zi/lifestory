/**
 * 批量修复100篇人生副本故事 JSON 文件
 * 修复内容：
 * 1. 移除内容末尾的"最终总结"、"高光句子"等AI元数据章节
 * 2. 截断内容裁剪到最后一个完整句子
 * 3. 英文 mood 映射为中文
 * 4. category 字段重命名为 source，值映射为 'AI原创'
 * 5. era '现代' → '当代'
 * 6. 清理 is_official 字段（不在 FloatingLifeStory schema 中）
 */

const fs = require('fs');
const path = require('path');

const BATCH_DIR = path.join(__dirname);

// 英文 mood → 中文 mood 映射
const moodMap = {
  dark: '暗黑',
  melancholy: '温馨',
  suspense: '震撼',
  hopeful: '治愈',
  bittersweet: '温馨',
  inspiring: '热血',
  tense: '震撼',
  mysterious: '暗黑',
  gloomy: '暗黑',
  reflective: '治愈',
  romantic: '温馨',
  adventurous: '热血',
  epic: '震撼',
  chilling: '暗黑',
  haunting: '暗黑',
};

// 需要移除的元数据章节标题（正则）
const metaSectionPatterns = [
  /^##\s*最终总结\s*$/gm,
  /^##\s*最终小结\s*$/gm,
  /^##\s*高光句子\s*$/gm,
  /^##\s*高亮句子\s*$/gm,
  /^##\s*关键句\s*$/gm,
  /^##\s*名句\s*$/gm,
  /^##\s*金句\s*$/gm,
  /^##\s*经典句子\s*$/gm,
  /^##\s*经典语录\s*$/gm,
  /^##\s*Summary\s*$/gm,
  /^##\s*Highlights\s*$/gm,
];

function removeMetaSections(content) {
  let result = content;

  for (const pattern of metaSectionPatterns) {
    const match = result.match(pattern);
    if (match) {
      // 找到元数据章节的位置，移除从该标题到结尾的所有内容
      const idx = result.search(pattern);
      if (idx !== -1) {
        result = result.substring(0, idx).trimEnd();
      }
    }
  }

  return result;
}

/**
 * 将截断的内容裁剪到最后一个完整句子
 * 完整句子以 。，！？…」" 结尾
 */
function trimToLastCompleteSentence(content) {
  const trimmed = content.trimEnd();

  // 如果已经以标点符号结尾，不需要裁剪
  const lastChar = trimmed.slice(-1);
  if (['。', '！', '？', '…', '」', '"', ']', '】', '-', '`'].includes(lastChar)) {
    return trimmed;
  }

  // 从后往前找最后一个完整句子的结尾标点
  const sentenceEnders = ['。', '！', '？', '…', '」', '"'];
  let lastEndIdx = -1;

  for (const ender of sentenceEnders) {
    const idx = trimmed.lastIndexOf(ender);
    if (idx > lastEndIdx) {
      lastEndIdx = idx;
    }
  }

  if (lastEndIdx > 0) {
    return trimmed.substring(0, lastEndIdx + 1);
  }

  // 如果连一个句号都找不到，尝试按换行符分割，去掉最后一行不完整的
  const lines = trimmed.split('\n');
  if (lines.length > 3) {
    // 找最后一个以标点结尾的行
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line && ['。', '！', '？', '…', '」', '"'].includes(line.slice(-1))) {
        return lines.slice(0, i + 1).join('\n');
      }
    }
  }

  return trimmed;
}

function fixStory(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const story = JSON.parse(raw);

  const fixes = [];

  // 1. 移除元数据章节
  const originalContent = story.content;
  let cleanedContent = removeMetaSections(story.content);
  if (cleanedContent !== originalContent) {
    fixes.push('removed_meta_sections');
    story.content = cleanedContent;
  }

  // 2. 裁剪截断内容到最后完整句子
  const beforeTrim = story.content;
  story.content = trimToLastCompleteSentence(story.content);
  if (story.content !== beforeTrim) {
    fixes.push('trimmed_truncated_content');
  }

  // 3. 修复 mood（英文→中文）
  if (story.mood && moodMap[story.mood.toLowerCase()]) {
    const oldMood = story.mood;
    story.mood = moodMap[story.mood.toLowerCase()];
    fixes.push(`mood: ${oldMood} → ${story.mood}`);
  }

  // 4. category → source
  if (story.category !== undefined) {
    story.source = 'AI原创';
    delete story.category;
    fixes.push('category → source: AI原创');
  }

  // 5. era '现代' → '当代'
  if (story.era === '现代') {
    story.era = '当代';
    fixes.push('era: 现代 → 当代');
  }

  // 6. 移除 is_official（不在 FloatingLifeStory 中）
  if (story.is_official !== undefined) {
    delete story.is_official;
    fixes.push('removed is_official');
  }

  // 7. 重新计算 word_count
  const pureText = story.content
    .replace(/^#{1,6}\s+.*$/gm, '')  // 移除标题
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // 移除加粗
    .replace(/\*([^*]+)\*/g, '$1')  // 移除斜体
    .replace(/---+/g, '')  // 移除分隔线
    .replace(/\n+/g, '')  // 移除换行
    .trim();
  const actualWordCount = pureText.length;
  if (Math.abs(actualWordCount - (story.word_count || 0)) > 100) {
    fixes.push(`word_count: ${story.word_count} → ${actualWordCount}`);
    story.word_count = actualWordCount;
  }

  // 写回文件
  if (fixes.length > 0) {
    fs.writeFileSync(filePath, JSON.stringify(story, null, 2) + '\n', 'utf8');
  }

  return { file: path.basename(filePath), fixes, contentLength: story.content.length };
}

// 主程序
function main() {
  const files = fs.readdirSync(BATCH_DIR)
    .filter(f => /^story_\d{3}_/.test(f))
    .sort();

  console.log(`\n========== 修复100篇人生副本故事 ==========\n`);
  console.log(`找到 ${files.length} 个故事文件\n`);

  let fixed = 0;
  let skipped = 0;
  let truncated = 0;

  const results = files.map(f => {
    const filePath = path.join(BATCH_DIR, f);
    const result = fixStory(filePath);
    if (result.fixes.length > 0) {
      fixed++;
      const isTruncated = result.fixes.includes('trimmed_truncated_content');
      if (isTruncated) truncated++;
    } else {
      skipped++;
    }
    return result;
  });

  // 输出修复报告
  console.log('=== 修复报告 ===\n');
  console.log(`已修复: ${fixed} 篇`);
  console.log(`无需修复: ${skipped} 篇`);
  console.log(`其中内容被截断（已裁剪到最后完整句）: ${truncated} 篇\n`);

  // 输出截断的故事列表
  const truncatedStories = results.filter(r => r.fixes.includes('trimmed_truncated_content'));
  if (truncatedStories.length > 0) {
    console.log('--- 截断故事列表（需要后续补全）---');
    truncatedStories.forEach(r => console.log(`  ${r.file} (${r.contentLength} chars)`));
    console.log('');
  }

  // 输出详细修复记录
  console.log('--- 详细修复记录 ---');
  results.filter(r => r.fixes.length > 0).forEach(r => {
    console.log(`\n${r.file}:`);
    r.fixes.forEach(f => console.log(`  + ${f}`));
  });

  console.log('\n\n========== 修复完成 ==========\n');
}

main();
