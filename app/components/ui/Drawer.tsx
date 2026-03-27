'use client';

import { useEffect, type ReactNode } from 'react';

interface DrawerProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function Drawer({ children, isOpen, onClose, title }: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 transition-opacity" 
        onClick={onClose}
      />
      
      {/* Content */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-64 shadow-xl flex flex-col transition-transform"
        style={{ background: 'var(--color-surface)' }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{title || 'Menu'}</h2>
          <button
            onClick={onClose}
            className="text-xl leading-none hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
