import type { ReactNode } from 'react';

export function Tabs({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function TabsList({ children }: { children: ReactNode }) {
  return <div className="button-row">{children}</div>;
}

export function TabsTrigger({ children }: { children: ReactNode }) {
  return <button type="button">{children}</button>;
}

export function TabsContent({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export default Tabs;
