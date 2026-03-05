import type { Comment } from '@/app/lib/types';

interface CommentListProps {
  comments: Comment[];
}

export default function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        No comments yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {comments.map((comment) => (
        <li key={comment.id}>
          <p className="text-sm" style={{ color: 'var(--color-text)' }}>
            {comment.content}
          </p>
          <time className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {new Date(comment.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </time>
        </li>
      ))}
    </ul>
  );
}
