import type { ReactNode } from 'react';

export function DropdownMenu({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function DropdownMenuTrigger({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function DropdownMenuContent({ children }: { children: ReactNode }) {
  return <div className="card">{children}</div>;
}

export function DropdownMenuItem({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export default DropdownMenu;
