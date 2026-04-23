'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Search, Trophy, MapPin, Clock, Tag, Sparkles, Loader2, LogIn, BookOpen, CheckCircle2,
  Landmark, Swords, FlaskConical, Palette, PenTool, Brain, Briefcase, GraduationCap, Hand,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '@/components/auth-provider';

interface Person {
  id: number;
  name: string;
  birth_year: number | null;
  death_year: number | null;
  summary: string;
  category: string;
  era: string;
  country: string | null;
  intro: string | null;
}

interface Exploration {
  person_id: number;
  explored: boolean;
  script_id: string | null;
}

const categories = [
  { value: 'all', label: '全部' },
  { value: '政治', label: '政治' },
  { value: '军事', label: '军事' },
  { value: '科学', label: '科学' },
  { value: '艺术', label: '艺术' },
  { value: '文学', label: '文学' },
  { value: '哲学', label: '哲学' },
  { value: '商业', label: '商业' },
  { value: '体育', label: '体育' },
  { value: '教育', label: '教育' },
  { value: '宗教', label: '宗教' },
];

const eras = [
  { value: 'all', label: '全部' },
  { value: '古代', label: '古代' },
  { value: '近代', label: '近代' },
  { value: '现代', label: '现代' },
];

const regions = [
  { value: 'all', label: '全部' },
  { value: '国内', label: '国内' },
  { value: '国外', label: '国外' },
];

const categoryGradients: Record<string, string> = {
  '政治': 'from-blue-500/10 to-indigo-500/5',
  '军事': 'from-red-500/10 to-orange-500/5',
  '科学': 'from-emerald-500/10 to-teal-500/5',
  '艺术': 'from-purple-500/10 to-pink-500/5',
  '文学': 'from-amber-500/10 to-yellow-500/5',
  '哲学': 'from-violet-500/10 to-purple-500/5',
  '商业': 'from-cyan-500/10 to-sky-500/5',
  '体育': 'from-green-500/10 to-lime-500/5',
  '教育': 'from-rose-500/10 to-pink-500/5',
  '宗教': 'from-slate-500/10 to-gray-500/5',
};

const categoryIcons: Record<string, React.ReactNode> = {
  '政治': <Landmark className="h-6 w-6" />,
  '军事': <Swords className="h-6 w-6" />,
  '科学': <FlaskConical className="h-6 w-6" />,
  '艺术': <Palette className="h-6 w-6" />,
  '文学': <PenTool className="h-6 w-6" />,
  '哲学': <Brain className="h-6 w-6" />,
  '商业': <Briefcase className="h-6 w-6" />,
  '体育': <Trophy className="h-6 w-6" />,
  '教育': <GraduationCap className="h-6 w-6" />,
  '宗教': <Hand className="h-6 w-6" />,
};

