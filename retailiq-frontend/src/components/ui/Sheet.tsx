import type { ReactNode } from 'react';

export function Sheet({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function SheetTrigger({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function SheetContent({ children }: { children: ReactNode }) {
  return <div className="card">{children}</div>;
}

export default Sheet;
