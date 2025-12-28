'use client';

import { useState } from 'react';
import { Icons } from './Icons';
import { Button } from './Button';

interface CopyableFieldProps {
  label: string;
  value: string | null | undefined;
  placeholder?: string;
}

export function CopyableField({ label, value, placeholder = '-' }: CopyableFieldProps) {
  const [copied, setCopied] = useState(false);
  const displayValue = value || placeholder;
  const showCopyButton = !!value;

  const handleCopy = async () => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground flex items-center gap-2">
        <span>{displayValue}</span>
        {showCopyButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            title={`Copiar ${label.toLowerCase()}`}
            className="p-1 h-auto min-h-0"
          >
            {copied ? (
              <Icons.check size={16} />
            ) : (
              <Icons.copy size={16} />
            )}
          </Button>
        )}
      </dd>
    </div>
  );
}
