import type { ReactNode } from 'react';

export function AlertDialog({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function AlertDialogTrigger({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function AlertDialogContent({ children }: { children: ReactNode }) {
  return <div className="dialog">{children}</div>;
}

export default AlertDialog;
