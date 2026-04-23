'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Calendar, Gift } from 'lucide-react';
import { useAuthContext } from '@/components/auth-provider';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CheckInPage() {
  const { user, loading: authLoading } = useAuthContext();
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      fetch('/api/checkin')
        .then((res) => res.json())
        .then((data) => setCheckedIn(data.checkedIn))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [authLoading, user]);

  async function handleCheckIn() {
    setChecking(true);
    try {
      const res = await fetch('/api/checkin', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCheckedIn(true);
        toast.success('签到成功！获得1枚副本印记');
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('签到失败');
    } finally {
      setChecking(false);
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-semibold mb-2">请先登录</h2>
            <p className="text-muted-foreground mb-6">登录后即可签到领取印记</p>
            <Link href="/login">
              <Button>前往登录</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="text-center mb-8">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-2xl font-bold">每日签到</h1>
        <p className="text-muted-foreground mt-1">每天签到领取1枚副本印记</p>
      </div>

      <Card>
        <CardContent className="py-8 text-center">
          {checkedIn ? (
            <>
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-semibold mb-2">今日已签到</h2>
              <p className="text-muted-foreground">
                明天再来领取新的印记吧
              </p>
            </>
          ) : (
            <>
              <Gift className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-xl font-semibold mb-2">领取今日奖励</h2>
              <p className="text-muted-foreground mb-6">
                签到可获得 <strong>1枚副本印记</strong>
              </p>
              <Button
                size="lg"
                onClick={handleCheckIn}
                disabled={checking}
                className="gap-2"
              >
                {checking ? '签到中...' : '立即签到'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Link href="/tokens">
          <Button variant="outline" size="sm">
            查看印记商店
          </Button>
        </Link>
      </div>
    </div>
  );
}
