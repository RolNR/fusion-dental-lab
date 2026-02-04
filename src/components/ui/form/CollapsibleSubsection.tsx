'use client';

import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

interface CollapsibleSubsectionProps {
  icon: keyof typeof Icons;
  title: string;
  children: ReactNode;
  defaultCollapsed?: boolean;
}

export function CollapsibleSubsection({
  icon,
  title,
  children,
  defaultCollapsed = false,
}: CollapsibleSubsectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const IconComponent = Icons[icon];

  return (
    <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
      {/* Simple title header with collapse toggle */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="!w-full !justify-between !p-4 !rounded-none hover:!bg-muted/30 !ring-0 !ring-offset-0 focus:!ring-0 focus:!ring-offset-0"
      >
        <div className="flex items-center gap-2">
          <IconComponent className="h-5 w-5 text-muted-foreground" />
          <h4 className="text-base font-semibold text-foreground">{title}</h4>
        </div>
        <Icons.chevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform ${
            isCollapsed ? '-rotate-90' : 'rotate-0'
          }`}
        />
      </Button>

      {/* Collapsible content */}
      {!isCollapsed && <div className="p-4 pt-0">{children}</div>}
    </div>
  );
}
