'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Bot, Save, Eye, EyeOff, Zap, Crown, Camera, Type } from 'lucide-react';
import { FontSettingsPanel } from '@/components/FontSettingsPanel';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/components/auth-provider';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Profile, AIConfig, AIProvider } from '@/types';
import { AI_PROVIDER_OPTIONS } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuthContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile fields
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // AI config fields
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    provider: 'deepseek',
    api_key: '',
    model: 'deepseek-chat',
  });
  const [hasAiConfig, setHasAiConfig] = useState(false); // 是否已配置 AI
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; reply?: string; latency?: number; error?: string; provider?: string; model?: string } | null>(null);

  useEffect(() => {
    if (!authLoading) loadProfile();
  }, [authLoading]);

  async function loadProfile() {
    if (!authUser) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setUsername(data.profile.username || '');
        setAvatarUrl(data.profile.avatar_url || '');
        if (data.profile.ai_config) {
          setAiConfig({
            ...data.profile.ai_config,
            api_key: '', // Always show empty for security
          });
          setHasAiConfig(true);
        }
      }
    } catch {
      toast.error('加载个人信息失败');
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, avatar_url: avatarUrl }),
      });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        toast.success('个人信息已保存');
      } else {
        toast.error(data.error || '保存失败');
      }
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function saveAiConfig() {
    // First, validate the connection if api_key is provided
    if (aiConfig.api_key && !aiConfig.api_key.includes('•••')) {
      setSaving(true);
      setTestResult(null);
      try {
        const testRes = await fetch('/api/profile/test-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ai_config: aiConfig }),
        });
        const testData = await testRes.json();
        setTestResult(testData);

        if (!testData.ok) {
          toast.error(`连接验证失败：${testData.error || '无法连接到 AI 服务'}`);
          setSaving(false);
          return;
        }
      } catch {
        setTestResult({ ok: false, error: '网络请求失败' });
        toast.error('网络请求失败，无法验证连接');
        setSaving(false);
        return;
      }
    }

    setSaving(true);
    try {
      const configToSave = { ...aiConfig };
      // Only send api_key if user entered a new one
      if (!configToSave.api_key) {
        // Keep existing by sending masked placeholder
        configToSave.api_key = '••••••••keep';
      }
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_config: configToSave }),
      });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setAiConfig((prev) => ({ ...prev, api_key: '' }));

        // Show success message with model name
        const providerLabel = AI_PROVIDER_OPTIONS.find((o) => o.value === data.profile.ai_config?.provider)?.label || '';
        const modelName = data.profile.ai_config?.model || '';
        toast.success(`已配置 ${providerLabel} ${modelName}`);
      } else {
        toast.error(data.error || '保存失败');
      }
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过 2MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.avatar_url) {
        setAvatarUrl(data.avatar_url);
        toast.success('头像已更新');
      } else {
        toast.error(data.error || '上传失败');
      }
    } catch {
      toast.error('上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleProviderChange(provider: AIProvider) {
    const option = AI_PROVIDER_OPTIONS.find((o) => o.value === provider);
    setAiConfig({
      provider,
      api_key: '',
      model: option?.models[0] || '',
    });
    setTestResult(null);
  }

  async function testConnection() {
    if (!aiConfig.api_key) {
      toast.error('请先输入 API Key');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/profile/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_config: aiConfig }),
      });
      const data = await res.json();
      setTestResult(data);
      if (data.ok) {
        toast.success(`连接成功！延迟 ${data.latency}ms`);
      } else {
        toast.error(data.error || '连接失败');
      }
    } catch {
      setTestResult({ ok: false, error: '网络请求失败' });
      toast.error('网络请求失败');
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="relative group">
          <Avatar className="h-16 w-16 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-xl">
              {username?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <Camera className="h-5 w-5 text-white" />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            我的
            {profile?.is_member && profile.member_expires_at && new Date(profile.member_expires_at) > new Date() && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-2 py-0.5 border-0 gap-1">
                <Crown className="h-3 w-3" />
                会员
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            {username || '未设置用户名'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="account">
        <TabsList className="w-full">
          <TabsTrigger value="account" className="flex-1 gap-1.5">
            <User className="h-4 w-4" />
            账号信息
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex-1 gap-1.5">
            <Bot className="h-4 w-4" />
            AI 配置
          </TabsTrigger>
          <TabsTrigger value="font" className="flex-1 gap-1.5">
            <Type className="h-4 w-4" />
            阅读设置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>账号信息</CardTitle>
              <CardDescription>点击头像可更换，支持 PNG/JPG/WebP/GIF，最大 2MB</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-20 w-20 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-2xl">
                      {username?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">用户名</label>
                  <Input
                    placeholder="给自己取个名字"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveProfile()}
                  />
                </div>
              </div>
              <Separator />
              <Button onClick={saveProfile} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                保存
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI 模型配置</CardTitle>
                  <CardDescription>
                    配置你自己的 AI 模型，用于 DIY 人生副本生成。支持 DeepSeek、豆包、智谱、千问、ChatGPT。
                  </CardDescription>
                </div>
                {hasAiConfig && (
                  <Badge variant="secondary" className="gap-1">
                    <Bot className="h-3 w-3" />
                    已配置
                  </Badge>
                )}
              </div>
              {hasAiConfig && profile?.ai_config && (
                <div className="mt-3 rounded-md bg-muted/50 p-3 text-sm">
                  <span className="text-muted-foreground">当前配置：</span>
                  <span className="font-medium">
                    {AI_PROVIDER_OPTIONS.find(o => o.value === profile.ai_config?.provider)?.label} · {profile.ai_config.model}
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">AI 服务商</label>
                <div className="grid grid-cols-5 gap-2">
                  {AI_PROVIDER_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      variant={aiConfig.provider === opt.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleProviderChange(opt.value)}
                      className="text-xs"
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">模型</label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={aiConfig.model}
                  onChange={(e) => setAiConfig((prev) => ({ ...prev, model: e.target.value }))}
                >
                  {AI_PROVIDER_OPTIONS.find((o) => o.value === aiConfig.provider)?.models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="输入你的 API Key"
                    value={aiConfig.api_key}
                    onChange={(e) => setAiConfig((prev) => ({ ...prev, api_key: e.target.value }))}
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {aiConfig.provider === 'deepseek' && '前往 platform.deepseek.com 获取 API Key'}
                  {aiConfig.provider === 'doubao' && '前往 console.volcengine.com/ark 获取 API Key'}
                  {aiConfig.provider === 'zhipu' && '前往 open.bigmodel.cn 获取 API Key'}
                  {aiConfig.provider === 'qwen' && '前往 dashscope.console.aliyun.com 获取 API Key'}
                  {aiConfig.provider === 'chatgpt' && '前往 platform.openai.com 获取 API Key'}
                </p>
              </div>

              <Separator />

              {testResult && (
                <div className={`rounded-md p-3 text-sm ${testResult.ok ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200' : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'}`}>
                  {testResult.ok
                    ? `连接成功 | ${testResult.provider} / ${testResult.model} | 延迟 ${testResult.latency}ms | 回复：${testResult.reply}`
                    : `连接失败：${testResult.error}`}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={testConnection}
                  disabled={testing || !aiConfig.api_key}
                  className="gap-2"
                >
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  测试连接
                </Button>
                <Button onClick={saveAiConfig} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  保存 AI 配置
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="font" className="mt-6">
          <FontSettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
