"use client";
import { useRef, useEffect } from "react";
import { PlusIcon, MinusIcon, XIcon, EyeOffIcon, EyeIcon } from "lucide-react";

export function StickyNote({ note, onUpdate, onDelete, onContextMenu }: {
  note: any;
  onUpdate: (data: any) => void;
  onDelete: (id: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);
  const lastClickRef = useRef(0);

  const openEditor = () => {
    if (!note.blurred) onUpdate({ ...note, floating: false });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: note.x || 120, origY: note.y || 80, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !ref.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    if (!dragRef.current.moved) return;
    ref.current.style.left = `${dragRef.current.origX + dx}px`;
    ref.current.style.top = `${dragRef.current.origY + dy}px`;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    if (dragRef.current.moved) {
      onUpdate({ id: note.id, x: dragRef.current.origX + e.clientX - dragRef.current.startX, y: dragRef.current.origY + e.clientY - dragRef.current.startY });
    } else {
      const now = Date.now();
      if (now - lastClickRef.current < 400) { openEditor(); lastClickRef.current = 0; }
      else { lastClickRef.current = now; }
    }
    dragRef.current = null;
  };

  const onUpdateRef = useRef(onUpdate);
  const noteRef = useRef(note);
  useEffect(() => { onUpdateRef.current = onUpdate; noteRef.current = note; });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let isResizing = false;
    const onMouseDown = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      if (e.clientX >= rect.right - 16 && e.clientY >= rect.bottom - 16) isResizing = true;
    };
    const onMouseUp = () => {
      if (!isResizing) return;
      isResizing = false;
      const n = noteRef.current;
      onUpdateRef.current({ id: n.id, width: Math.round(el.offsetWidth), height: Math.round(el.offsetHeight), x: Math.round(el.offsetLeft), y: Math.round(el.offsetTop), color: n.color });
    };
    const onResize = () => {
      const x = Math.min(el.offsetLeft, window.innerWidth - el.offsetWidth);
      const y = Math.min(el.offsetTop, window.innerHeight - el.offsetHeight);
      if (x !== el.offsetLeft || y !== el.offsetTop) {
        el.style.left = `${Math.max(0, x)}px`;
        el.style.top = `${Math.max(0, y)}px`;
        onUpdate({ id: note.id, x: Math.max(0, x), y: Math.max(0, y) });
      }
    };
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('resize', onResize);
    return () => { el.removeEventListener('mousedown', onMouseDown); window.removeEventListener('mouseup', onMouseUp); window.removeEventListener('resize', onResize); };
  }, [note.id]);

  const bgColor = note.color === 'blue' ? 'from-blue-100 to-blue-200 dark:from-blue-700 dark:to-blue-800' :
                 note.color === 'green' ? 'from-green-100 to-green-200 dark:from-green-700 dark:to-green-800' :
                 note.color === 'pink' ? 'from-pink-100 to-pink-200 dark:from-pink-700 dark:to-pink-800' :
                 note.color === 'purple' ? 'from-purple-100 to-purple-200 dark:from-purple-700 dark:to-purple-800' :
                 note.color === 'orange' ? 'from-orange-100 to-orange-200 dark:from-orange-700 dark:to-orange-800' :
                 'from-yellow-100 to-yellow-200 dark:from-yellow-700 dark:to-yellow-800';
  const borderColor = note.color === 'blue' ? 'border-blue-300 dark:border-blue-600' :
                     note.color === 'green' ? 'border-green-300 dark:border-green-600' :
                     note.color === 'pink' ? 'border-pink-300 dark:border-pink-600' :
                     note.color === 'purple' ? 'border-purple-300 dark:border-purple-600' :
                     note.color === 'orange' ? 'border-orange-300 dark:border-orange-600' :
                     'border-yellow-300 dark:border-yellow-600';
  const headerColor = note.color === 'blue' ? 'bg-blue-200 dark:bg-blue-600 border-blue-300 dark:border-blue-500' :
                     note.color === 'green' ? 'bg-green-200 dark:bg-green-600 border-green-300 dark:border-green-500' :
                     note.color === 'pink' ? 'bg-pink-200 dark:bg-pink-600 border-pink-300 dark:border-pink-500' :
                     note.color === 'purple' ? 'bg-purple-200 dark:bg-purple-600 border-purple-300 dark:border-purple-500' :
                     note.color === 'orange' ? 'bg-orange-200 dark:bg-orange-600 border-orange-300 dark:border-orange-500' :
                     'bg-yellow-200 dark:bg-yellow-600 border-yellow-300 dark:border-yellow-500';
  const textColor = note.color === 'blue' ? 'text-blue-900 dark:text-blue-100' :
                   note.color === 'green' ? 'text-green-900 dark:text-green-100' :
                   note.color === 'pink' ? 'text-pink-900 dark:text-pink-100' :
                   note.color === 'purple' ? 'text-purple-900 dark:text-purple-100' :
                   note.color === 'orange' ? 'text-orange-900 dark:text-orange-100' :
                   'text-yellow-900 dark:text-yellow-100';

  return (
    <div
      ref={ref}
      className={`fixed z-40 bg-gradient-to-br ${bgColor} rounded-lg shadow-xl border ${borderColor} resize overflow-hidden`}
      style={{ left: note.x || 120, top: note.y || 80, width: note.width || 256, height: note.collapsed ? 32 : (note.height || 192), opacity: note.opacity || 1 }}
      onContextMenu={onContextMenu}
    >
      <div className={`flex items-center justify-between px-2 py-1 ${headerColor} border-b cursor-move`} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate flex-1">{note.title || 'Sticky Note'}</span>
        <button onClick={(e) => { e.stopPropagation(); onUpdate({ id: note.id, blurred: !note.blurred }); }} className="text-slate-800 hover:text-slate-600 mr-1" title={note.blurred ? 'Reveal content' : 'Blur content'}>
          {note.blurred ? <EyeIcon className="w-3 h-3" /> : <EyeOffIcon className="w-3 h-3" />}
        </button>
        <button onClick={() => onUpdate({ ...note, collapsed: !note.collapsed })} className="text-slate-800 hover:text-slate-600 mr-1">
          {note.collapsed ? <PlusIcon className="w-3 h-3" /> : <MinusIcon className="w-3 h-3" />}
        </button>
        <button onClick={() => onDelete(note.id)} className="text-slate-800 hover:text-red-600">
          <XIcon className="w-3 h-3" />
        </button>
      </div>
      {!note.collapsed && (
        <div
          className={`w-full h-full p-2 text-xs overflow-y-auto ${textColor} cursor-text select-text transition-all duration-300 ${note.blurred ? 'blur-sm select-none' : ''}`}
          style={{ fontFamily: note.fontFamily || 'system-ui' }}
          dangerouslySetInnerHTML={{ __html: note.content || 'Type your note...' }}
          onDoubleClick={openEditor}
        />
      )}
    </div>
  );
}
