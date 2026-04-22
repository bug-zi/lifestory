export type AIProvider = 'deepseek' | 'doubao' | 'zhipu' | 'qwen' | 'chatgpt';

export interface AIConfig {
  provider: AIProvider;
  api_key: string;
  model: string;
}

export const AI_PROVIDER_OPTIONS: { value: AIProvider; label: string; models: string[] }[] = [
  { value: 'deepseek', label: 'DeepSeek', models: ['deepseek-chat', 'deepseek-reasoner'] },
  { value: 'doubao', label: '豆包', models: ['doubao-1.5-pro-32k', 'doubao-1.5-lite-32k'] },
  { value: 'zhipu', label: '智谱 GLM', models: ['glm-4-plus', 'glm-4-flash', 'glm-4-air'] },
  { value: 'qwen', label: '千问', models: ['qwen-plus', 'qwen-turbo', 'qwen-max'] },
  { value: 'chatgpt', label: 'ChatGPT', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1'] },
];

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  ai_config: AIConfig | null;
  is_member: boolean;
  member_expires_at: string | null;
  created_at: string;
}

export interface Script {
  id: string;
  title: string;
  subtitle: string | null;
  content: string;
  cover_image: string | null;
  tags: string[];
  mood: string | null;
  category: string | null;
  era: string | null;
  word_count: number;
  author_id: string | null;
  is_official: boolean;
  view_count: number;
  rating_avg: number | null;
  created_at: string;
}

export interface UserToken {
  id: string;
  user_id: string;
  token_type: 'script' | 'diy';
  balance: number;
  updated_at: string;
}

export interface TokenTransaction {
  id: string;
  user_id: string;
  token_type: 'script' | 'diy';
  amount: number;
  reason: string;
  ref_id: string | null;
  created_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  check_in_date: string;
  reward_type: string;
  created_at: string;
}

export interface LibraryItem {
  id: string;
  user_id: string;
  script_id: string;
  script?: Script;
  custom_content: string | null;
  is_customized: boolean;
  note: string | null;
  saved_at: string;
}

export interface ReadLaterItem {
  id: string;
  user_id: string;
  script_id: string;
  script?: Script;
  saved_at: string;
}

export interface ScriptRating {
  id: string;
  user_id: string;
  script_id: string;
  rating: number;
  highlight_text: string | null;
  created_at: string;
}

export interface DiyGeneration {
  id: string;
  user_id: string;
  input_life: string;
  questions: { question: string; answer: string }[] | null;
  generated_script_id: string | null;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_type: 'membership' | 'script_tokens' | 'diy_tokens';
  amount_cents: number;
  quantity: number | null;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
}

export type ScriptMood = '热血' | '治愈' | '暗黑' | '荒诞' | '温馨' | '震撼' | '讽刺';
export type ScriptCategory = '科技' | '艺术' | '体育' | '政治' | '商业' | '冒险' | '犯罪' | '日常';
export type ScriptEra = '古代' | '近代' | '当代' | '未来';
