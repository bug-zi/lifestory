import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, Sparkles, Library, Trophy, ArrowRight, Feather } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero — Storyteller Incipit */}
      <section className="relative flex flex-col items-center text-center py-16 md:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(45,106,79,0.06),transparent)]" />

        {/* Classical incipit */}
        <p className="storyteller-quote text-sm mb-6 animate-fade-in-up">
          「人生如逆旅，我亦是行人」
        </p>

        {/* Title with ornamental accent */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight font-heading">
            人生副本
          </h1>
          <div className="mx-auto mt-3 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-accent/40" />
            <Feather className="h-4 w-4 text-accent/60" />
            <span className="h-px w-12 bg-accent/40" />
          </div>
        </div>

        <p className="mt-4 text-lg md:text-xl text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          且听我道来——
        </p>
        <p className="mt-2 max-w-xl text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
          每一天，打开一卷全新的人生。
          从帝王将相到市井烟火，从远方征途到墨色书房，
          在别人的故事里，照见自己的影子。
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <Link href="/scripts/daily">
            <Button size="lg" className="gap-2 text-base bg-accent text-accent-foreground hover:bg-accent/90">
              <BookOpen className="h-5 w-5" />
              翻开今天的副本
            </Button>
          </Link>
          <Link href="/diy">
            <Button size="lg" variant="outline" className="gap-2 text-base">
              <Sparkles className="h-5 w-5" />
              自撰一卷人生
            </Button>
          </Link>
        </div>
      </section>

      {/* Ink divider */}
      <div className="ink-divider" />

      {/* Feature Cards — Narrative Style */}
      <section className="grid md:grid-cols-2 gap-6 py-12">
        <FeatureCard
          icon={<BookOpen className="h-7 w-7" />}
          title="每日副本"
          description="每日黎明，书案上会多出一卷新墨。随机解锁一段精选人生，五百余卷，各有乾坤。"
          href="/scripts/daily"
          delay={0}
        />
        <FeatureCard
          icon={<Sparkles className="h-7 w-7" />}
          title="自撰人生"
          description="你想成为什么样的人？落笔一个念头，AI便为你展开一段从未想象过的人生旅途。"
          href="/diy"
          delay={0.1}
        />
        <FeatureCard
          icon={<Library className="h-7 w-7" />}
          title="人生书架"
          description="读过的每一卷人生，都可以收藏于此。日积月累，便成了你独有的人生故事集。"
          href="/library"
          delay={0.2}
        />
        <FeatureCard
          icon={<Trophy className="h-7 w-7" />}
          title="名人堂"
          description="古今中外，千位传奇人物的人生等你翻阅。择一位英雄，走一段他的路。"
          href="/hall-of-fame"
          delay={0.3}
        />
      </section>

      {/* Bottom CTA — Story Invitation */}
      <div className="ink-divider" />
      <section className="text-center py-10">
        <p className="text-muted-foreground mb-1 text-sm">
          每日签到，领取一枚副本印记
        </p>
        <p className="text-muted-foreground/60 text-xs mb-6">
          一印一卷，且看且珍惜
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
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  delay: number;
}) {
  return (
    <Link href={href}>
      <div
        className="rounded-xl border bg-card p-6 cursor-pointer h-full border-t-2 border-t-accent/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up"
        style={delay > 0 ? { animationDelay: `${delay}s` } : undefined}
      >
        <div className="text-accent mb-3">{icon}</div>
        <h3 className="font-semibold text-lg mb-2 font-heading">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
}
