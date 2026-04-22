import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, Sparkles, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Hero */}
      <section className="flex flex-col items-center text-center py-16 md:py-24">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          人生副本
        </h1>
        <p className="mt-2 text-lg md:text-xl text-muted-foreground">
          你想活出怎样的人生？
        </p>
        <p className="mt-4 max-w-xl text-muted-foreground">
          每一天，体验一段截然不同的人生。从黑客到冠军，从画家到探险家，
          在别人的故事里，找到自己的答案。
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link href="/scripts/daily">
            <Button size="lg" className="gap-2 text-base">
              <BookOpen className="h-5 w-5" />
              今天的人生副本
            </Button>
          </Link>
          <Link href="/diy">
            <Button size="lg" variant="outline" className="gap-2 text-base">
              <Sparkles className="h-5 w-5" />
              DIY 你的人生
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-2 gap-6 py-12">
        <FeatureCard
          icon="📖"
          title="每日副本"
          description="每天随机解锁一段精选人生故事。500+份高质量人生副本，覆盖各行各业的真实与虚构人生。"
          href="/scripts/daily"
        />
        <FeatureCard
          icon="✨"
          title="DIY人生"
          description="输入你感兴趣的人生，AI为你量身定制。通过互动问答，生成独一无二的人生副本。"
          href="/diy"
        />
        <FeatureCard
          icon="📚"
          title="人生库"
          description="把你喜欢的人生副本收藏起来。支持二次创作和编辑，打造属于你的人生故事集。"
          href="/library"
        />
        <FeatureCard
          icon="💬"
          title="人生对照"
          description="读完每篇副本，回望自己的选择。在别人的人生里，看见不一样的自己。"
          href="/scripts/daily"
        />
      </section>

      {/* CTA */}
      <section className="text-center py-12 border-t">
        <p className="text-muted-foreground mb-4">
          每天签到免费领取一枚副本印记
        </p>
        <Link href="/checkin">
          <Button variant="outline" className="gap-2">
            前往签到
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow cursor-pointer h-full">
        <div className="text-3xl mb-3">{icon}</div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
}
