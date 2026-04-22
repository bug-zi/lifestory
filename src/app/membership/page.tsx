'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, BookOpen, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const perks = [
  { icon: BookOpen, text: '无限阅读每日副本' },
  { icon: Sparkles, text: '无限DIY生成人生副本' },
  { icon: Zap, text: 'AI优先生成队列' },
  { icon: Crown, text: '专属会员标识' },
];

export default function MembershipPage() {
  async function handlePurchase() {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_type: 'membership' }),
      });
      const data = await res.json();
      if (data.message) {
        toast.info(data.message);
      }
    } catch {
      toast.error('创建订单失败');
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="text-center mb-8">
        <Crown className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
        <h1 className="text-2xl font-bold">成为会员</h1>
        <p className="text-muted-foreground mt-1">
          解锁全部人生副本体验
        </p>
      </div>

      <Card className="border-primary/20">
        <CardHeader className="text-center">
          <Badge className="w-fit mx-auto mb-2">限时优惠</Badge>
          <CardTitle className="text-3xl">¥28</CardTitle>
          <p className="text-sm text-muted-foreground">永久会员 · 一次购买终身享受</p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 mb-8">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-1.5">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <Button className="w-full" size="lg" onClick={handlePurchase}>
            <Crown className="h-4 w-4 mr-2" />
            立即开通
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-3">
            支付即表示同意用户协议 · 支持微信支付
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
