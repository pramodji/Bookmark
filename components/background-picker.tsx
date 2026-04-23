"use client";

import { useState } from "react";
import { ImageIcon, XIcon } from "lucide-react";

interface BackgroundPickerProps {
  bgImage: string;
  bgOpacity: number;
  bgBlur?: number;
  onChangeBg: (url: string) => void;
  onChangeOpacity: (opacity: number) => void;
  onChangeBlur?: (blur: number) => void;
  existingBackgrounds?: { label: string; url: string }[];
}

export function BackgroundPicker({ bgImage, bgOpacity, bgBlur = 0, onChangeBg, onChangeOpacity, onChangeBlur, existingBackgrounds = [] }: BackgroundPickerProps) {
  const [open, setOpen] = useState(false);
  const existing = existingBackgrounds.filter(b => b.url && b.url !== bgImage);

  return (
    <>
      <button onClick={() => setOpen(p => !p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary text-xs transition-all">
        <ImageIcon className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-6 top-full mt-1 bg-white dark:bg-slate-900 shadow-2xl rounded-lg border p-3 w-72 z-50 space-y-2" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Background</span>
            <button onClick={() => setOpen(false)}><XIcon className="w-3.5 h-3.5 text-slate-400" /></button>
          </div>
          {existing.length > 0 && (
            <div>
              <span className="text-[10px] text-slate-500 font-medium">Use existing</span>
              <div className="flex gap-1.5 mt-1 overflow-x-auto">
                {existing.map(b => (
                  <button key={b.label} onClick={() => onChangeBg(b.url)}
                    className="shrink-0 w-14 h-10 rounded border overflow-hidden hover:ring-2 ring-primary transition-all"
                    title={b.label}>
                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${b.url})` }} />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-1.5">
            <input id="bg-picker-url" defaultValue={bgImage} placeholder="Paste image URL..." className="flex-1 text-xs border rounded px-2 py-1.5 bg-white dark:bg-slate-800 min-w-0 outline-none" />
            <label className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 rounded cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center shrink-0 text-xs">
              📁
              <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => onChangeBg(ev.target?.result as string); r.readAsDataURL(f); } }} />
            </label>
            <button className="px-2 py-1.5 bg-primary text-primary-foreground rounded text-xs" onClick={() => { const val = (document.getElementById('bg-picker-url') as HTMLInputElement)?.value.trim(); onChangeBg(val); }}>Set</button>
          </div>
          <div>
            <label className="text-[10px] text-slate-500">Opacity: {Math.round(bgOpacity * 100)}%</label>
            <input type="range" min="0.05" max="1" step="0.05" value={bgOpacity} onChange={e => onChangeOpacity(parseFloat(e.target.value))} className="w-full" />
          </div>
          {onChangeBlur && (
            <div>
              <label className="text-[10px] text-slate-500">Blur: {bgBlur}px</label>
              <input type="range" min="0" max="20" step="1" value={bgBlur} onChange={e => onChangeBlur(parseInt(e.target.value))} className="w-full" />
            </div>
          )}
          {bgImage && <button onClick={() => onChangeBg('')} className="text-[10px] text-red-400 hover:text-red-600">Remove background</button>}
        </div>
      )}
    </>
  );
}

export function BackgroundImage({ url, opacity, blur = 0 }: { url: string; opacity: number; blur?: number }) {
  if (!url) return null;
  return <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${url})`, opacity, filter: blur > 0 ? `blur(${blur}px)` : undefined }} />;
}
