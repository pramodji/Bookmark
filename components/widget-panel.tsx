"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { AnimatedModal } from "@/components/animated-modal";
import { XIcon, MinusIcon, PlusIcon, ClockIcon, ListTodoIcon, FileTextIcon, TypeIcon, GripVerticalIcon, DollarSignIcon, TrendingUpIcon, RssIcon, CodeIcon, CloudIcon, TimerIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";

const WIDGET_TYPES = [
  { value: 'clock',     label: 'Clock',     icon: ClockIcon },
  { value: 'tasks',     label: 'Tasks',     icon: ListTodoIcon },
  { value: 'notes',     label: 'Notes',     icon: FileTextIcon },
  { value: 'custom',    label: 'Custom',    icon: TypeIcon },
  { value: 'currency',  label: 'Currency',  icon: DollarSignIcon },
  { value: 'stock',     label: 'Stock',     icon: TrendingUpIcon },
  { value: 'rss',       label: 'RSS Feed',  icon: RssIcon },
  { value: 'embed',     label: 'Embed',     icon: CodeIcon },
  { value: 'weather',   label: 'Weather',   icon: CloudIcon },
  { value: 'countdown', label: 'Countdown', icon: TimerIcon },
];

function FlipDigit({ val, bg, color, size = 1 }: { val: string; bg: string; color: string; size?: number }) {
  const [cur, setCur] = useState(val);
  const [next, setNext] = useState(val);
  const [flipping, setFlipping] = useState(false);
  const queue = useRef<string[]>([]);
  const busy = useRef(false);

  const runFlip = (to: string) => {
    busy.current = true;
    setNext(to);
    setFlipping(true);
    setTimeout(() => {
      setCur(to);
      setFlipping(false);
      busy.current = false;
      if (queue.current.length) runFlip(queue.current.shift()!);
    }, 280);
  };

  useEffect(() => {
    if (val === cur && !flipping) return;
    if (val === next) return;
    if (busy.current) { queue.current = [val]; return; }
    runFlip(val);
  }, [val]);

  const w = 44 * size, h = 60 * size, r = 6 * size;
  const fs = 40 * size;
  const lh = `${h}px`;
  const digitStyle = (clip: 'top' | 'bot'): React.CSSProperties => ({
    position: 'absolute', left: 0, right: 0, top: 0,
    textAlign: 'center', fontSize: fs, fontWeight: 900,
    fontFamily: 'monospace', color, lineHeight: lh,
    clipPath: clip === 'top' ? 'inset(0 0 50% 0)' : 'inset(50% 0 0 0)',
    textShadow: `0 0 ${8*size}px ${color}88`,
  });

  return (
    <div style={{ position:'relative', width:w, height:h, borderRadius:r, background:bg,
      boxShadow:`0 6px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)`,
      border:'1px solid rgba(255,255,255,0.07)' }}>
      <style>{`
        @keyframes fd-top{0%{transform:rotateX(0deg);box-shadow:none}100%{transform:rotateX(-90deg);box-shadow:0 6px 12px rgba(0,0,0,0.5)}}
        @keyframes fd-bot{0%{transform:rotateX(90deg)}60%{transform:rotateX(-8deg)}80%{transform:rotateX(4deg)}100%{transform:rotateX(0deg)}}
      `}</style>

      {/* Static bottom half showing next value */}
      <div style={{ position:'absolute', inset:0, borderRadius:r, background:bg }}>
        <span style={digitStyle('bot')}>{next}</span>
      </div>

      {/* Static top half showing current value */}
      <div style={{ position:'absolute', inset:0 }}>
        <span style={digitStyle('top')}>{cur}</span>
      </div>

      {/* Animated top flap */}
      {flipping && (
        <div style={{ position:'absolute', inset:0, transformOrigin:'50% 100%',
          animation:'fd-top 0.14s ease-in forwards',
          perspective: `${300*size}px`, borderRadius:`${r}px ${r}px 0 0`, overflow:'hidden',
          background: bg }}>
          <span style={digitStyle('top')}>{cur}</span>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.35))' }} />
        </div>
      )}

      {/* Animated bottom flap */}
      {flipping && (
        <div style={{ position:'absolute', inset:0, transformOrigin:'50% 0%',
          animation:'fd-bot 0.18s ease-out 0.14s forwards',
          transform:'rotateX(90deg)',
          perspective: `${300*size}px`, borderRadius:`0 0 ${r}px ${r}px`, overflow:'hidden',
          background: bg }}>
          <span style={digitStyle('bot')}>{next}</span>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, transparent 40%, rgba(0,0,0,0.25))' }} />
        </div>
      )}

      {/* Center fold line */}
      <div style={{ position:'absolute', left:0, right:0, top:'50%', height: 1*size,
        background:'rgba(0,0,0,0.5)', transform:'translateY(-50%)', zIndex:10 }} />
    </div>
  );
}

function TzRow({ tz, label, time, bg }: { tz: string; label: string; time: Date; bg: string }) {
  const fmt = (t: Date) => { try { return new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(t); } catch { return '--:--:--'; } };
  const [display, setDisplay] = useState(() => fmt(time));
  useEffect(() => { setDisplay(fmt(time)); }, [time, tz]);
  const isDark = parseInt(bg.slice(1,3), 16) < 128;
  return (
    <div className="flex items-center justify-between px-3 py-1 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
      <span className="text-[10px] font-semibold truncate max-w-[45%]" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }}>{label || tz.split('/').pop()?.replace('_',' ')}</span>
      <span className="text-sm font-bold tabular-nums" style={{ color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)', fontFamily: 'monospace' }}>{display}</span>
    </div>
  );
}

