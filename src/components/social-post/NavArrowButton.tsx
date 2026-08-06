import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NavArrowButtonProps {
  direction: 'left' | 'right';
}

export const NavArrowButton: React.FC<NavArrowButtonProps> = ({ direction }) => {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
  return (
    <span
      className={`absolute top-1/2 -translate-y-1/2 ${direction === 'left' ? 'left-1.5' : 'right-1.5'} w-7 h-7 rounded-full bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-sm z-10`}
    >
      <Icon className="w-4 h-4 text-white/80" />
    </span>
  );
};
