/**
 * src/components/ui/Badge.tsx
 * Oracle Document sections consumed: 4, 7, 9
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import React from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'blue' | 'indigo' | 'yellow' | 'green' | 'red';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-200 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-indigo-100 text-indigo-800',
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
  };

  return (
    <span className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </span>
  );
}
