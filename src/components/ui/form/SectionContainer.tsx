'use client';

import { ReactNode, useState, Children, cloneElement, isValidElement, ReactElement } from 'react';

interface SectionContainerProps {
  children: ReactNode;
  defaultCollapsed?: boolean;
}

interface SectionHeaderProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SectionContainer({ children, defaultCollapsed = false }: SectionContainerProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Process children and inject collapse props into SectionHeader
  const processedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child;
    }

    // Check if this is a SectionHeader by checking the displayName or type
    const childType = child.type as { displayName?: string; name?: string };
    if (childType?.name === 'SectionHeader' || childType?.displayName === 'SectionHeader') {
      // Clone SectionHeader with collapse props (cloneElement preserves existing props)
      return cloneElement<SectionHeaderProps>(child as ReactElement<SectionHeaderProps>, {
        isCollapsed,
        onToggleCollapse: () => setIsCollapsed(!isCollapsed),
      });
    }

    // Hide non-header children when collapsed
    if (isCollapsed) {
      return null;
    }

    return child;
  });

  return (
    <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
      {processedChildren}
    </div>
  );
}
