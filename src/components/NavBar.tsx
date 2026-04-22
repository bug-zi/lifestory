'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Compass, Library, Coins, Sparkles, Menu, X, UserCircle, Clock, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

const navItems = [
  { href: '/', label: '首页', icon: Compass },
  { href: '/scripts/daily', label: '每日副本', icon: BookOpen },
  { href: '/diy', label: 'DIY人生', icon: Sparkles },
  { href: '/library', label: '人生库', icon: Library },
  { href: '/read-later', label: '稍后再读', icon: Clock },
  { href: '/hall-of-fame', label: '名人堂', icon: Trophy },
  { href: '/tokens', label: '印记商店', icon: Coins },
];

export function NavBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      setUser(data.user);
      if (data.user) {
        supabase.from('profiles').select('is_member,member_expires_at').eq('id', data.user.id).single()
          .then(({ data: p }: { data: { is_member: boolean; member_expires_at: string | null } | null }) => {
            setIsMember(!!(p?.is_member && p.member_expires_at && new Date(p.member_expires_at) > new Date()));
          });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        if (!session?.user) setIsMember(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg" style={{ marginLeft: '-166px' }}>
          <span className="text-xl">🌀</span>
          <span>人生副本</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button
                variant={pathname === href ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-1.5"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2" style={{ marginRight: '-150px' }}>
          {user ? (
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <UserCircle className="h-4 w-4" />
                我的账户
                {isMember && (
                  <Badge className="ml-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-1.5 py-0 border-0">
                    会员
                    </Badge>
                )}
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="sm">登录</Button>
            </Link>
          )}
        </div>

        {/* Mobile nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="md:hidden" render={<Button variant="ghost" size="icon" />}>
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <div className="flex flex-col gap-2 mt-8">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)}>
                  <Button
                    variant={pathname === href ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                </Link>
              ))}
              <div className="border-t my-2" />
              {user ? (
                <Link href="/profile" onClick={() => setOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <UserCircle className="h-4 w-4" />
                    我的账户
                    {isMember && (
                      <Badge className="ml-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-1.5 py-0 border-0">
                        会员
                      </Badge>
                    )}
                  </Button>
                </Link>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)}>
                  <Button className="w-full">登录 / 注册</Button>
                </Link>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