function ClockContent({ config, onConfigChange }: { config: any; onConfigChange: (c: any) => void }) {
  const tz = config.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const bg = config.bgColor || '#1e293b';
  const color = config.digitColor || '#fbbf24';
  const size = config.clockSize || 1;
  const extraZones: { tz: string; label: string }[] = config.extraZones || [{tz:'America/New_York',label:'ET'},{tz:'',label:''}];
  const [time, setTime] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);

  const getTimeParts = (timezone: string) => {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }).formatToParts(time);
    const g = (t: string) => p.find(x => x.type === t)?.value?.padStart(2, '0') ?? '00';
    const ampm = p.find(x => x.type === 'dayPeriod')?.value ?? '';
    return { h: g('hour'), m: g('minute'), s: g('second'), ampm };
  };

  const FlipCard = ({ val }: { val: string }) => (
    <div className="flex gap-1">
      {val.split('').map((d, i) => <FlipDigit key={i} val={d} bg={bg} color={color} size={size} />)}
    </div>
  );

  const ClockFace = ({ timezone, label }: { timezone: string; label: string }) => {
    const { h, m, s, ampm } = getTimeParts(timezone);
    const tzParts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' }).formatToParts(time);
    const tzAbbr = tzParts.find(x => x.type === 'timeZoneName')?.value ?? '';
    const dateStr = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short', month: 'short', day: 'numeric' }).format(time);
    const displayLabel = label || TZ_LIST.find(t => t.value === timezone)?.label.split(' – ')[0] || timezone.split('/').pop()?.replace('_',' ');
    return (
      <div className="flex flex-col items-center gap-1 w-full">
        <div className="flex items-center justify-center w-full">
          <div style={{width: `${50*size}px`}} className="shrink-0" />
          <div className="flex items-center gap-1.5">
            <FlipCard val={h} />
            <span className="font-bold text-slate-400" style={{fontSize: `${24*size}px`}}>:</span>
            <FlipCard val={m} />
            <span className="font-bold text-slate-400" style={{fontSize: `${24*size}px`}}>:</span>
            <FlipCard val={s} />
          </div>
          <div className="flex flex-col justify-center shrink-0" style={{width: `${50*size}px`, marginLeft: `${6*size}px`, gap: `${2*size}px`}}>
            <span className="font-bold leading-none" style={{fontSize: `${22*size}px`, color}}>{ampm}</span>
            <span className="font-semibold leading-none" style={{fontSize: `${18*size}px`, color: 'rgba(148,163,184,0.9)'}}>{tzAbbr}</span>
          </div>
        </div>
        <div style={{fontSize: `${19*size}px`, color: 'rgba(148,163,184,0.8)'}}>{dateStr} · {displayLabel}</div>
      </div>
    );
  };

  const activeExtras = extraZones.filter(z => z.tz);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 select-none w-full">
      <ClockFace timezone={tz} label={config.timezoneLabel || ''} />
      {activeExtras.map((z, i) => (
        <div key={i} className="w-full">
          <ClockFace timezone={z.tz} label={z.label} />
        </div>
      ))}
    </div>
  );
}

function TasksContent({ tasks, showAll }: { tasks: any[]; showAll: boolean }) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const items = showAll ? tasks.filter(t => !t.completed) : tasks.filter(t => !t.completed && t.dueDate === today);
  if (!items.length) return <p className="text-xs text-slate-400 text-center mt-4">{showAll ? 'No open tasks' : 'No tasks due today 🎉'}</p>;
  return (
    <div className="space-y-1 overflow-y-auto h-full">
      {items.map(t => {
        const overdue = t.dueDate && t.dueDate < today;
        const dueToday = t.dueDate === today;
        return (
          <div key={t.id} className="flex items-center gap-2 text-xs px-1">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${overdue ? 'bg-red-500' : dueToday ? 'bg-amber-400' : 'bg-blue-400'}`} />
            <span className={`truncate ${overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>{t.title}</span>
            {overdue && <span className="text-[9px] text-red-500 shrink-0">overdue</span>}
            {t.priority === 'high' && <span className="text-[9px] text-red-400 shrink-0">!</span>}
          </div>
        );
      })}
    </div>
  );
}

function NotesContent({ notes, showAll }: { notes: any[]; showAll: boolean }) {
  const today = new Date().toISOString().split('T')[0];
  const items = showAll ? [...notes].sort((a, b) => (b.date || '').localeCompare(a.date || '')) : notes.filter(n => n.date === today);
  if (!items.length) return <p className="text-xs text-slate-400 text-center mt-4">{showAll ? 'No notes' : 'No notes for today'}</p>;
  return (
    <div className="space-y-1.5 overflow-y-auto h-full">
      {items.map(n => (
        <div key={n.id} className="text-xs px-1 border-l-2 border-primary/40 pl-2">
          {showAll && n.date && <div className="text-[10px] text-slate-400">{n.date}</div>}
          <div className="font-medium text-slate-700 dark:text-slate-300 truncate">{n.title || 'Untitled'}</div>
        </div>
      ))}
    </div>
  );
}

function CustomContent({ content }: { content: string }) {
  return (
    <div className="prose dark:prose-invert max-w-none text-xs overflow-y-auto h-full">
      <ReactMarkdown>{content || '*No content — right-click to edit*'}</ReactMarkdown>
    </div>
  );
}

