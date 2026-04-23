"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle, Color, FontSize } from "@tiptap/extension-text-style";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { XIcon, BoldIcon, ItalicIcon, ListIcon, ListOrderedIcon, HighlighterIcon, StrikethroughIcon, QuoteIcon, CodeIcon, MinusIcon, Undo2Icon, Redo2Icon, Heading1Icon, Heading2Icon, Heading3Icon, AlignJustifyIcon, PilcrowIcon, TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatedModal } from "@/components/animated-modal";

const FONT_SIZES = ['10px','12px','14px','16px','18px','20px','24px','28px','32px','36px','48px'];

const COLORS = ["#000000","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#64748b"];
const FONTS = ['system-ui','Inter','Roboto','Open Sans','Lato','Montserrat','Poppins','Arial','Georgia','Courier New','monospace'];

export function StickyEditor({ note, onSave, onClose, inline, onAutoSave, onUpdateFont }: { note: any; onSave: (html: string, title?: string) => void; onClose: () => void; inline?: boolean; onAutoSave?: (html: string) => void; onUpdateFont?: (font: string) => void }) {
  const [noteFont, setNoteFont] = useState(note.fontFamily || 'system-ui');
  const [autoSave, setAutoSave] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('noteAutoSave') !== 'false' : true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('noteCompact') === 'true' : false);
  const [showColors, setShowColors] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [title, setTitle] = useState(note.title || '');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [modalSize, setModalSize] = useState({ w: note.width ? Math.max(400, note.width + 100) : 520, h: note.height ? Math.max(300, note.height + 100) : 420 });
  const resizingRef = useRef(false);

  const getEditorClass = useCallback((isCompact: boolean) => {
    const spacing = isCompact ? 'leading-tight [&_p]:my-0.5 [&_h1]:my-1 [&_h2]:my-1 [&_h3]:my-1 [&_ul]:my-0.5 [&_ol]:my-0.5 [&_li]:my-0' : '[&_p]:my-2';
    const mode = inline
      ? 'min-h-[300px] prose prose-sm text-slate-800 dark:text-slate-100 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 shadow-[inset_0_3px_8px_rgba(0,0,0,0.14),inset_0_1px_3px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_3px_8px_rgba(0,0,0,0.55),inset_0_1px_3px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.04)] rounded-b-lg'
      : 'min-h-[200px] prose prose-sm shadow-[inset_0_3px_8px_rgba(0,0,0,0.14),inset_0_1px_3px_rgba(0,0,0,0.1)] bg-gradient-to-b from-yellow-50 to-yellow-100 dark:from-yellow-800 dark:to-yellow-900 text-yellow-900 dark:text-yellow-100';
    return `outline-none max-w-none p-4 ${spacing} ${mode}`;
  }, [inline]);

  const editor = useEditor({
    extensions: [StarterKit, Highlight, TextStyle, Color, FontSize,
      Table.configure({ resizable: true }), TableRow, TableCell, TableHeader],
    content: note.content || "",
    immediatelyRender: false,
    editorProps: {
      attributes: { class: getEditorClass(compact) },
    },
    onUpdate: ({ editor }) => {
      if (!editor.isActive('table')) setShowTableMenu(false);
      if (!autoSave || !onAutoSave) return;
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      setSaveStatus('saving');
      autoSaveTimer.current = setTimeout(() => {
        onAutoSave(editor.getHTML());
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 1500);
    },
  });

  useEffect(() => {
    if (editor) editor.setOptions({ editorProps: { attributes: { class: getEditorClass(compact) } } });
  }, [compact, editor, getEditorClass]);

  useEffect(() => () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); }, []);

  const btn = (active: boolean) =>
    `p-1.5 rounded transition-colors ${inline
      ? `hover:bg-slate-100 dark:hover:bg-slate-700 ${active ? 'bg-slate-200 dark:bg-slate-600 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`
      : `hover:bg-yellow-300 dark:hover:bg-yellow-600 ${active ? 'bg-yellow-300 dark:bg-yellow-600' : ''}`}`;

  const sep = <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-0.5" />;

  const toolbar = (
    <div className={`flex items-center gap-0.5 flex-wrap px-3 py-1.5 border-b ${inline ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50' : 'border-yellow-300 dark:border-yellow-600'}`}>
      {/* Paragraph + Font size */}
      <button onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().setParagraph().run(); }} className={btn((editor?.isActive('paragraph') && !editor?.isActive('heading')) ?? false)} title="Paragraph"><PilcrowIcon className="w-3.5 h-3.5" /></button>
      <select
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => { const v = e.target.value; if (v) (editor?.chain().focus() as any).setFontSize(v).run(); else (editor?.chain().focus() as any).unsetFontSize().run(); }}
        value={editor?.getAttributes('textStyle').fontSize || ''}
        className={`text-[11px] h-6 rounded border px-0.5 cursor-pointer ${
          inline ? 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200' : 'border-yellow-300 bg-yellow-50'
        }`}
        title="Font size"
      >
        <option value="">Size</option>
        {FONT_SIZES.map(s => <option key={s} value={s}>{s.replace('px','')}</option>)}
      </select>
      <select
        onChange={(e) => { setNoteFont(e.target.value); onUpdateFont?.(e.target.value); }}
        value={noteFont}
        className={`text-[11px] h-6 rounded border px-0.5 cursor-pointer ${
          inline ? 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200' : 'border-yellow-300 bg-yellow-50'
        }`}
        title="Font family"
      >
        {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
      </select>
      {sep}
      {/* Undo / Redo */}
      <button onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().undo().run(); }} className={btn(false)} title="Undo"><Undo2Icon className="w-3.5 h-3.5" /></button>
      <button onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().redo().run(); }} className={btn(false)} title="Redo"><Redo2Icon className="w-3.5 h-3.5" /></button>
      {sep}
      {/* Headings */}
      <button onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 1 }).run(); }} className={btn(editor?.isActive('heading', { level: 1 }) ?? false)} title="Heading 1"><Heading1Icon className="w-3.5 h-3.5" /></button>
      <button onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 2 }).run(); }} className={btn(editor?.isActive('heading', { level: 2 }) ?? false)} title="Heading 2"><Heading2Icon className="w-3.5 h-3.5" /></button>
      <button onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 3 }).run(); }} className={btn(editor?.isActive('heading', { level: 3 }) ?? false)} title="Heading 3"><Heading3Icon className="w-3.5 h-3.5" /></button>
      {sep}
      {/* Inline marks */}
      <button onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBold().run(); }} className={btn(editor?.isActive('bold') ?? false)} title="Bold"><BoldIcon className="w-3.5 h-3.5" /></button>
      <button onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleItalic().run(); }} className={btn(editor?.isActive('italic') ?? false)} title="Italic"><ItalicIcon className="w-3.5 h-3.5" /></button>
      <button onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleStrike().run(); }} className={btn(editor?.isActive('strike') ?? false)} title="Strikethrough"><StrikethroughIcon className="w-3.5 h-3.5" /></button>
      <button onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleHighlight().run(); }} className={btn(editor?.isActive('highlight') ?? false)} title="Highlight"><HighlighterIcon className="w-3.5 h-3.5" /></button>
      <button onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleCode().run(); }} className={btn(editor?.isActive('code') ?? false)} title="Inline code"><CodeIcon className="w-3.5 h-3.5" /></button>
      {sep}
      {/* Lists */}
      <button onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run(); }} className={btn(editor?.isActive('bulletList') ?? false)} title="Bullet list"><ListIcon className="w-3.5 h-3.5" /></button>
      <button onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleOrderedList().run(); }} className={btn(editor?.isActive('orderedList') ?? false)} title="Numbered list"><ListOrderedIcon className="w-3.5 h-3.5" /></button>
      <button onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBlockquote().run(); }} className={btn(editor?.isActive('blockquote') ?? false)} title="Blockquote"><QuoteIcon className="w-3.5 h-3.5" /></button>
      <button onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleCodeBlock().run(); }} className={btn(editor?.isActive('codeBlock') ?? false)} title="Code block"><span className="text-[10px] font-mono font-bold px-0.5">{"</>"}</span></button>
      {sep}
      {/* Table */}
      <div className="relative">
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            if (editor?.isActive('table')) { setShowTableMenu(v => !v); }
            else { editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); }
          }}
          className={btn(editor?.isActive('table') ?? false)} title={editor?.isActive('table') ? 'Table options' : 'Insert table'}
        ><TableIcon className="w-3.5 h-3.5" /></button>
        {showTableMenu && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl p-1 flex flex-col gap-0.5 text-[11px] min-w-[130px]">
            {([
              ['Add col before', () => editor?.chain().focus().addColumnBefore().run()],
              ['Add col after', () => editor?.chain().focus().addColumnAfter().run()],
              ['Delete col', () => editor?.chain().focus().deleteColumn().run()],
              ['Add row before', () => editor?.chain().focus().addRowBefore().run()],
              ['Add row after', () => editor?.chain().focus().addRowAfter().run()],
              ['Delete row', () => editor?.chain().focus().deleteRow().run()],
              ['Delete table', () => editor?.chain().focus().deleteTable().run()],
            ] as [string, () => void][]).map(([label, fn]) => (
              <button key={label} onMouseDown={(e) => { e.preventDefault(); fn(); setShowTableMenu(false); }}
                className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">{label}</button>
            ))}
          </div>
        )}
      </div>
      {sep}
      {/* HR + spacing */}
      <button onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().setHorizontalRule().run(); }} className={btn(false)} title="Horizontal rule"><MinusIcon className="w-3.5 h-3.5" /></button>
      <button
        onMouseDown={(e) => { e.preventDefault(); const next = !compact; setCompact(next); localStorage.setItem('noteCompact', String(next)); }}
        className={btn(compact)} title={compact ? 'Normal spacing' : 'Compact spacing'}
      >
        {compact ? <AlignJustifyIcon className="w-3.5 h-3.5" /> : <AlignJustifyIcon className="w-3.5 h-3.5 opacity-50" />}
      </button>
      {sep}
      {/* Text color */}
      <div className="relative">
        <button
          onMouseDown={(e) => { e.preventDefault(); setShowColors(v => !v); }}
          className={btn(false)} title="Text color"
          style={{ borderBottom: `3px solid ${editor?.getAttributes('textStyle').color || '#000'}` }}
        >
          <span className="text-[11px] font-bold">A</span>
        </button>
        {showColors && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-1.5 flex gap-1 shadow-xl">
            {COLORS.map(c => (
              <button key={c} onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().setColor(c).run(); setShowColors(false); }}
                className="w-4 h-4 rounded-full border border-white/50 hover:scale-125 transition-transform"
                style={{ backgroundColor: c }} />
            ))}
            <button onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().unsetColor().run(); setShowColors(false); }}
              className="w-4 h-4 rounded-full border border-slate-300 bg-gradient-to-br from-white to-slate-200 hover:scale-125 transition-transform text-[8px] flex items-center justify-center text-slate-500" title="Remove color">✕</button>
          </div>
        )}
      </div>
      {/* Autosave toggle */}
      {inline && onAutoSave && (
        <label className="ml-auto flex items-center gap-1.5 cursor-pointer select-none">
          <div
            onMouseDown={(e) => { e.preventDefault(); const next = !autoSave; setAutoSave(next); localStorage.setItem('noteAutoSave', String(next)); setSaveStatus('idle'); }}
            className={`relative w-7 h-4 rounded-full transition-colors ${autoSave ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
          >
            <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${autoSave ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Auto-save</span>
          {saveStatus === 'saving' && <span className="text-[10px] text-amber-500 animate-pulse" style={{opacity:0.3}}>saving…</span>}
          {saveStatus === 'saved' && <span className="text-[10px] text-green-500" style={{opacity:0.3}}>✓ saved</span>}
        </label>
      )}
    </div>
  );

  if (inline) {
    return (
      <div className="flex flex-col h-full" onClick={() => { setShowColors(false); setShowTableMenu(false); }}>
        {toolbar}
        <div className="flex-1 overflow-y-auto" style={{ fontFamily: noteFont }}>
          <EditorContent editor={editor} />
        </div>
        <div className="px-4 py-3 border-t flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => { onSave(editor?.getHTML() || ""); onClose(); }}>Save</Button>
        </div>
      </div>
    );
  }

  const noteColor = note.color || 'yellow';
  const winColors: Record<string, { bg: string; titlebar: string; border: string; text: string; placeholder: string; toolbarBorder: string }> = {
    yellow: { bg: 'bg-gradient-to-b from-[#fefce8] to-[#fef9c3] dark:from-[#713f12] dark:to-[#854d0e]', titlebar: 'bg-[#fef9c3]/80 dark:bg-[#854d0e]/80', border: 'border-yellow-300/60 dark:border-yellow-600/60', text: 'text-yellow-900 dark:text-yellow-100', placeholder: 'placeholder-yellow-500/60', toolbarBorder: 'border-yellow-200/80 dark:border-yellow-700/60' },
    blue:   { bg: 'bg-gradient-to-b from-[#eff6ff] to-[#dbeafe] dark:from-[#1e3a5f] dark:to-[#1e40af]', titlebar: 'bg-[#dbeafe]/80 dark:bg-[#1e40af]/80', border: 'border-blue-300/60 dark:border-blue-600/60', text: 'text-blue-900 dark:text-blue-100', placeholder: 'placeholder-blue-400/60', toolbarBorder: 'border-blue-200/80 dark:border-blue-700/60' },
    green:  { bg: 'bg-gradient-to-b from-[#f0fdf4] to-[#dcfce7] dark:from-[#14532d] dark:to-[#166534]', titlebar: 'bg-[#dcfce7]/80 dark:bg-[#166534]/80', border: 'border-green-300/60 dark:border-green-600/60', text: 'text-green-900 dark:text-green-100', placeholder: 'placeholder-green-400/60', toolbarBorder: 'border-green-200/80 dark:border-green-700/60' },
    pink:   { bg: 'bg-gradient-to-b from-[#fdf2f8] to-[#fce7f3] dark:from-[#831843] dark:to-[#9d174d]', titlebar: 'bg-[#fce7f3]/80 dark:bg-[#9d174d]/80', border: 'border-pink-300/60 dark:border-pink-600/60', text: 'text-pink-900 dark:text-pink-100', placeholder: 'placeholder-pink-400/60', toolbarBorder: 'border-pink-200/80 dark:border-pink-700/60' },
    purple: { bg: 'bg-gradient-to-b from-[#faf5ff] to-[#f3e8ff] dark:from-[#581c87] dark:to-[#6b21a8]', titlebar: 'bg-[#f3e8ff]/80 dark:bg-[#6b21a8]/80', border: 'border-purple-300/60 dark:border-purple-600/60', text: 'text-purple-900 dark:text-purple-100', placeholder: 'placeholder-purple-400/60', toolbarBorder: 'border-purple-200/80 dark:border-purple-700/60' },
    orange: { bg: 'bg-gradient-to-b from-[#fff7ed] to-[#ffedd5] dark:from-[#7c2d12] dark:to-[#9a3412]', titlebar: 'bg-[#ffedd5]/80 dark:bg-[#9a3412]/80', border: 'border-orange-300/60 dark:border-orange-600/60', text: 'text-orange-900 dark:text-orange-100', placeholder: 'placeholder-orange-400/60', toolbarBorder: 'border-orange-200/80 dark:border-orange-700/60' },
  };
  const wc = winColors[noteColor] || winColors.yellow;

  return (
    <AnimatedModal isOpen={true} onClose={() => { if (!resizingRef.current) onClose(); }} closeOnBackdrop={false}>
      <div
        className={`${wc.bg} rounded-xl overflow-hidden flex flex-col relative shadow-[0_22px_70px_4px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[0_22px_70px_4px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.06)]`}
        style={{ width: modalSize.w, height: modalSize.h }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* macOS-style title bar */}
        <div className={`flex items-center px-3.5 py-2 ${wc.titlebar} backdrop-blur-xl border-b ${wc.border} shrink-0`}>
          {/* Traffic lights */}
          <div className="flex items-center gap-2 mr-3 group">
            <button onClick={onClose} className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-transform active:scale-90" title="Close"
              style={{ background: 'radial-gradient(circle at 35% 30%, #ff8a80, #ff5f57 40%, #e0443e)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 1px rgba(0,0,0,0.15), 0 0.5px 1px rgba(0,0,0,0.2)' }}>
              <XIcon className="w-2 h-2 text-[#4a0002]/90 opacity-0 group-hover:opacity-100 transition-opacity" style={{ filter: 'drop-shadow(0 0.5px 0 rgba(255,255,255,0.3))' }} />
            </button>
            <button onClick={onClose} className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-transform active:scale-90" title="Minimize"
              style={{ background: 'radial-gradient(circle at 35% 30%, #ffd76e, #febc2e 40%, #dea123)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 1px rgba(0,0,0,0.12), 0 0.5px 1px rgba(0,0,0,0.2)' }}>
              <MinusIcon className="w-2 h-2 text-[#5f4a00]/90 opacity-0 group-hover:opacity-100 transition-opacity" style={{ filter: 'drop-shadow(0 0.5px 0 rgba(255,255,255,0.3))' }} />
            </button>
            <button
              onClick={() => setModalSize(s => s.w >= window.innerWidth * 0.85 ? { w: 520, h: 420 } : { w: Math.round(window.innerWidth * 0.85), h: Math.round(window.innerHeight * 0.85) })}
              className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-transform active:scale-90" title="Maximize"
              style={{ background: 'radial-gradient(circle at 35% 30%, #6ef5a0, #28c840 40%, #1aab29)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 1px rgba(0,0,0,0.12), 0 0.5px 1px rgba(0,0,0,0.2)' }}>
              <span className="text-[7px] text-[#006500]/90 opacity-0 group-hover:opacity-100 transition-opacity leading-none" style={{ filter: 'drop-shadow(0 0.5px 0 rgba(255,255,255,0.3))' }}>⤢</span>
            </button>
          </div>
          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className={`text-[13px] font-medium bg-transparent border-none outline-none ring-0 focus:ring-0 focus:outline-none ${wc.text} ${wc.placeholder} flex-1 text-center`}
          />
          {/* Spacer to balance traffic lights */}
          <div className="w-[62px] shrink-0" />
        </div>
        {/* Toolbar */}
        <div className={`border-b ${wc.toolbarBorder} shrink-0`}>
          {toolbar}
        </div>
        {/* Editor */}
        <div className="flex-1 overflow-y-auto" style={{ fontFamily: noteFont }}><EditorContent editor={editor} /></div>
        {/* Footer */}
        <div className={`px-4 py-2 border-t ${wc.border} flex justify-end shrink-0 ${wc.titlebar} backdrop-blur-xl`}>
          <Button size="sm" onClick={() => onSave(editor?.getHTML() || "", title)} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-4 rounded-md shadow-sm">Save</Button>
        </div>
        {/* Resize handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-30 hover:opacity-70 transition-opacity"
          onMouseDown={e => {
            e.preventDefault();
            e.stopPropagation();
            resizingRef.current = true;
            const startX = e.clientX, startY = e.clientY, startW = modalSize.w, startH = modalSize.h;
            const move = (ev: MouseEvent) => {
              ev.preventDefault();
              setModalSize({ w: Math.max(360, startW + ev.clientX - startX), h: Math.max(280, startH + ev.clientY - startY) });
            };
            const up = () => {
              setTimeout(() => { resizingRef.current = false; }, 50);
              window.removeEventListener('mousemove', move);
              window.removeEventListener('mouseup', up);
            };
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
          }}
        />
      </div>
    </AnimatedModal>
  );
}
