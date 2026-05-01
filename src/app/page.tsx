'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, Sparkles, Library, Trophy, ArrowRight, Feather } from 'lucide-react';

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  const belowRef = useRef<HTMLElement>(null);
  const [belowVisible, setBelowVisible] = useState(false);

  useEffect(() => {
    // Intersection Observer for below-fold content fade-in
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setBelowVisible(true);
      },
      { threshold: 0.1 }
    );

    if (belowRef.current) observer.observe(belowRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Hero parallax fade-out on scroll
    const handleScroll = () => {
      if (!heroRef.current) return;
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const progress = Math.min(scrollY / vh, 1);
      heroRef.current.style.opacity = `${1 - progress * 0.6}`;
      heroRef.current.style.transform = `translateY(${scrollY * 0.15}px)`;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero — full viewport, fades out on scroll */}
      <section
        ref={heroRef}
        className="relative flex flex-col items-center text-center min-h-[calc(100dvh-7.5rem)] overflow-hidden pt-[10vh]"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(45,106,79,0.06),transparent)]" />

        {/* Flying geese — ink-wash style */}
        <div className="ink-geese-container">
          <div className="ink-goose"><svg width="28" height="12" viewBox="0 0 28 12" fill="none" stroke="oklch(0.30 0.02 60 / 0.35)" strokeWidth="1.3" strokeLinecap="round"><path d="M0 8 Q7 0 14 6 Q21 0 28 8"/><path d="M11 5 L14 1 L17 5" strokeWidth="0.9"/></svg></div>
          <div className="ink-goose"><svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="oklch(0.30 0.02 60 / 0.30)" strokeWidth="1.1" strokeLinecap="round"><path d="M0 7 Q5 0 11 5 Q17 0 22 7"/></svg></div>
          <div className="ink-goose"><svg width="18" height="8" viewBox="0 0 18 8" fill="none" stroke="oklch(0.30 0.02 60 / 0.25)" strokeWidth="0.9" strokeLinecap="round"><path d="M0 6 Q4 0 9 4 Q14 0 18 6"/></svg></div>
          <div className="ink-goose"><svg width="24" height="10" viewBox="0 0 24 10" fill="none" stroke="oklch(0.30 0.02 60 / 0.32)" strokeWidth="1" strokeLinecap="round"><path d="M0 7 Q6 0 12 5 Q18 0 24 7"/></svg></div>
          <div className="ink-goose"><svg width="16" height="7" viewBox="0 0 16 7" fill="none" stroke="oklch(0.30 0.02 60 / 0.22)" strokeWidth="0.8" strokeLinecap="round"><path d="M0 5 Q4 0 8 4 Q12 0 16 5"/></svg></div>
        </div>

        {/* Ink splatters — scattered across hero */}
        <div className="ink-splatter-container">
          <div className="ink-dot" style={{ left: '5%', top: '8%', width: 10, height: 10, background: 'oklch(0.25 0.02 60 / 0.20)', borderRadius: '45% 55% 50% 50%' }} />
          <div className="ink-dot" style={{ left: '8%', top: '5%', width: 4, height: 4, background: 'oklch(0.25 0.02 60 / 0.15)' }} />
          <div className="ink-dot" style={{ left: '3%', top: '14%', width: 3, height: 8, background: 'oklch(0.25 0.02 60 / 0.12)', borderRadius: '40% 60% 45% 55%', transform: 'rotate(-20deg)' }} />
          <div className="ink-dot" style={{ right: '7%', top: '6%', width: 7, height: 7, background: 'oklch(0.25 0.02 60 / 0.18)', borderRadius: '55% 45% 50% 50%' }} />
          <div className="ink-dot" style={{ right: '4%', top: '12%', width: 3, height: 3, background: 'oklch(0.25 0.02 60 / 0.10)' }} />
          <div className="ink-dot" style={{ right: '10%', top: '3%', width: 4, height: 6, background: 'oklch(0.25 0.02 60 / 0.14)', borderRadius: '50% 40% 55% 45%', transform: 'rotate(15deg)' }} />
          <div className="ink-dot" style={{ left: '12%', top: '42%', width: 6, height: 14, background: 'oklch(0.25 0.02 60 / 0.22)', borderRadius: '40% 60% 45% 55%', transform: 'rotate(-8deg)' }} />
          <div className="ink-dot" style={{ left: '6%', top: '55%', width: 3, height: 3, background: 'oklch(0.25 0.02 60 / 0.10)' }} />
          <div className="ink-dot" style={{ left: '15%', top: '48%', width: 2, height: 2, background: 'oklch(0.25 0.02 60 / 0.08)' }} />
          <div className="ink-dot" style={{ right: '9%', top: '38%', width: 8, height: 5, background: 'oklch(0.25 0.02 60 / 0.16)', borderRadius: '50% 45% 55% 50%', transform: 'rotate(25deg)' }} />
          <div className="ink-dot" style={{ right: '14%', top: '50%', width: 3, height: 3, background: 'oklch(0.25 0.02 60 / 0.12)' }} />
          <div className="ink-dot" style={{ right: '5%', top: '45%', width: 5, height: 3, background: 'oklch(0.25 0.02 60 / 0.10)', transform: 'rotate(-10deg)' }} />
          <div className="ink-dot" style={{ left: '10%', bottom: '15%', width: 4, height: 12, background: 'oklch(0.25 0.02 60 / 0.18)', borderRadius: '50% 50% 40% 40%', transform: 'rotate(5deg)' }} />
          <div className="ink-dot" style={{ left: '18%', bottom: '8%', width: 3, height: 3, background: 'oklch(0.25 0.02 60 / 0.08)' }} />
          <div className="ink-dot" style={{ right: '8%', bottom: '12%', width: 5, height: 15, background: 'oklch(0.25 0.02 60 / 0.20)', borderRadius: '45% 55% 35% 40%', transform: 'rotate(-12deg)' }} />
          <div className="ink-dot" style={{ right: '12%', bottom: '18%', width: 2, height: 2, background: 'oklch(0.25 0.02 60 / 0.06)' }} />
          <div className="ink-dot" style={{ left: '22%', top: '18%', width: 2, height: 2, background: 'oklch(0.25 0.02 60 / 0.10)' }} />
          <div className="ink-dot" style={{ left: '35%', top: '5%', width: 3, height: 3, background: 'oklch(0.25 0.02 60 / 0.08)' }} />
          <div className="ink-dot" style={{ right: '25%', top: '10%', width: 2, height: 3, background: 'oklch(0.25 0.02 60 / 0.09)', transform: 'rotate(30deg)' }} />
          <div className="ink-dot" style={{ right: '20%', bottom: '25%', width: 3, height: 3, background: 'oklch(0.25 0.02 60 / 0.07)' }} />
          <div className="ink-dot" style={{ left: '28%', bottom: '20%', width: 2, height: 4, background: 'oklch(0.25 0.02 60 / 0.09)', transform: 'rotate(-15deg)' }} />
          <div className="ink-dot" style={{ left: '16%', top: '25%', width: 4, height: 4, background: 'oklch(0.45 0.08 155 / 0.12)' }} />
          <div className="ink-dot" style={{ right: '18%', bottom: '30%', width: 3, height: 3, background: 'oklch(0.45 0.08 155 / 0.10)' }} />
        </div>

        {/* Classical incipit — appears after title */}
        <p className="storyteller-quote text-sm mb-6 animate-fade-in-up font-calligraphy relative z-10" style={{ animationDelay: '2.2s' }}>
          「人生如逆旅，我亦是行人」
        </p>

        {/* Title with ink decorations — brush-draw animation, appears first */}
        <div className="animate-fade-in-up relative z-10" style={{ animationDelay: '0s' }}>
          <div className="ink-title-frame">
            <h1 className="font-calligraphy select-none flex items-baseline justify-center gap-[0.05em] animate-brush-draw">
              <span
                className="text-ink-shadow inline-block"
                style={{ fontSize: 'clamp(3rem, 10vw, 7rem)', transform: 'rotate(-2deg) translateY(0.04em)', lineHeight: 1.2 } as React.CSSProperties}
              >人</span>
              <span
                className="text-ink-shadow inline-block"
                style={{ fontSize: 'clamp(3.2rem, 11vw, 7.5rem)', transform: 'rotate(1deg)', lineHeight: 1.1 } as React.CSSProperties}
              >生</span>
              <span
                className="text-ink-shadow inline-block"
                style={{ fontSize: 'clamp(2.8rem, 9.5vw, 6.8rem)', transform: 'rotate(-1.5deg) translateY(-0.02em)', lineHeight: 1.2 } as React.CSSProperties}
              >副</span>
              <span
                className="text-ink-shadow inline-block"
                style={{ fontSize: 'clamp(3.1rem, 10.5vw, 7.2rem)', transform: 'rotate(2.5deg) translateY(0.03em)', lineHeight: 1.1 } as React.CSSProperties}
              >本</span>
            </h1>
          </div>
          <div className="mx-auto mt-5 flex items-center justify-center gap-3">
            <span className="h-px w-20 bg-gradient-to-r from-transparent to-accent/30" />
            <Feather className="h-3.5 w-3.5 text-accent/50" />
            <span className="h-px w-20 bg-gradient-to-l from-transparent to-accent/30" />
          </div>
        </div>

        <p className="mt-6 text-lg leading-loose font-calligraphy tracking-wider animate-fade-in-up relative z-10" style={{ animationDelay: '2.6s' }}>
          <span className="text-foreground font-medium">每日一卷，活一段别样人生</span>
          <br />
          <span className="text-muted-foreground">帝王将相，或市井烟火</span>
          <br />
          <span className="text-accent/80 font-medium">在别人的故事里，照见自己</span>
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 animate-fade-in-up relative z-10" style={{ animationDelay: '3s' }}>
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

      {/* Ink divider — boundary between two screens */}
      <div className="ink-divider" />

      {/* Below-fold content — fades in on scroll */}
      <section
        ref={belowRef}
        className={`transition-all duration-700 ease-out ${
          belowVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6 py-12">
          <FeatureCard
            icon={<BookOpen className="h-7 w-7" />}
            title="每日副本"
            description="每日黎明，书案上会多出一卷新墨。随机解锁一段精选人生，五百余卷，各有乾坤。"
            href="/scripts/daily"
          />
          <FeatureCard
            icon={<Sparkles className="h-7 w-7" />}
            title="自撰人生"
            description="你想成为什么样的人？落笔一个念头，AI便为你展开一段从未想象过的人生旅途。"
            href="/diy"
          />
          <FeatureCard
            icon={<Library className="h-7 w-7" />}
            title="人生书架"
            description="读过的每一卷人生，都可以收藏于此。日积月累，便成了你独有的人生故事集。"
            href="/library"
          />
          <FeatureCard
            icon={<Trophy className="h-7 w-7" />}
            title="名人堂"
            description="古今中外，千位传奇人物的人生等你翻阅。择一位英雄，走一段他的路。"
            href="/hall-of-fame"
          />
        </div>

        {/* Bottom CTA */}
        <div className="ink-divider" />
        <div className="text-center py-10">
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
        </div>
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
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="rounded-xl border bg-card p-6 cursor-pointer h-full border-t-2 border-t-accent/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
        <div className="text-accent mb-3">{icon}</div>
        <h3 className="font-semibold text-lg mb-2 font-heading">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
}
