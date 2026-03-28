import type { ReactNode } from 'react';

export function Tooltip({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function TooltipTrigger({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function TooltipContent({ children }: { children: ReactNode }) {
  return <div className="card">{children}</div>;
}

export default Tooltip;