export default function HallOfFamePage() {
  const { user: authUser, loading: authLoading } = useAuthContext();
  const [people, setPeople] = useState<Person[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const [explorations, setExplorations] = useState<Map<number, Exploration>>(new Map());
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [era, setEra] = useState('all');
  const [region, setRegion] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => { if (!authLoading) loadData(); }, [authLoading]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [dialogStep, setDialogStep] = useState<'intro' | 'generating' | 'done'>('intro');
  const [generatedScriptId, setGeneratedScriptId] = useState<string | null>(null);

  useEffect(() => { filterPeople(); }, [people, category, era, region, searchQuery]);

  async function loadData() {
    setLoading(true);
    try {
      setIsLoggedIn(!!authUser);

      const [peopleRes, exploreRes] = await Promise.all([
        fetch('/api/hall-of-fame'),
        fetch('/api/hall-of-fame/explore'),
      ]);

      const peopleData = await peopleRes.json();
      const exploreData = await exploreRes.json();

      setPeople(peopleData.items || []);

      const explMap = new Map<number, Exploration>();
      (exploreData.explorations || []).forEach((e: Exploration) => {
        explMap.set(e.person_id, e);
      });
      setExplorations(explMap);
    } catch {
      console.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }

  function filterPeople() {
    let filtered = [...people];
    if (category !== 'all') filtered = filtered.filter((p) => p.category === category);
    if (era !== 'all') filtered = filtered.filter((p) => p.era === era);
    if (region !== 'all') {
      filtered = filtered.filter((p) => {
        const isChinese = p.country === '中国' || p.country?.includes('中国');
        return region === '国内' ? isChinese : !isChinese;
      });
    }
    if (searchQuery.trim()) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredPeople(filtered);
  }

  function formatYear(year: number | null) {
    if (year === null) return '?';
    if (year < 0) return `公元前${Math.abs(year)}年`;
    return `${year}年`;
  }

  function formatLifeSpan(person: Person) {
    const birth = formatYear(person.birth_year);
    const death = person.death_year ? formatYear(person.death_year) : '至今';
    return `${birth} - ${death}`;
  }

  function openPersonDialog(person: Person) {
    setSelectedPerson(person);
    const exploration = explorations.get(person.id);
    if (exploration?.explored) {
      setDialogStep('done');
      setGeneratedScriptId(exploration.script_id);
    } else {
      setDialogStep('intro');
      setGeneratedScriptId(null);
    }
    setDialogOpen(true);
  }

  async function handleStartExploration() {
    if (!isLoggedIn) {
      toast.error('请先登录后再体验');
      return;
    }
    if (!selectedPerson) return;
    setDialogStep('generating');
    try {
      const res = await fetch(`/api/hall-of-fame/${selectedPerson.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.script) {
        setGeneratedScriptId(data.script.id);
        setDialogStep('done');
        setExplorations((prev) => {
          const next = new Map(prev);
          next.set(selectedPerson.id, { person_id: selectedPerson.id, explored: true, script_id: data.script.id });
          return next;
        });
        toast.success('人生副本生成成功！');
      } else {
        toast.error(data.error || '生成失败');
        setDialogStep('intro');
      }
    } catch {
      toast.error('生成失败');
      setDialogStep('intro');
    }
  }

  async function handleAddToReadLater() {
    if (!generatedScriptId) {
      toast.error('副本不存在');
      return;
    }
    try {
      const res = await fetch('/api/read-later', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_id: generatedScriptId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || '已添加到稍后再读');
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch {
      toast.error('网络错误，请重试');
    }
  }

  const dialogMaxWidth = dialogStep === 'generating' ? 'sm:max-w-sm' : 'sm:max-w-lg';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Hero */}
      <section className="flex flex-col items-center text-center py-12 md:py-16 relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(45,106,79,0.08),transparent)]" />
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-sm text-accent mb-4">
          <Trophy className="h-3.5 w-3.5" />
          <span>传奇人生殿堂</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-heading tracking-tight">名人堂</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-lg">
          古今中外，各领域杰出人物。选一个传奇人生，开始你的副本之旅。
        </p>
      </section>

      {/* Search + Filters */}
      <div className="sticky top-14 z-40 bg-background/80 backdrop-blur-sm -mx-4 px-4 pb-4 border-b mb-6">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索姓名或简介..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
            {categories.map((c) => (
              <Button key={c.value} variant={category === c.value ? 'default' : 'ghost'} size="sm" className="h-7 text-xs rounded-full" onClick={() => setCategory(c.value)}>
                {c.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            {eras.map((e) => (
              <Button key={e.value} variant={era === e.value ? 'default' : 'ghost'} size="sm" className="h-7 text-xs rounded-full" onClick={() => setEra(e.value)}>
                {e.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            {regions.map((r) => (
              <Button key={r.value} variant={region === r.value ? 'default' : 'ghost'} size="sm" className="h-7 text-xs rounded-full" onClick={() => setRegion(r.value)}>
                {r.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Count + Stats */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">显示 {filteredPeople.length} 位名人</p>
        <p className="text-sm text-muted-foreground">
          已探索 {Array.from(explorations.values()).filter((e) => e.explored).length}/{people.length}
        </p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="inline-block h-6 w-6 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">加载中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeople.map((person) => {
            const exploration = explorations.get(person.id);
            const isExplored = exploration?.explored === true;
            return (
              <div
                key={person.id}
                onClick={() => openPersonDialog(person)}
                className={`group rounded-xl border bg-gradient-to-br ${categoryGradients[person.category] || 'from-muted/50 to-transparent'} p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative ${isExplored ? 'ring-1 ring-emerald-200 dark:ring-emerald-800' : ''}`}
              >
                {isExplored && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px] border-0 gap-1 px-1.5 py-0">
                      <CheckCircle2 className="h-3 w-3" />
                      已探索
                    </Badge>
                  </div>
                )}
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-accent">{categoryIcons[person.category] || <span className="text-2xl">👤</span>}</span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg leading-tight">{person.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatLifeSpan(person)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="secondary" className="text-xs">{person.category}</Badge>
                  <Badge variant="outline" className="text-xs">{person.era}</Badge>
                  {person.country && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <MapPin className="h-3 w-3" />
                      {person.country}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {person.summary}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty */}
      {!loading && filteredPeople.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">没有找到匹配的名人</p>
        </div>
      )}

      {/* Person Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open: boolean) => setDialogOpen(open)}>
        <DialogContent className={`${dialogMaxWidth} max-h-[85vh] overflow-y-auto`}>
          {selectedPerson && (
            <>
              {/* === INTRO STEP (unexplored) === */}
              {dialogStep === 'intro' && (
                <div className="space-y-4">
                  <div>
                    <DialogTitle className="text-xl font-bold">{selectedPerson.name}</DialogTitle>
                    <DialogDescription className="mt-1">{formatLifeSpan(selectedPerson)} · {selectedPerson.category}</DialogDescription>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">{selectedPerson.category}</Badge>
                    <Badge variant="outline">{selectedPerson.era}</Badge>
                    {selectedPerson.country && (
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedPerson.country}
                      </Badge>
                    )}
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed text-muted-foreground">
                    {selectedPerson.intro || selectedPerson.summary}
                  </div>
                  <div className="flex justify-end pt-2">
                    {isLoggedIn ? (
                      <Button onClick={handleStartExploration} className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        生成人生副本
                      </Button>
                    ) : (
                      <Link href="/login">
                        <Button className="gap-2">
                          <LogIn className="h-4 w-4" />
                          登录后体验
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* === GENERATING STEP === */}
              {dialogStep === 'generating' && (
                <div className="py-12 text-center">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                  <DialogTitle className="text-xl font-bold mb-2">AI正在为你编织人生...</DialogTitle>
                  <DialogDescription>「{selectedPerson.name}」的一生正在生成中，请稍候</DialogDescription>
                </div>
              )}

              {/* === DONE STEP === */}
              {dialogStep === 'done' && (
                <div className="space-y-4">
                  <div>
                    <DialogTitle className="text-xl font-bold">{selectedPerson.name}</DialogTitle>
                    <DialogDescription className="mt-1">{formatLifeSpan(selectedPerson)} · {selectedPerson.category}</DialogDescription>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed text-muted-foreground max-h-[30vh] overflow-y-auto">
                    {selectedPerson.intro || selectedPerson.summary}
                  </div>
                  {generatedScriptId ? (
                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>人生副本已生成</span>
                      </div>
                      <Link href={`/scripts/${generatedScriptId}`} onClick={() => setDialogOpen(false)}>
                        <Button className="w-full gap-2">
                          <BookOpen className="h-4 w-4" />
                          阅读人生副本
                        </Button>
                      </Link>
                      <Button variant="outline" className="w-full gap-2" onClick={handleAddToReadLater}>
                        <Clock className="h-4 w-4" />
                        稍后再读
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">副本数据加载中...</p>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
