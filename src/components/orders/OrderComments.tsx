'use client';

import { Icons } from '@/components/ui/Icons';
import { getRoleLabel, formatDate } from '@/lib/formatters';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    name: string | null;
    role: string;
  };
}

interface OrderCommentsProps {
  comments: Comment[];
}

export function OrderComments({ comments }: OrderCommentsProps) {
  if (!comments || comments.length === 0) {
    return null;
  }

  return (
    <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 sm:p-6 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <Icons.alertCircle className="text-warning flex-shrink-0 mt-1" size={24} />
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Información Solicitada por el Laboratorio
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Se requiere información adicional antes de procesar esta orden
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="bg-background border border-border-input rounded-md p-4"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {comment.author.name || 'Usuario'}
                </span>
                <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                  {getRoleLabel(comment.author.role)}
                </span>
              </div>
              <time className="text-xs text-muted-foreground flex-shrink-0">
                {formatDate(comment.createdAt, true)}
              </time>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
