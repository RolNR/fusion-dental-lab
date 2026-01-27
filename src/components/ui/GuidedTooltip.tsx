'use client';

import { RefObject, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { Button } from './Button';

export interface GuidedTooltipProps {
  targetRef: RefObject<HTMLElement | null>;
  message: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  onDismiss: () => void;
  isVisible: boolean;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

export function GuidedTooltip({
  targetRef,
  message,
  position = 'bottom',
  onDismiss,
  isVisible,
}: GuidedTooltipProps) {
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const calculatePosition = useCallback(() => {
    if (!targetRef.current || !isVisible) {
      setTooltipPosition(null);
      return;
    }

    const targetRect = targetRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Tooltip approximate dimensions
    const tooltipWidth = 320;
    const tooltipHeight = 120;
    const offset = 12;

    let top: number;
    let left: number;
    let arrowPosition: 'top' | 'bottom' | 'left' | 'right';

    // For fixed positioning, use viewport-relative coordinates (no scroll offset needed)
    switch (position) {
      case 'top':
        top = targetRect.top - tooltipHeight - offset;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        arrowPosition = 'bottom';
        break;
      case 'bottom':
        top = targetRect.bottom + offset;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        arrowPosition = 'top';
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - offset;
        arrowPosition = 'right';
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + offset;
        arrowPosition = 'left';
        break;
      default:
        top = targetRect.bottom + offset;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        arrowPosition = 'top';
    }

    // Keep tooltip within viewport bounds
    const padding = 16;
    if (left < padding) {
      left = padding;
    } else if (left + tooltipWidth > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth - padding;
    }

    if (top < padding) {
      // Flip to bottom if too close to top
      top = targetRect.bottom + offset;
      arrowPosition = 'top';
    } else if (top + tooltipHeight > viewportHeight - padding) {
      // Flip to top if too close to bottom
      top = targetRect.top - tooltipHeight - offset;
      arrowPosition = 'bottom';
    }

    setTooltipPosition({ top, left, arrowPosition });
  }, [targetRef, position, isVisible]);

  // Use useLayoutEffect to calculate position synchronously after DOM updates
  useLayoutEffect(() => {
    if (isVisible) {
      // Small delay to ensure ref is attached
      const timer = setTimeout(() => {
        calculatePosition();
        setIsAnimating(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      setTooltipPosition(null);
    }
  }, [isVisible, calculatePosition]);

  useEffect(() => {
    if (!isVisible) return;

    const handleResize = () => calculatePosition();
    const handleScroll = () => calculatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isVisible, calculatePosition]);

  if (!isVisible || !tooltipPosition) {
    return null;
  }

  const arrowStyles: Record<string, string> = {
    top: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-primary',
    bottom:
      'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-primary',
    left: 'left-0 top-1/2 -translate-x-full -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-primary',
    right:
      'right-0 top-1/2 translate-x-full -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-primary',
  };

  return (
    <div
      className={`fixed z-[100] w-80 transition-opacity duration-200 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        top: tooltipPosition.top,
        left: tooltipPosition.left,
      }}
    >
      <div className="relative bg-primary text-primary-foreground rounded-lg shadow-lg p-4">
        {/* Arrow */}
        <div
          className={`absolute w-0 h-0 border-8 ${arrowStyles[tooltipPosition.arrowPosition]}`}
        />

        {/* Content */}
        <p className="text-sm leading-relaxed mb-3">{message}</p>

        {/* Dismiss button */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="!text-primary-foreground hover:!bg-primary-foreground/20 !px-3 !py-1.5"
          >
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
}
