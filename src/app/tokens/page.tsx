'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Coins, Crown, Gift } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import type { UserToken } from '@/types';

const scriptPacks = [
  { quantity: 1, price: 1, label: '1个印记' },
  { quantity: 5, price: 3, label: '5个印记', badge: '省2元' },
  { quantity: 10, price: 5, label: '10个印记', badge: '省5元' },
];

const diyPacks = [
  { quantity: 1, price: 2, label: '1个DIY印记' },
  { quantity: 3, price: 5, label: '3个DIY印记', badge: '省1元' },
  { quantity: 10, price: 10, label: '10个DIY印记', badge: '省10元' },
];

export default function TokensPage() {
  const [tokens, setTokens] = useState<UserToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: { data: { user: any } }) => {
      setUser(data.user);
      if (data.user) {
        fetch('/api/tokens')
          .then((res) => res.json())
          .then((data) => setTokens(data.tokens || []))
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, []);

  const scriptBalance = tokens.find((t) => t.token_type === 'script')?.balance ?? 0;
  const diyBalance = tokens.find((t) => t.token_type === 'diy')?.balance ?? 0;

  async function handlePurchase(type: string, quantity: number) {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_type: type === 'script' ? 'script_tokens' : 'diy_tokens',
          quantity,
        }),
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">印记商店</h1>
        <p className="text-muted-foreground mt-1">
          购买印记，解锁更多人生体验
        </p>
      </div>

      {/* Current balance */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="text-center py-6">
            <Coins className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-3xl font-bold">{scriptBalance}</p>
            <p className="text-sm text-muted-foreground">副本印记</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-6">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <p className="text-3xl font-bold">{diyBalance}</p>
            <p className="text-sm text-muted-foreground">DIY印记</p>
          </CardContent>
        </Card>
      </div>

      {/* Membership banner */}
      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-primary" />
            <div>
              <p className="font-semibold">永久会员</p>
              <p className="text-sm text-muted-foreground">
                无限副本印记 + 无限DIY生成
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">¥28</p>
            <Link href="/membership">
              <Button size="sm">开通</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Free ways */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="h-4 w-4" />
            免费获取印记
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">每日签到</span>
            <Link href="/checkin">
              <Button size="sm" variant="outline">
                +1 副本印记
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">每日分享</span>
            <Button size="sm" variant="outline">
              +1 副本印记
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Script token packs */}
      <h2 className="font-semibold text-lg mb-4">副本印记</h2>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {scriptPacks.map((pack) => (
          <Card
            key={pack.quantity}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => handlePurchase('script', pack.quantity)}
          >
            <CardContent className="text-center py-4">
              {pack.badge && (
                <Badge className="mb-2 text-xs">{pack.badge}</Badge>
              )}
              <p className="font-semibold">{pack.label}</p>
              <p className="text-2xl font-bold mt-1">¥{pack.price}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* DIY token packs */}
      <h2 className="font-semibold text-lg mb-4">DIY印记</h2>
      <div className="grid grid-cols-3 gap-3">
        {diyPacks.map((pack) => (
          <Card
            key={pack.quantity}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => handlePurchase('diy', pack.quantity)}
          >
            <CardContent className="text-center py-4">
              {pack.badge && (
                <Badge className="mb-2 text-xs">{pack.badge}</Badge>
              )}
              <p className="font-semibold">{pack.label}</p>
              <p className="text-2xl font-bold mt-1">¥{pack.price}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Sparkles(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
    </svg>
  );
}
