'use client';

import { useState } from 'react';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
}

export default function CommentForm({ onSubmit }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        className="flex-1 px-3 py-1.5 text-sm border rounded-md outline-none focus:ring-2 focus:ring-indigo-400"
        style={{
          background: 'var(--color-bg)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
        }}
      />
      <button
        type="submit"
        disabled={!content.trim() || submitting}
        className="px-3 py-1.5 text-sm rounded-md text-white disabled:opacity-50"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        Post
      </button>
    </form>
  );
}
