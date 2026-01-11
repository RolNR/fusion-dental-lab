'use client';

import { ReactNode } from 'react';

interface SectionContainerProps {
  children: ReactNode;
}

export function SectionContainer({ children }: SectionContainerProps) {
  return (
    <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
      {children}
    </div>
  );
}
