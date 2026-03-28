import type { FormHTMLAttributes, ReactNode } from 'react';

export function Form({ children, ...props }: FormHTMLAttributes<HTMLFormElement> & { children: ReactNode }) {
  return <form {...props}>{children}</form>;
}

export function FormField({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function FormItem({ children }: { children: ReactNode }) {
  return <div className="stack">{children}</div>;
}

export function FormLabel({ children }: { children: ReactNode }) {
  return <label>{children}</label>;
}

export function FormMessage({ children }: { children: ReactNode }) {
  return <p className="text-sm text-red-600">{children}</p>;
}

export default Form;
