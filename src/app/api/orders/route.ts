import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const body = await request.json();
  const { order_type, quantity } = body;

  // Calculate amount
  const pricing: Record<string, (q: number) => number> = {
    membership: () => 2800, // 28元 = 2800分
    script_tokens: (q: number) => {
      if (q === 5) return 300;
      if (q === 10) return 500;
      return q * 100; // 1元/个
    },
    diy_tokens: (q: number) => {
      if (q === 3) return 500;
      if (q === 10) return 1000;
      return q * 200; // 2元/个
    },
  };

  const amount_cents = pricing[order_type]?.(quantity);
  if (!amount_cents) {
    return NextResponse.json({ error: '无效的订单类型' }, { status: 400 });
  }

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      order_type,
      amount_cents,
      quantity: quantity || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // TODO: Create WeChat Pay QR code / payment link
  // For MVP, return order info for frontend to display
  return NextResponse.json({
    order,
    payment_url: null, // Will be populated when WeChat Pay is integrated
    message: '支付功能即将上线，敬请期待',
  });
}
