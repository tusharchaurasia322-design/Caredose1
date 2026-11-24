// src/components/FloatingAccessibilityButton.tsx
import React, { useState, useEffect, useRef } from 'react';
import { AccessibilityService, AccessibilitySettings } from '../services/accessibility';
import { t } from '../services/i18n';
import { Eye, Settings, Move, RotateCcw, Volume2, Shield } from 'lucide-react';

interface FloatingAccessibilityButtonProps {
  settings: AccessibilitySettings;
  onOpenPanel: () => void;
  isUrgentModalOpen?: boolean;
}

export const FloatingAccessibilityButton: React.FC<FloatingAccessibilityButtonProps> = ({
  settings,
  onOpenPanel,
  isUrgentModalOpen = false,
}) => {
  // Coordinates in pixels relative to viewport
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    return settings.floatingBtnPosition || { x: 20, y: 120 };
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 20,
    initY: 120
  });
  const hasMovedRef = useRef<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sync position from settings
  useEffect(() => {
    if (settings.floatingBtnPosition) {
      setPosition(settings.floatingBtnPosition);
    }
  }, [settings.floatingBtnPosition]);

  // Keep button within window boundaries on resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const btnSize = 64;
        const maxX = Math.max(10, window.innerWidth - btnSize - 10);
        const maxY = Math.max(70, window.innerHeight - btnSize - 80); // avoid bottom nav

        const clampedX = Math.min(Math.max(10, prev.x), maxX);
        const clampedY = Math.min(Math.max(70, prev.y), maxY);
        return { x: clampedX, y: clampedY };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Only primary button
    if (e.button !== 0) return;

    hasMovedRef.current = false;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: position.x,
      initY: position.y
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      hasMovedRef.current = true;
    }

    const btnSize = 64;
    const maxX = Math.max(10, window.innerWidth - btnSize - 10);
    const maxY = Math.max(70, window.innerHeight - btnSize - 80);

    const newX = Math.min(Math.max(10, dragStartRef.current.initX + deltaX), maxX);
    const newY = Math.min(Math.max(70, dragStartRef.current.initY + deltaY), maxY);

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }

    // If moved, persist new position
    if (hasMovedRef.current) {
      AccessibilityService.updateSettings({ floatingBtnPosition: position });
    } else {
      // It was a tap/click!
      onOpenPanel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenPanel();
    }
  };

  // If urgent medicine modal is open, lower opacity or yield so it doesn't obstruct critical buttons
  if (isUrgentModalOpen) {
    return null;
  }

  const btnWidth = settings.largeButtonMode ? 68 : 60;
  const btnHeight = settings.largeButtonMode ? 68 : 60;

  return (
    <button
      ref={buttonRef}
      type="button"
      role="button"
      aria-label="Accessibility settings"
      title="Accessibility settings (Drag to move, Tap to open)"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${btnWidth}px`,
        height: `${btnHeight}px`,
        touchAction: 'none'
      }}
      className={`fixed z-40 rounded-full flex flex-col items-center justify-center select-none shadow-2xl transition-transform active:scale-95 focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:outline-none cursor-grab active:cursor-grabbing border-2 ${
        settings.highContrast
          ? 'bg-yellow-300 text-black border-white ring-2 ring-black'
          : 'bg-teal-700 text-white border-teal-200 hover:bg-teal-800'
      } ${isDragging ? 'opacity-90 scale-105 shadow-3xl' : 'opacity-95'}`}
    >
      {/* Universal Human Accessibility Icon SVG */}
      <svg
        className="w-6 h-6 shrink-0"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="12" cy="4" r="2" />
        <path d="M19 13v-2c-1.54.02-3.09-.75-4.07-1.83l-1.29-1.43c-.17-.19-.38-.34-.61-.45-.48-.23-1.04-.26-1.55-.08L7.2 8.7C6.46 8.97 6 9.68 6 10.47V15c0 .55.45 1 1 1s1-.45 1-1v-4l2.5-1 1.05 4.72c.16.71.74 1.23 1.45 1.28H15c.55 0 1-.45 1-1s-.45-1-1-1h-1.3l-.6-2.7 1.6 1.4c.82.72 1.88 1.1 2.9 1.1.55 0 1-.45 1-1z" />
        <path d="M12 14c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
      </svg>
      <span className="text-[9px] font-black uppercase tracking-tighter leading-none mt-0.5">
        A11y
      </span>
    </button>
  );
};
