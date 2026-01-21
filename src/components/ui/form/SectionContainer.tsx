'use client';

import {
  ReactNode,
  useState,
  Children,
  cloneElement,
  isValidElement,
  ReactElement,
  forwardRef,
} from 'react';

interface SectionContainerProps {
  children: ReactNode;
  defaultCollapsed?: boolean;
  collapsed?: boolean; // Controlled collapse state
  hasErrors?: boolean; // Whether this section has validation errors
  errorCount?: number; // Number of errors in this section
  onCollapseChange?: (collapsed: boolean) => void; // Callback when collapse changes
}

interface SectionHeaderProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  hasErrors?: boolean;
  errorCount?: number;
}

export const SectionContainer = forwardRef<HTMLDivElement, SectionContainerProps>(
  (
    {
      children,
      defaultCollapsed = false,
      collapsed,
      hasErrors = false,
      errorCount,
      onCollapseChange,
    },
    ref
  ) => {
    const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);

    // Use controlled state if provided, otherwise use internal state
    const isCollapsed = collapsed !== undefined ? collapsed : internalCollapsed;

    const handleToggle = () => {
      const newCollapsed = !isCollapsed;
      if (collapsed === undefined) {
        setInternalCollapsed(newCollapsed);
      }
      onCollapseChange?.(newCollapsed);
    };

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
          onToggleCollapse: handleToggle,
          hasErrors,
          errorCount,
        });
      }

      // Hide non-header children when collapsed
      if (isCollapsed) {
        return null;
      }

      return child;
    });

    // Determine border color based on error state
    const borderClass = hasErrors ? 'border-danger border-2' : 'border-border';

    return (
      <div
        ref={ref}
        className={`rounded-xl ${borderClass} bg-background shadow-sm overflow-hidden transition-colors`}
      >
        {processedChildren}
      </div>
    );
  }
);

SectionContainer.displayName = 'SectionContainer';
