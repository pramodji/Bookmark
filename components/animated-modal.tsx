"use client";

import { useState, useEffect } from "react";

export function AnimatedModal({ isOpen, onClose, children, className = "", zClass = "z-50", closeOnBackdrop = true }: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  zClass?: string;
  closeOnBackdrop?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <div className={`fixed inset-0 ${zClass} flex items-center justify-center transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={closeOnBackdrop ? onClose : undefined}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative transition-all duration-200 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${className}`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
