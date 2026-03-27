'use client';

import { useEffect, useRef } from 'react';

interface MenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  items: MenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

export default function ContextMenu({ items, position, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 rounded-md shadow-lg border py-1 min-w-32"
      style={{
        left: position.x,
        top: position.y,
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => { item.onClick(); onClose(); }}
          className="w-full text-left px-3 py-1.5 text-sm hover:opacity-80 transition-opacity"
          style={{ color: item.danger ? '#ef4444' : 'var(--color-text)' }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
