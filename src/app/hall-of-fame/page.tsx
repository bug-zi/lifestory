'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Trophy } from 'lucide-react';

interface Person {
  id: number;
  name: string;
  birth_year: number | null;
  death_year: number | null;
  summary: string;
  category: string;
  era: string;
  country: string | null;
}

const categories = [
  { value: 'all', label: '全部领域' },
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
  { value: 'all', label: '全部时代' },
  { value: '古代', label: '古代' },
  { value: '近代', label: '近代' },
  { value: '现代', label: '现代' },
];

export default function HallOfFamePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [era, setEra] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPeople();
  }, []);

  useEffect(() => {
    filterPeople();
  }, [people, category, era, searchQuery]);

  async function fetchPeople() {
    try {
      const res = await fetch('/api/hall-of-fame');
      const data = await res.json();
      setPeople(data.items || []);
    } catch {
      console.error('获取名人数据失败');
    } finally {
      setLoading(false);
    }
  }

  function filterPeople() {
    let filtered = [...people];

    if (category !== 'all') {
      filtered = filtered.filter((p) => p.category === category);
    }

    if (era !== 'all') {
      filtered = filtered.filter((p) => p.era === era);
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
    const death = person.death_year
      ? formatYear(person.death_year)
      : '至今';
    return `${birth} - ${death}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 justify-center mb-4">
            <Trophy className="h-12 w-12" />
            <h1 className="text-4xl font-bold">名人堂</h1>
          </div>
          <p className="text-center text-amber-100 text-lg">
            古今中外，各领域杰出人物，一千个传奇人生
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 筛选器 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索姓名或简介..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 领域筛选 */}
            <div className="md:w-48">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 时代筛选 */}
            <div className="md:w-48">
              <select
                value={era}
                onChange={(e) => setEra(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                {eras.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="mt-4 text-sm text-muted-foreground">
            显示 {filteredPeople.length} 位名人
          </div>
        </div>

        {/* 加载状态 */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            <p className="mt-4 text-muted-foreground">加载中...</p>
          </div>
        ) : (
          /* 人物列表 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPeople.map((person) => (
              <Card
                key={person.id}
                className="hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              >
                <CardContent className="p-6">
                  {/* 姓名 */}
                  <h3 className="text-xl font-bold mb-2 text-amber-900">
                    {person.name}
                  </h3>

                  {/* 年份 */}
                  <div className="text-sm text-muted-foreground mb-3">
                    {formatLifeSpan(person)}
                  </div>

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded">
                      {person.category}
                    </span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                      {person.era}
                    </span>
                    {person.country && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                        {person.country}
                      </span>
                    )}
                  </div>

                  {/* 简介 */}
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {person.summary}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 无结果 */}
        {!loading && filteredPeople.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              没有找到匹配的名人
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
