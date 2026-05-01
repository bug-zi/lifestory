'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  FONT_OPTIONS,
  DEFAULT_FONT_SETTINGS,
  getFontSettings,
  saveFontSettings,
  applyFontSettings,
  type FontSettings,
} from '@/lib/font-settings';

const PREVIEW_TEXT = '人生如逆旅，我亦是行人。在这浩瀚的世间，每个人都像是一叶扁舟，在命运的河流中随波逐流。然而，真正决定我们命运的，往往不是外在的风浪，而是内心那盏永不熄灭的灯火。';

export function FontSettingsPanel() {
  const [settings, setSettings] = useState<FontSettings>(DEFAULT_FONT_SETTINGS);
  const [saved, setSaved] = useState<FontSettings>(DEFAULT_FONT_SETTINGS);

  useEffect(() => {
    const current = getFontSettings();
    setSettings(current);
    setSaved(current);
  }, []);

  // Live preview — apply on every change
  useEffect(() => {
    applyFontSettings(settings);
  }, [settings]);

  function handleSave() {
    saveFontSettings(settings);
    setSaved(settings);
    toast.success('阅读字体设置已保存');
  }

  function handleReset() {
    setSettings(DEFAULT_FONT_SETTINGS);
    saveFontSettings(DEFAULT_FONT_SETTINGS);
    setSaved(DEFAULT_FONT_SETTINGS);
    toast.success('已恢复默认字体');
  }

  const currentFontCSS = FONT_OPTIONS.find((o) => o.value === settings.family)?.css || FONT_OPTIONS[0].css;
  const hasChanges = settings.family !== saved.family || settings.size !== saved.size || settings.weight !== saved.weight;

  return (
    <Card>
      <CardHeader>
        <CardTitle>文章字体设置</CardTitle>
        <CardDescription>自定义阅读文章时的字体、字号和字重</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Font Family Picker */}
        <div className="space-y-3">
          <label className="text-sm font-medium">字体</label>
          <div className="grid grid-cols-2 gap-2">
            {FONT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSettings((s) => ({ ...s, family: opt.value }))}
                className={`rounded-lg border-2 px-4 py-3 text-left transition-all ${
                  settings.family === opt.value
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <span
                  className="block text-base mb-1"
                  style={{ fontFamily: opt.css, fontWeight: settings.weight }}
                >
                  {opt.label}
                </span>
                <span className="text-xs text-muted-foreground">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Font Size Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">字号</label>
            <span className="text-sm text-muted-foreground tabular-nums">{settings.size}px</span>
          </div>
          <input
            type="range"
            min={14}
            max={22}
            step={1}
            value={settings.size}
            onChange={(e) => setSettings((s) => ({ ...s, size: Number(e.target.value) }))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>14px 小</span>
            <span>22px 大</span>
          </div>
        </div>

        <Separator />

        {/* Font Weight Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">字重</label>
            <span className="text-sm text-muted-foreground tabular-nums">{settings.weight}</span>
          </div>
          <input
            type="range"
            min={300}
            max={700}
            step={100}
            value={settings.weight}
            onChange={(e) => setSettings((s) => ({ ...s, weight: Number(e.target.value) }))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>300 细</span>
            <span>700 粗</span>
          </div>
        </div>

        <Separator />

        {/* Live Preview */}
        <div className="space-y-2">
          <label className="text-sm font-medium">预览效果</label>
          <div
            className="rounded-xl border bg-background/50 p-5"
          >
            <p
              className="leading-[1.8] tracking-wide whitespace-pre-wrap"
              style={{
                fontFamily: currentFontCSS,
                fontSize: `${settings.size}px`,
                fontWeight: settings.weight,
              }}
            >
              {PREVIEW_TEXT}
            </p>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={!hasChanges} className="gap-2">
            <Save className="h-4 w-4" />
            保存设置
          </Button>
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            恢复默认
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
