import type { HTMLAttributes, ReactNode } from 'react';

export function Table({ children }: { children: ReactNode }) {
  return <table className="table">{children}</table>;
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children }: { children: ReactNode }) {
  return <tr>{children}</tr>;
}

export function TableHead({ children, ...props }: HTMLAttributes<HTMLTableCellElement> & { children: ReactNode }) {
  return <th {...props}>{children}</th>;
}

export function TableCell({ children, ...props }: HTMLAttributes<HTMLTableCellElement> & { children: ReactNode }) {
  return <td {...props}>{children}</td>;
}

export function TableFooter({ children }: { children: ReactNode }) {
  return <tfoot>{children}</tfoot>;
}

export default Table;
