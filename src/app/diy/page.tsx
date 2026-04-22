'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Send, Loader2, LogIn, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Question {
  id: number;
  question: string;
  options?: string[];
  stage?: string; // 职业阶段，如"活动人士"、"市议员"等
}

export default function DiyPage() {
  const router = useRouter();
  const [step, setStep] = useState<'input' | 'introduce' | 'questions' | 'generating' | 'done'>('input');
  const [inputLife, setInputLife] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [generatedScriptId, setGeneratedScriptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [freeUses, setFreeUses] = useState(3);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  async function checkLoginStatus() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
  }

  async function handleSubmitLife() {
    if (!inputLife.trim()) return;
    setLoading(true);
    try {
      // Step 1: Get life introduction
      const introRes = await fetch('/api/diy/introduce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_life: inputLife }),
      });
      const introData = await introRes.json();

      if (introData.introduction) {
        setIntroduction(introData.introduction);
        setStep('introduce');
      } else {
        toast.error(introData.error || '生成介绍失败');
      }
    } catch {
      toast.error('生成介绍失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmIntroduce() {
    setLoading(true);
    try {
      const res = await fetch('/api/diy/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_life: inputLife,
          introduction: introduction,
        }),
      });
      const data = await res.json();
      if (data.questions?.length > 0) {
        setQuestions(data.questions);
        setStep('questions');
      } else {
        // Skip questions, generate directly
        await generateScript([]);
      }
    } catch {
      toast.error('获取问题失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswerAndGenerate() {
    const qa = questions.map((q) => ({
      question: q.question,
      answer: answers[q.id] || '',
    }));
    await generateScript(qa);
  }

  async function generateScript(qa: { question: string; answer: string }[]) {
    setLoading(true);
    setStep('generating');
    try {
      const res = await fetch('/api/diy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_life: inputLife,
          questions: qa,
        }),
      });

      if (res.status === 402) {
        toast.error('DIY印记不足，请前往印记商店购买');
        setStep('input');
        return;
      }

      const data = await res.json();
      if (data.script) {
        setGeneratedScriptId(data.script.id);
        setStep('done');
      } else {
        toast.error(data.error || '生成失败');
        setStep('input');
      }
    } catch {
      toast.error('生成失败，请稍后重试');
      setStep('input');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToReadLater() {
    console.log('[稍后再读] 点击按钮, generatedScriptId:', generatedScriptId);

    if (!generatedScriptId) {
      console.error('[稍后再读] 剧本ID为空');
      toast.error('剧本ID不存在');
      return;
    }

    console.log('[稍后再读] 开始请求, script_id:', generatedScriptId);

    try {
      const res = await fetch('/api/read-later', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_id: generatedScriptId }),
      });

      console.log('[稍后再读] 响应状态:', res.status, res.ok);

      let data;
      try {
        data = await res.json();
        console.log('[稍后再读] 响应数据:', data);
      } catch (e) {
        console.warn('[稍后再读] JSON解析失败:', e);
        data = null;
      }

      if (res.ok) {
        console.log('[稍后再读] 成功添加');
        toast.success(data?.message || '已添加到稍后再读');
      } else {
        console.error('[稍后再读] 请求失败:', data);
        toast.error(data?.error || '操作失败，请稍后重试');
      }
    } catch (err) {
      console.error('[稍后再读] 网络错误:', err);
      toast.error('网络错误，请检查连接后重试');
    }
  }

  if (isLoggedIn === null) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoggedIn === false) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">🔐</div>
            <h2 className="text-xl font-semibold mb-2">需要登录</h2>
            <p className="text-muted-foreground mb-6">
              DIY 人生副本需要登录后才能使用
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/login">
                <Button className="w-full gap-2">
                  <LogIn className="h-4 w-4" />
                  登录
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="w-full">
                  注册账号
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">AI正在为你编织人生...</h2>
          <p className="text-muted-foreground">
            「{inputLife}」的一生正在生成中，请稍候
          </p>
        </div>
      </div>
    );
  }

  if (step === 'done' && generatedScriptId) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">✨</div>
            <h2 className="text-xl font-semibold mb-2">人生副本已生成！</h2>
            <p className="text-muted-foreground mb-6">
              「{inputLife}」的人生副本已经准备好了
            </p>
            <div className="flex flex-col gap-2">
              <Link href={`/scripts/${generatedScriptId}`}>
                <Button className="w-full">阅读你的副本</Button>
              </Link>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleAddToReadLater}
              >
                <Clock className="h-4 w-4" />
                稍后再读
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStep('input');
                  setInputLife('');
                  setQuestions([]);
                  setAnswers({});
                }}
              >
                再生成一个
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'introduce') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">关于「{inputLife}」</h1>
          <p className="text-muted-foreground mt-2">
            这是你将要体验的人生概览
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">人生概览</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {introduction}
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={() => setStep('input')}>
            返回修改
          </Button>
          <Button onClick={handleConfirmIntroduce} disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            继续定制
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'questions') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">定制你的人生</h1>
          <p className="text-muted-foreground mt-2">
            回答几个问题，让AI为你量身打造「{inputLife}」的人生副本
          </p>
        </div>

        <div className="space-y-6">
          {questions.map((q, index) => (
            <Card key={q.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  {q.stage && (
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {q.stage}
                    </span>
                  )}
                  {!q.stage && (
                    <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">
                      阶段 {index + 1}/{questions.length}
                    </span>
                  )}
                </div>
                <CardTitle className="text-base mt-2">{q.question}</CardTitle>
              </CardHeader>
              <CardContent>
                {q.options ? (
                  <div className="flex flex-col gap-2">
                    {q.options.map((opt, i) => (
                      <Button
                        key={i}
                        variant={answers[q.id] === opt ? 'default' : 'outline'}
                        className="justify-start text-left h-auto py-3 whitespace-normal"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                        }
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <Input
                    placeholder="自由输入你的想法..."
                    value={answers[q.id] || ''}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-between">
          <Button variant="ghost" onClick={() => setStep('input')}>
            返回修改
          </Button>
          <Button onClick={handleAnswerAndGenerate} disabled={loading} className="gap-2">
            <Sparkles className="h-4 w-4" />
            生成人生副本
          </Button>
        </div>
      </div>
    );
  }

  // step === 'input'
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center mb-12">
        <div className="text-5xl mb-4">✨</div>
        <h1 className="text-3xl font-bold">DIY 你的人生</h1>
        <p className="text-muted-foreground mt-3 max-w-md mx-auto">
          输入你想体验的人生，AI会为你生成一段独一无二的人生副本。
          你想成为什么样的人？
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              placeholder="输入你想体验的人生，例如：富豪、画家、宇航员..."
              value={inputLife}
              onChange={(e) => setInputLife(e.target.value)}
              className="text-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitLife()}
            />
            <Button
              onClick={handleSubmitLife}
              disabled={loading || !inputLife.trim()}
              className="gap-2 shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              开始
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {['富豪', '画家', '宇航员', '总统', '法官', '探险家', '厨师', '流浪歌手'].map(
              (tag) => (
                <Button
                  key={tag}
                  variant="outline"
                  size="sm"
                  onClick={() => setInputLife(tag)}
                >
                  {tag}
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>每次使用消耗1个DIY印记 | 新用户有3次免费体验机会</p>
      </div>
    </div>
  );
}
