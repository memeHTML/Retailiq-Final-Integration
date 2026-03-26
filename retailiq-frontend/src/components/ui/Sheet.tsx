import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './Dialog';
import { cn } from '@/utils/cn';

type SheetSide = 'left' | 'right';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  side?: SheetSide;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Sheet({ open, onOpenChange, title, description, side = 'right', children, footer, className }: SheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        centered={false}
        className={cn(
          'max-w-none p-0',
          side === 'right'
            ? 'inset-y-0 right-0 w-[min(420px,100vw)] rounded-none border-l'
            : 'inset-y-0 left-0 w-[min(420px,100vw)] rounded-none border-r',
          className,
        )}
      >
        <div className="flex h-full flex-col bg-bg-elevated">
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="space-y-1">
              {title ? <DialogTitle className="text-lg font-semibold">{title}</DialogTitle> : null}
              {description ? <DialogDescription>{description}</DialogDescription> : null}
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-elevated text-text-muted transition hover:bg-bg-muted"
              onClick={() => onOpenChange(false)}
              aria-label="Close panel"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-5">{children}</div>
          {footer ? <div className="border-t border-border px-5 py-4">{footer}</div> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