const TZ_LIST = [
  { label: '— None —', value: '' },
  { label: 'UTC', value: 'UTC' },
  { label: 'ET – New York', value: 'America/New_York' },
  { label: 'CT – Chicago', value: 'America/Chicago' },
  { label: 'MT – Denver', value: 'America/Denver' },
  { label: 'PT – Los Angeles', value: 'America/Los_Angeles' },
  { label: 'AK – Anchorage', value: 'America/Anchorage' },
  { label: 'HI – Honolulu', value: 'Pacific/Honolulu' },
  { label: 'AT – Halifax', value: 'America/Halifax' },
  { label: 'BRT – São Paulo', value: 'America/Sao_Paulo' },
  { label: 'ART – Buenos Aires', value: 'America/Argentina/Buenos_Aires' },
  { label: 'GMT – London', value: 'Europe/London' },
  { label: 'CET – Paris', value: 'Europe/Paris' },
  { label: 'EET – Helsinki', value: 'Europe/Helsinki' },
  { label: 'MSK – Moscow', value: 'Europe/Moscow' },
  { label: 'GST – Dubai', value: 'Asia/Dubai' },
  { label: 'PKT – Karachi', value: 'Asia/Karachi' },
  { label: 'IST – Kolkata', value: 'Asia/Kolkata' },
  { label: 'BST – Dhaka', value: 'Asia/Dhaka' },
  { label: 'ICT – Bangkok', value: 'Asia/Bangkok' },
  { label: 'CST – Shanghai', value: 'Asia/Shanghai' },
  { label: 'JST – Tokyo', value: 'Asia/Tokyo' },
  { label: 'AEST – Sydney', value: 'Australia/Sydney' },
  { label: 'NZST – Auckland', value: 'Pacific/Auckland' },
];

const CURRENCIES = ['USD','EUR','GBP','JPY','CAD','AUD','CHF','CNY','INR','MXN','BRL','KRW','SGD','HKD','NOK','SEK','DKK','NZD','ZAR','RUB'];

function CurrencyContent({ config, onConfigChange }: { config: any; onConfigChange: (c: any) => void }) {
  const [amount, setAmount] = useState(config.amount || '1');
  const [from, setFrom] = useState(config.from || 'USD');
  const [to, setTo] = useState(config.to || 'EUR');
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRate = useCallback(async (f: string, t: string) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${f}`);
      const data = await res.json();
      setRate(data.rates?.[t] ?? null);
    } catch { setError('Failed to fetch'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRate(from, to); }, [from, to]);
  useEffect(() => {
    const mins = config.refreshInterval;
    if (!mins || mins <= 0) return;
    const id = setInterval(() => fetchRate(from, to), mins * 60000);
    return () => clearInterval(id);
  }, [from, to, config.refreshInterval]);
  const result = rate !== null && !isNaN(parseFloat(amount)) ? (parseFloat(amount) * rate).toFixed(4) : null;

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex gap-1.5 items-center">
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-20 text-xs px-2 py-1 border rounded bg-transparent outline-none focus:ring-1 ring-primary" />
        <select value={from} onChange={e => { setFrom(e.target.value); onConfigChange({ ...config, from: e.target.value }); }} className="text-xs px-1 py-1 border rounded bg-white dark:bg-slate-800 outline-none">
          {CURRENCIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <span className="text-slate-400 text-xs">→</span>
        <select value={to} onChange={e => { setTo(e.target.value); onConfigChange({ ...config, to: e.target.value }); }} className="text-xs px-1 py-1 border rounded bg-white dark:bg-slate-800 outline-none">
          {CURRENCIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      {loading && <p className="text-xs text-slate-400">Loading…</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {result !== null && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{result}</div>
          <div className="text-[10px] text-slate-400 mt-1">1 {from} = {rate?.toFixed(6)} {to}</div>
          <button onClick={() => fetchRate(from, to)} className="mt-2 text-[10px] text-primary hover:underline">Refresh</button>
        </div>
      )}
    </div>
  );
}

function StockContent({ config, onConfigChange }: { config: any; onConfigChange: (c: any) => void }) {
  const [ticker, setTicker] = useState(config.ticker || '');
  const [input, setInput] = useState(config.ticker || '');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStock = useCallback(async (sym: string) => {
    if (!sym) return;
    setLoading(true); setError(''); setData(null);
    try {
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym.toUpperCase()}?interval=1d&range=5d`);
      const json = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (!meta) throw new Error('Not found');
      setData(meta);
    } catch { setError('Symbol not found'); }
    setLoading(false);
  }, []);

  useEffect(() => { if (ticker) fetchStock(ticker); }, [ticker]);
  useEffect(() => {
    const mins = config.refreshInterval;
    if (!mins || mins <= 0 || !ticker) return;
    const id = setInterval(() => fetchStock(ticker), mins * 60000);
    return () => clearInterval(id);
  }, [ticker, config.refreshInterval]);
  const change = data ? data.regularMarketPrice - data.chartPreviousClose : 0;
  const pct = data ? (change / data.chartPreviousClose * 100) : 0;
  const up = change >= 0;

  return (
    <div className="flex flex-col gap-2 h-full">
      <form onSubmit={e => { e.preventDefault(); setTicker(input); onConfigChange({ ...config, ticker: input }); }} className="flex gap-1">
        <input value={input} onChange={e => setInput(e.target.value.toUpperCase())} placeholder="AAPL, MSFT…" className="flex-1 text-xs px-2 py-1 border rounded bg-transparent outline-none focus:ring-1 ring-primary uppercase" />
        <button type="submit" className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">Go</button>
      </form>
      {loading && <p className="text-xs text-slate-400">Loading…</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {data && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-1">
          <div className="text-xs font-bold text-slate-500 uppercase">{data.symbol}</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">${data.regularMarketPrice?.toFixed(2)}</div>
          <div className={`text-xs font-semibold ${up ? 'text-green-500' : 'text-red-500'}`}>{up ? '▲' : '▼'} {Math.abs(change).toFixed(2)} ({Math.abs(pct).toFixed(2)}%)</div>
          <div className="text-[10px] text-slate-400">{data.exchangeName} · {data.currency}</div>
          <button onClick={() => fetchStock(ticker)} className="mt-1 text-[10px] text-primary hover:underline">Refresh</button>
        </div>
      )}
    </div>
  );
}

