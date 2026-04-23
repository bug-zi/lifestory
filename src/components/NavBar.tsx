'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen, Compass, Sparkles, Menu, UserCircle, Clock, Trophy, LogOut,
  Sun, Moon, ScrollText, Library, Coins, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/components/auth-provider';

const coreNavItems = [
  { href: '/', label: '首页', icon: Compass },
  { href: '/scripts/daily', label: '每日副本', icon: BookOpen },
  { href: '/diy', label: 'DIY人生', icon: Sparkles },
  { href: '/hall-of-fame', label: '名人堂', icon: Trophy },
];

const moreNavItems = [
  { href: '/library', label: '人生库', icon: Library },
  { href: '/read-later', label: '稍后再读', icon: Clock },
  { href: '/tokens', label: '印记商店', icon: Coins },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { user, loading: authLoading } = useAuthContext();
  const [isMember, setIsMember] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsMember(false);
    router.push('/');
  };

  useEffect(() => {
    if (!user) {
      setIsMember(false);
      return;
    }
    const supabase = createClient();
    supabase.from('profiles').select('is_member,member_expires_at').eq('id', user.id).single()
      .then(({ data: p }: { data: { is_member: boolean; member_expires_at: string | null } | null }) => {
        setIsMember(!!(p?.is_member && p.member_expires_at && new Date(p.member_expires_at) > new Date()));
      });
  }, [user]);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-md border-b border-border/60">
      <div className="mx-auto grid h-14 max-w-5xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight" style={{ fontFamily: 'var(--font-heading), serif' }}>
          <ScrollText className="h-5 w-5 text-accent" />
          <span>人生副本</span>
        </Link>

        {/* Desktop nav — core items only */}
        <nav className="hidden md:flex items-center justify-center gap-1">
          {coreNavItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="relative">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-1.5 ${isActive(href) ? 'text-accent font-medium' : ''}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
              {isActive(href) && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-accent" />
              )}
            </Link>
          ))}
        </nav>

        {/* Desktop right: theme + user */}
        <div className="hidden md:flex items-center justify-end gap-1">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="sm" className="gap-1.5" />}
              >
                <UserCircle className="h-4 w-4" />
                <span className="max-w-[80px] truncate">我的</span>
                {isMember && (
                  <Badge className="ml-0.5 bg-accent text-accent-foreground text-[10px] px-1.5 py-0 border-0">
                    会员
                  </Badge>
                )}
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {moreNavItems.map(({ href, label, icon: Icon }) => (
                  <DropdownMenuItem
                    key={href}
                    className="cursor-pointer"
                    onClick={() => router.push(href)}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push('/profile')}
                >
                  <UserCircle className="h-4 w-4" />
                  账户设置
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                登录
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="md:hidden" render={<Button variant="ghost" size="icon" />}>
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <div className="flex flex-col gap-1 mt-8">
              {coreNavItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)}>
                  <Button
                    variant={isActive(href) ? 'secondary' : 'ghost'}
                    className={`w-full justify-start gap-2 ${isActive(href) ? 'text-accent' : ''}`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                </Link>
              ))}
              <div className="border-t my-2" />
              {moreNavItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)}>
                  <Button
                    variant={isActive(href) ? 'secondary' : 'ghost'}
                    className={`w-full justify-start gap-2 ${isActive(href) ? 'text-accent' : ''}`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                </Link>
              ))}
              <div className="border-t my-2" />
              {mounted && (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                >
                  {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {resolvedTheme === 'dark' ? '浅色模式' : '深色模式'}
                </Button>
              )}
              {user ? (
                <>
                  <Link href="/profile" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <UserCircle className="h-4 w-4" />
                      账户设置
                      {isMember && (
                        <Badge className="ml-auto bg-accent text-accent-foreground text-[10px] px-1.5 py-0 border-0">
                          会员
                        </Badge>
                      )}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-muted-foreground"
                    onClick={() => { setOpen(false); handleLogout(); }}
                  >
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </Button>
                </>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)}>
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    登录 / 注册
                  </Button>
                </Link>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
