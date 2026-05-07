/**
 * 浮生记种子数据插入脚本
 * 用法: node scripts/batch/seed-floating-life.js
 * Note: Story data has been cleared. Re-populate with high-quality content.
 */

const fs = require('fs');
const path = require('path');

// Load env
const envContent = fs.readFileSync(path.join(__dirname, '..', '..', '.env.local'), 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const stories = [
  // Add high-quality stories here
];

if (stories.length === 0) {
  console.log('No stories to insert. Add story data to the stories array.');
  process.exit(0);
}

async function seed() {
  for (const story of stories) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/floating_life_stories`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(story),
    });
    if (!res.ok) {
      console.error(`Failed to insert "${story.title}": ${await res.text()}`);
    } else {
      console.log(`Inserted: ${story.title}`);
    }
  }
  console.log('Done!');
}

seed();