function RssContent({ config, onConfigChange }: { config: any; onConfigChange: (c: any) => void }) {
  const [url, setUrl] = useState(config.rssUrl || '');
  const [input, setInput] = useState(config.rssUrl || '');
  const [feed, setFeed] = useState<{ title: string; items: { title: string; link: string; pubDate: string; description?: string }[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [previewSize, setPreviewSize] = useState({ w: 1000, h: 600 });
  const [resizing, setResizing] = useState(false);

  const fetchFeed = useCallback(async (feedUrl: string) => {
    if (!feedUrl) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/rss?url=${encodeURIComponent(feedUrl)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFeed(data);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const newUrl = config.rssUrl || '';
    if (newUrl !== url) {
      setUrl(newUrl);
      setInput(newUrl);
    }
  }, [config.rssUrl, url]);

  useEffect(() => { if (url) fetchFeed(url); }, [url, fetchFeed]);
  useEffect(() => {
    const mins = config.refreshInterval;
    if (!mins || mins <= 0 || !url) return;
    const id = setInterval(() => fetchFeed(url), mins * 60000);
    return () => clearInterval(id);
  }, [url, config.refreshInterval]);

  return (
    <>
      <div className="flex flex-col gap-2 h-full rss-content" ref={(el) => { if (el) { (el as any).openPreview = () => feed?.items[0] && setPreviewItem(feed.items[0]); (el as any).refreshFeed = () => url && fetchFeed(url); } }}>
        {loading && <p className="text-xs text-slate-400">Loading…</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
        {feed && !loading && (
          <div className="overflow-y-auto flex-1 space-y-1">
            {feed.items.map((item, i) => (
              <div key={i} className="flex items-start gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 last:border-0" onClick={() => setPreviewItem(item)}>
                {(item as any).image && <img src={(item as any).image} className="w-12 h-8 object-cover rounded shrink-0" />}
                <div className="flex-1 min-w-0">
                  <a href={item.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-tight hover:text-primary block">{item.title}</a>
                  <div className="text-[10px] text-slate-400 mt-1">{new Date(item.pubDate).toLocaleDateString()} {new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {previewItem && (
        <AnimatedModal isOpen={!!previewItem} onClose={() => { if (!resizing) setPreviewItem(null); }} zClass="z-[9999]">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex overflow-hidden relative" style={{ width: previewSize.w, height: previewSize.h }} onClick={e => e.stopPropagation()}>
            <div className="w-80 bg-slate-50 dark:bg-slate-800 p-4 overflow-y-auto border-r">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm">{feed?.title || 'RSS Feed'}</h3>
                <button onClick={() => setPreviewItem(null)} className="text-slate-400 hover:text-slate-600">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2">
                {feed?.items.map((item, i) => (
                  <div key={i} className={`p-2 rounded cursor-pointer text-xs flex gap-2 ${previewItem === item ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`} onClick={() => setPreviewItem(item)}>
                    {(item as any).image && <img src={(item as any).image} className="w-12 h-8 object-cover rounded shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium line-clamp-2">{item.title}</div>
                      <div className="text-[10px] opacity-70 mt-1">{new Date(item.pubDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg mb-1">{previewItem.title}</h2>
                  <p className="text-xs text-slate-500">{new Date(previewItem.pubDate).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPreviewItem(feed?.items[Math.max(0, feed.items.indexOf(previewItem) - 1)])} className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded">Previous</button>
                  <button onClick={() => setPreviewItem(feed?.items[Math.min(feed.items.length - 1, feed.items.indexOf(previewItem) + 1)])} className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded">Next</button>
                  <a href={previewItem.link || '#'} target="_blank" rel="noreferrer" onClick={e => { e.stopPropagation(); e.preventDefault(); if (previewItem.link) window.open(previewItem.link, '_blank'); }} className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded">READ THE FULL ARTICLE</a>
                </div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                {(previewItem as any).image && <img src={(previewItem as any).image} className="w-full max-w-md mx-auto mb-4 rounded" />}
                {previewItem.description ? (
                  <div className="prose dark:prose-invert max-w-none text-sm [&_a]:text-primary [&_a]:underline" onClick={e => { const a = (e.target as HTMLElement).closest('a'); if (a) { e.preventDefault(); window.open(a.href, '_blank'); } }} dangerouslySetInnerHTML={{ __html: previewItem.description }} />
                ) : (
                  <p className="text-slate-500 text-sm">No preview available. Click &quot;READ THE FULL ARTICLE&quot; to view the complete content.</p>
                )}
              </div>
            </div>
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-slate-300 dark:bg-slate-600 opacity-50 hover:opacity-100 flex items-center justify-center"
              onMouseDown={e => {
                e.preventDefault();
                e.stopPropagation();
                setResizing(true);
                const startX = e.clientX, startY = e.clientY, startW = previewSize.w, startH = previewSize.h;
                const move = (ev: MouseEvent) => {
                  ev.preventDefault();
                  setPreviewSize({ w: Math.max(600, startW + ev.clientX - startX), h: Math.max(400, startH + ev.clientY - startY) });
                };
                const up = (ev: MouseEvent) => {
                  ev.preventDefault();
                  setResizing(false);
                  window.removeEventListener('mousemove', move);
                  window.removeEventListener('mouseup', up);
                };
                window.addEventListener('mousemove', move);
                window.addEventListener('mouseup', up);
              }}
            >
              <span className="text-[8px] text-slate-500">⟲</span>
            </div>
          </div>
        </AnimatedModal>
      )}
    </>
  );
}

function EmbedContent({ config, onConfigChange }: { config: any; onConfigChange: (c: any) => void }) {
  const [embed, setEmbed] = useState(config.embedUrl || '');
  const [input, setInput] = useState(config.embedUrl || '');
  const [editing, setEditing] = useState(false);

  const isCode = (v: string) => v.trimStart().startsWith('<');
  const srcdoc = isCode(embed) ? `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{overflow:hidden;}</style></head><body>${embed}</body></html>` : null;
  const commit = (val: string) => { setEmbed(val); onConfigChange({ ...config, embedUrl: val }); setEditing(false); };

  return (
    <div className="flex flex-col gap-1 h-full">
      {!embed ? (
        <form onSubmit={e => { e.preventDefault(); commit(input); }} className="flex flex-col gap-1">
          <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Paste a URL or HTML/script embed code…" className="flex-1 text-xs px-2 py-1 border rounded bg-transparent outline-none focus:ring-1 ring-primary resize-none min-h-[80px]" />
          <button type="submit" className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">Embed</button>
        </form>
      ) : (
        <>
          {editing && (
            <form onSubmit={e => { e.preventDefault(); commit(input); }} className="flex flex-col gap-1 shrink-0">
              <textarea autoFocus value={input} onChange={e => setInput(e.target.value)} className="text-[10px] px-2 py-1 border rounded bg-transparent outline-none resize-none min-h-[60px]" />
              <div className="flex gap-1">
                <button type="submit" className="flex-1 text-[10px] px-2 py-0.5 bg-primary text-primary-foreground rounded">Apply</button>
                <button type="button" onClick={() => setEditing(false)} className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">Cancel</button>
              </div>
            </form>
          )}
          <div className="flex-1 relative group">
            {srcdoc ? <iframe srcDoc={srcdoc} className="w-full h-full rounded" frameBorder={0} sandbox="allow-scripts allow-same-origin allow-forms" /> : <iframe src={embed} className="w-full h-full rounded" frameBorder={0} sandbox="allow-scripts allow-same-origin allow-forms" />}
            <button onClick={() => { setInput(embed); setEditing(true); }} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] px-1.5 py-0.5 bg-black/50 text-white rounded">✎</button>
          </div>
        </>
      )}
    </div>
  );
}

function WeatherContent({ config, onConfigChange }: { config: any; onConfigChange: (c: any) => void }) {
  const [city, setCity] = useState(config.city || '');
  const [input, setInput] = useState(config.city || '');
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWeather = useCallback(async (c: string) => {
    if (!c) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`https://wttr.in/${encodeURIComponent(c)}?format=j1`);
      const data = await res.json();
      setWeather(data);
    } catch { setError('Failed to fetch'); }
    setLoading(false);
  }, []);

  useEffect(() => { if (city) fetchWeather(city); }, [city]);
  useEffect(() => {
    const mins = config.refreshInterval;
    if (!mins || mins <= 0 || !city) return;
    const id = setInterval(() => fetchWeather(city), mins * 60000);
    return () => clearInterval(id);
  }, [city, config.refreshInterval]);
  const cur = weather?.current_condition?.[0];
  const desc = cur?.weatherDesc?.[0]?.value || '';

  return (
    <div className="flex flex-col gap-2 h-full">
      <form onSubmit={e => { e.preventDefault(); setCity(input); onConfigChange({ ...config, city: input }); }} className="flex gap-1 shrink-0">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="City name…" className="flex-1 text-xs px-2 py-1 border rounded bg-transparent outline-none focus:ring-1 ring-primary" />
        <button type="submit" className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">Go</button>
      </form>
      {loading && <p className="text-xs text-slate-400">Loading…</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {cur && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-1">
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{cur.temp_C}°C</div>
          <div className="text-xs text-slate-500">{cur.temp_F}°F · {desc}</div>
          <div className="text-[10px] text-slate-400">Humidity {cur.humidity}% · Wind {cur.windspeedKmph} km/h</div>
          <div className="text-[10px] text-slate-400 font-medium">{city}</div>
          <button onClick={() => fetchWeather(city)} className="mt-1 text-[10px] text-primary hover:underline">Refresh</button>
        </div>
      )}
    </div>
  );
}

function CountdownContent({ config, onConfigChange }: { config: any; onConfigChange: (c: any) => void }) {
  const [target, setTarget] = useState(config.countdownTarget || '');
  const [label, setLabel] = useState(config.countdownLabel || 'Event');
  const [now, setNow] = useState(Date.now());

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const diff = target ? new Date(target).getTime() - now : null;
  const past = diff !== null && diff < 0;
  const abs = diff !== null ? Math.abs(diff) : 0;
  const days = Math.floor(abs / 86400000);
  const hrs = Math.floor((abs % 86400000) / 3600000);
  const mins = Math.floor((abs % 3600000) / 60000);
  const secs = Math.floor((abs % 60000) / 1000);

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex flex-col gap-1 shrink-0">
        <input value={label} onChange={e => { setLabel(e.target.value); onConfigChange({ ...config, countdownLabel: e.target.value }); }} placeholder="Event name" className="text-xs px-2 py-1 border rounded bg-transparent outline-none focus:ring-1 ring-primary" />
        <input type="datetime-local" value={target} onChange={e => { setTarget(e.target.value); onConfigChange({ ...config, countdownTarget: e.target.value }); }} className="text-xs px-2 py-1 border rounded bg-transparent outline-none focus:ring-1 ring-primary" />
      </div>
      {target && (
        <div className="flex-1 flex flex-col items-center justify-center gap-1">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{past ? 'Since' : 'Until'} {label}</div>
          <div className="flex gap-2 tabular-nums">
            {[{v:days,l:'d'},{v:hrs,l:'h'},{v:mins,l:'m'},{v:secs,l:'s'}].map(({v,l}) => (
              <div key={l} className="flex flex-col items-center">
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{String(v).padStart(2,'0')}</span>
                <span className="text-[9px] text-slate-400">{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {!target && <p className="text-xs text-slate-400 text-center mt-4">Set a target date above</p>}
    </div>
  );
}

const TzSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    className="flex-1 text-xs px-2 py-1 border rounded bg-white dark:bg-slate-800 outline-none">
    {TZ_LIST.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
  </select>
);

function ClockCtxConfig({ widgetConfig, saveConfig }: { widgetConfig: any; saveConfig: (c: any) => void }) {
  const extraZones: { tz: string; label: string }[] = widgetConfig.extraZones || [{tz:'America/New_York',label:'ET'},{tz:'',label:''}];
  const setExtra = (i: number, field: 'tz' | 'label', val: string) => {
    const updated = extraZones.map((z, idx) => idx === i ? { ...z, [field]: val } : z);
    saveConfig({ ...widgetConfig, extraZones: updated });
  };
  return (
    <div className="px-3 py-1.5 space-y-1.5">
      <div>
        <p className="text-[10px] text-slate-400 mb-1">Primary Clock</p>
        <TzSelect value={widgetConfig.timezone || ''} onChange={v => saveConfig({ ...widgetConfig, timezone: v })} />
      </div>
      {[0, 1].map(i => (
        <div key={i}>
          <p className="text-[10px] text-slate-400 mb-1">Extra Clock {i + 1}</p>
          <TzSelect value={extraZones[i]?.tz || ''} onChange={v => setExtra(i, 'tz', v)} />
        </div>
      ))}
      <div>
        <p className="text-[10px] text-slate-400 mb-1">Size: {widgetConfig.clockSize || 1}x</p>
        <input type="range" min="0.5" max="2" step="0.1" defaultValue={widgetConfig.clockSize || 1}
          onChange={e => saveConfig({ ...widgetConfig, clockSize: parseFloat(e.target.value) })}
          className="w-full" />
      </div>
      <div className="flex gap-3 items-center">
        <div>
          <p className="text-[10px] text-slate-400 mb-1">Card</p>
          <input type="color" defaultValue={widgetConfig.bgColor || '#1e293b'}
            onChange={e => saveConfig({ ...widgetConfig, bgColor: e.target.value })}
            className="w-8 h-6 rounded cursor-pointer border-0" />
        </div>
        <div>
          <p className="text-[10px] text-slate-400 mb-1">Digit</p>
          <input type="color" defaultValue={widgetConfig.digitColor || '#fbbf24'}
            onChange={e => saveConfig({ ...widgetConfig, digitColor: e.target.value })}
            className="w-8 h-6 rounded cursor-pointer border-0" />
        </div>
      </div>
    </div>
  );
}

function WidgetContent({ widget, tasks, notes, onUpdate }: { widget: any; tasks: any[]; notes: any[]; onUpdate: (d: any) => void }) {
  const cfg = widget.config || {};
  const saveConfig = (c: any) => onUpdate({ config: c });
  switch (widget.type) {
    case 'clock':    return <ClockContent config={cfg} onConfigChange={saveConfig} />;
    case 'tasks':    return <TasksContent tasks={tasks} showAll={cfg.showAll} />;
    case 'notes':    return <NotesContent notes={notes} showAll={cfg.showAll} />;
    case 'custom':   return <CustomContent content={cfg.content || ''} />;
    case 'currency': return <CurrencyContent config={cfg} onConfigChange={saveConfig} />;
    case 'stock':    return <StockContent config={cfg} onConfigChange={saveConfig} />;
    case 'rss':      return <RssContent config={cfg} onConfigChange={saveConfig} />;
    case 'embed':    return <EmbedContent config={cfg} onConfigChange={saveConfig} />;
    case 'weather':  return <WeatherContent config={cfg} onConfigChange={saveConfig} />;
    case 'countdown':return <CountdownContent config={cfg} onConfigChange={saveConfig} />;
    default:         return <p className="text-xs text-slate-400 text-center mt-4">Unknown widget type</p>;
  }
}

function WidgetContextMenu({ widget, tasks, notes, onUpdate, onDelete, onClose, pos, totalColumns, allDockedWidgets, groups, groupColumns }: { widget: any; tasks: any[]; notes: any[]; onUpdate: (d: any) => void; onDelete: (id: string) => void; onClose: () => void; pos: { x: number; y: number }; totalColumns: number; allDockedWidgets: any[]; groups: string[]; groupColumns: Record<string, number> }) {
  const cfg = widget.config || {};
  const saveConfig = (c: any) => { onUpdate({ config: c }); };
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [noBorder, setNoBorder] = useState(!!widget.noBorder);
  useEffect(() => { setNoBorder(!!widget.noBorder); }, [widget.noBorder]);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('[data-ctx-menu]')) onClose(); };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div data-ctx-menu style={{ position: 'fixed', top: pos.y + 600 > window.innerHeight ? Math.max(0, pos.y - 600) : pos.y, left: Math.min(pos.x, window.innerWidth - 280), zIndex: 9999 }} className="bg-white dark:bg-slate-900 shadow-2xl rounded-lg border p-1 w-56" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Widget Settings</span>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
          <XIcon className="w-3 h-3 text-slate-400" />
        </button>
      </div>
      {widget.type === 'clock' && <ClockCtxConfig widgetConfig={cfg} saveConfig={saveConfig} />}
      {(widget.type === 'tasks' || widget.type === 'notes') && (
        <label className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-secondary rounded">
          <input type="checkbox" checked={!!cfg.showAll} onChange={e => saveConfig({ ...cfg, showAll: e.target.checked })} />
          Show all (not just today)
        </label>
      )}
      {['currency','stock','rss','weather'].includes(widget.type) && (
        <div className="px-3 py-1.5">
          <p className="text-[10px] text-slate-400 mb-1">Auto-refresh (minutes)</p>
          <select value={cfg.refreshInterval || 0} onChange={e => saveConfig({ ...cfg, refreshInterval: Number(e.target.value) })} className="w-full text-xs px-2 py-1 border rounded bg-white dark:bg-slate-800 outline-none">
            <option value={0}>Off</option>
            <option value={1}>1 min</option>
            <option value={5}>5 min</option>
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={60}>1 hour</option>
          </select>
        </div>
      )}
      {widget.type === 'custom' && (
        <div className="px-3 py-1.5">
          <p className="text-[10px] text-slate-400 mb-1">Content (Markdown)</p>
          <textarea defaultValue={cfg.content || ''} rows={4} className="w-full text-xs px-2 py-1 border rounded bg-transparent outline-none resize-none" onBlur={e => saveConfig({ ...cfg, content: e.target.value })} />
        </div>
      )}
      {widget.type === 'rss' && (
        <>
          <div className="px-3 py-1.5">
            <p className="text-[10px] text-slate-400 mb-1">RSS URL</p>
            <input defaultValue={cfg.rssUrl || ''} placeholder="https://example.com/feed.xml" className="w-full text-xs px-2 py-1 border rounded bg-transparent outline-none" onBlur={async e => {
              const url = e.target.value.trim();
              saveConfig({ ...cfg, rssUrl: url });
              if (url) {
                try {
                  const res = await fetch(`/api/rss?url=${encodeURIComponent(url)}`);
                  const data = await res.json();
                  if (data.title && titleInputRef.current) {
                    const shortTitle = data.title.substring(0, 10);
                    titleInputRef.current.value = shortTitle;
                  }
                } catch {}
              }
            }} />
          </div>
          <div className="px-3 py-1.5">
            <p className="text-[10px] text-slate-400 mb-1">Background Color</p>
            <input type="color" defaultValue={cfg.bgColor || '#ffffff'} onChange={e => saveConfig({ ...cfg, bgColor: e.target.value })} className="w-full h-8 rounded cursor-pointer border mb-2" />
            <div className="flex gap-1 flex-wrap">
              {['#ffffff', '#f1f5f9', '#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#e9d5ff', '#fed7aa'].map(color => (
                <button key={color} onClick={() => saveConfig({ ...cfg, bgColor: color })} className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform" style={{ backgroundColor: color, borderColor: cfg.bgColor === color ? '#000' : '#ccc' }} />
              ))}
            </div>
          </div>
        </>
      )}
      {widget.type === 'rss' && widget.config?.rssUrl && (
        <button onClick={() => { const content = document.querySelector(`[data-widget-id="${widget.id}"] .rss-content`); if (content) (content as any).refreshFeed?.(); onClose(); }} className="w-full text-left px-3 py-2 hover:bg-secondary rounded text-xs">
          🔄 Refresh Feed
        </button>
      )}
      <div className="border-t my-1" />
      <div className="px-3 py-1.5">
        <p className="text-[10px] text-slate-400 mb-1">Title</p>
        <input ref={titleInputRef} defaultValue={widget.title || ''} className="w-full text-[11px] px-2 py-1 border rounded bg-transparent outline-none" onBlur={e => onUpdate({ title: e.target.value })} />
      </div>
      <label className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-secondary rounded">
        <input type="checkbox" checked={!widget.hideTitle} onChange={e => onUpdate({ hideTitle: !e.target.checked })} />
        Show title
      </label>
      <label className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-secondary rounded">
        <input type="checkbox" checked={!noBorder} onChange={e => { setNoBorder(!e.target.checked); onUpdate({ noBorder: !e.target.checked }); }} />
        Show border
      </label>
      <div className="px-3 py-1.5">
        <p className="text-[10px] text-slate-400 mb-1">Opacity: {Math.round((widget.opacity ?? 1) * 100)}%</p>
        <input type="range" min="0" max="1" step="0.05" defaultValue={widget.opacity ?? 1} onChange={e => onUpdate({ opacity: parseFloat(e.target.value) })} className="w-full" />
      </div>
      <div className="border-t my-1" />
      {widget.floating ? (
        <div className="relative group">
          <button className="w-full text-left px-3 py-2 hover:bg-secondary rounded text-xs flex items-center gap-2">
            📌 Dock widget
            <span className="ml-auto">▶</span>
          </button>
          <div className="absolute left-full top-0 ml-1 bg-white dark:bg-slate-900 shadow-2xl rounded-lg border p-1 w-32 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
            {Array.from({ length: totalColumns }, (_, i) => (
              <button key={i} onClick={() => { onUpdate({ floating: false, column: i, row: 0 }); onClose(); }} className="w-full text-left px-2 py-1 hover:bg-secondary rounded text-xs">
                Column {i + 1}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button onClick={() => { onUpdate({ floating: true }); onClose(); }} className="w-full text-left px-3 py-2 hover:bg-secondary rounded text-xs">
          🪟 Undock (float)
        </button>
      )}
      {!widget.floating && (
        <>
          <div className="px-3 py-1.5">
            <p className="text-[10px] text-slate-400 mb-1">Column</p>
            <div className="flex gap-1">
              {Array.from({ length: totalColumns }, (_, i) => (
                <button key={i} onClick={() => onUpdate({ column: i })} className={`flex-1 py-1 text-xs rounded border ${(widget.column ?? 0) === i ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-secondary border-slate-200'}`}>{i + 1}</button>
              ))}
            </div>
          </div>
          <div className="px-3 py-1.5">
            <p className="text-xs text-slate-400 mb-1">Position</p>
            {(() => {
              const col = widget.column ?? 0;
              const colGroups = groups.filter(g => (groupColumns[g] ?? 0) === col);
              return (
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => onUpdate({ row: 0 })} className={`text-left px-2 py-1 text-xs rounded hover:bg-secondary ${(widget.row ?? 0) < 500 ? 'bg-secondary font-medium' : ''}`}>⬆ Top (before groups)</button>
                  {colGroups.map((g, i) => (
                    <button key={g} onClick={() => onUpdate({ row: 500 + i * 100 + 50 })} className={`text-left px-2 py-1 text-xs rounded hover:bg-secondary ${Math.abs((widget.row ?? 0) - (500 + i * 100 + 50)) < 50 ? 'bg-secondary font-medium' : ''}`}>↓ After &quot;{g}&quot;</button>
                  ))}
                </div>
              );
            })()}
          </div>
          <div className="px-3 py-1.5">
            <p className="text-[10px] text-slate-400 mb-1">Height</p>
            <div className="flex items-center gap-2">
              <button onClick={() => onUpdate({ height: Math.max(100, (widget.height ?? 200) - 50) })} className="px-2 py-1 text-xs border rounded hover:bg-secondary">−</button>
              <span className="text-xs flex-1 text-center">{widget.height ?? 200}px</span>
              <button onClick={() => onUpdate({ height: (widget.height ?? 200) + 50 })} className="px-2 py-1 text-xs border rounded hover:bg-secondary">+</button>
            </div>
          </div>
        </>
      )}
      <div className="border-t my-1" />
      <button onClick={() => { onDelete(widget.id); onClose(); }} className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-500 rounded text-xs">Delete Widget</button>
    </div>
  );
}

export function WidgetPanel({ widget, tasks, notes, onUpdate, onDelete, totalColumns = 4 }: { widget: any; tasks: any[]; notes: any[]; onUpdate: (d: any) => void; onDelete: (id: string) => void; totalColumns?: number }) {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: widget.x ?? 220, y: widget.y ?? 100 });
  const [size, setSize] = useState({ w: widget.width ?? 300, h: widget.height ?? 200 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button,input,select,textarea,a')) return;
    e.preventDefault();
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    const up = () => { setDragging(false); onUpdate({ x: pos.x, y: pos.y }); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [dragging, pos]);

  const typeInfo = WIDGET_TYPES.find(t => t.value === widget.type);
  const Icon = typeInfo?.icon ?? ClockIcon;

  return (
    <div
      ref={ref}
      className={`fixed z-50 bg-white dark:bg-slate-900 rounded-xl flex flex-col ${widget.noBorder ? '' : 'border border-slate-200 dark:border-slate-700 shadow-xl'}`}
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h, cursor: dragging ? 'grabbing' : 'default', backgroundColor: widget.type === 'rss' ? (widget.config?.bgColor || `rgba(255,255,255,${widget.opacity ?? 1})`) : `rgba(255,255,255,${widget.opacity ?? 1})` }}
      onClick={e => e.stopPropagation()}
      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setMenuPos({ x: e.clientX, y: e.clientY }); }}
    >
      {!widget.hideTitle && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 cursor-grab select-none shrink-0" onMouseDown={onMouseDown}>
          <Icon className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex-1 truncate">{widget.title || typeInfo?.label}</span>
          {widget.type === 'rss' && widget.config?.rssUrl && (
            <button onClick={(e) => { e.stopPropagation(); const content = document.querySelector(`[data-widget-id="${widget.id}"] .rss-content`); if (content) (content as any).openPreview?.(); }} className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded mr-1">
              <span className="text-xs">👁</span>
            </button>
          )}
          <button onClick={() => onDelete(widget.id)} className="p-0.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
            <XIcon className="w-3 h-3 text-slate-400 hover:text-red-500" />
          </button>
        </div>
      )}
      <div className="flex-1 p-2.5 overflow-hidden" onMouseDown={widget.hideTitle ? onMouseDown : undefined} data-widget-id={widget.id}>
        <WidgetContent widget={widget} tasks={tasks} notes={notes} onUpdate={onUpdate} />
      </div>
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={e => {
          e.stopPropagation();
          const startX = e.clientX, startY = e.clientY, startW = size.w, startH = size.h;
          const move = (ev: MouseEvent) => setSize({ w: Math.max(180, startW + ev.clientX - startX), h: Math.max(120, startH + ev.clientY - startY) });
          const up = (ev: MouseEvent) => { onUpdate({ width: Math.max(180, startW + ev.clientX - startX), height: Math.max(120, startH + ev.clientY - startY) }); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
          window.addEventListener('mousemove', move);
          window.addEventListener('mouseup', up);
        }}
      />
      {menuPos && <WidgetContextMenu widget={widget} tasks={tasks} notes={notes} onUpdate={onUpdate} onDelete={onDelete} onClose={() => setMenuPos(null)} pos={menuPos} totalColumns={totalColumns} allDockedWidgets={[]} groups={[]} groupColumns={{}} />}
    </div>
  );
}

export function DockedWidget({ widget, tasks, notes, onUpdate, onDelete, totalColumns, allWidgets, groups, groupColumns }: { widget: any; tasks: any[]; notes: any[]; onUpdate: (d: any) => void; onDelete: (id: string) => void; totalColumns: number; allWidgets: any[]; groups: string[]; groupColumns: Record<string, number> }) {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const typeInfo = WIDGET_TYPES.find(t => t.value === widget.type);
  const Icon = typeInfo?.icon ?? ClockIcon;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl flex flex-col overflow-hidden ${widget.noBorder ? '' : 'border border-slate-200 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)]'}`} style={{ height: widget.height ?? 200, backgroundColor: widget.type === 'rss' ? (widget.config?.bgColor || `rgba(255,255,255,${widget.opacity ?? 1})`) : `rgba(255,255,255,${widget.opacity ?? 1})` }} onClick={e => e.stopPropagation()} onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setMenuPos({ x: e.clientX, y: e.clientY }); }}>
      {!widget.hideTitle && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 select-none shrink-0">
          <Icon className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex-1 truncate">{widget.title || typeInfo?.label}</span>
          {widget.type === 'rss' && widget.config?.rssUrl && (
            <button onClick={(e) => { e.stopPropagation(); const content = document.querySelector(`[data-widget-id="${widget.id}"] .rss-content`); if (content) (content as any).openPreview?.(); }} className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded mr-1">
              <span className="text-xs">👁</span>
            </button>
          )}
          <button onClick={() => onDelete(widget.id)} className="p-0.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
            <XIcon className="w-3 h-3 text-slate-400 hover:text-red-500" />
          </button>
        </div>
      )}
      <div className="flex-1 p-2.5 overflow-hidden" data-widget-id={widget.id}>
        <WidgetContent widget={widget} tasks={tasks} notes={notes} onUpdate={onUpdate} />
      </div>
      {menuPos && <WidgetContextMenu widget={widget} tasks={tasks} notes={notes} onUpdate={onUpdate} onDelete={onDelete} onClose={() => setMenuPos(null)} pos={menuPos} totalColumns={totalColumns} allDockedWidgets={allWidgets} groups={groups} groupColumns={groupColumns} />}
    </div>
  );
}
