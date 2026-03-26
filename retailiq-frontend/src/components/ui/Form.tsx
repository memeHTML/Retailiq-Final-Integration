import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';
import { cloneElement, createContext, isValidElement, useContext, useId } from 'react';
import { Controller, FormProvider, useFormContext, type ControllerProps, type FieldPath, type FieldValues } from 'react-hook-form';
import { Label } from './Label';
import { cn } from '@/utils/cn';

const FormFieldContext = createContext<{ name: string } | null>(null);
const FormItemContext = createContext<{ id: string } | null>(null);

export const Form = FormProvider;

export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ name, ...props }: ControllerProps<TFieldValues, TName>) => (
  <FormFieldContext.Provider value={{ name: String(name) }}>
    <Controller name={name} {...props} />
  </FormFieldContext.Provider>
);

export function FormItem({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const id = useId();
  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn('space-y-2', className)} {...props} />
    </FormItemContext.Provider>
  );
}

export function FormControl({ children }: { children: ReactNode }) {
  const item = useFormField();
  const { formState, getFieldState } = useFormContext();
  const describedBy = item?.id ? [`${item.id}-description`, `${item.id}-message`].join(' ') : undefined;
  const invalid = item?.name ? Boolean(getFieldState(item.name, formState).error) : false;

  if (isValidElement(children)) {
    return cloneElement(children, {
      id: item?.id ? `${item.id}-control` : undefined,
      'aria-describedby': describedBy,
      'aria-invalid': invalid || undefined,
    });
  }

  return <div id={item?.id ? `${item.id}-control` : undefined}>{children}</div>;
}

export function FormLabel({ children, className, ...props }: ComponentPropsWithoutRef<typeof Label>) {
  const item = useFormField();
  return (
    <Label htmlFor={item?.id ? `${item.id}-control` : undefined} className={className} {...props}>
      {children}
    </Label>
  );
}

export function FormDescription({ children, className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  const item = useFormField();
  return (
    <p id={item?.id ? `${item.id}-description` : undefined} className={cn('text-sm text-text-muted', className)} {...props}>
      {children}
    </p>
  );
}

export function FormMessage({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  const item = useFormField();
  const { formState, getFieldState } = useFormContext();
  const error = item?.name ? getFieldState(item.name, formState).error : undefined;
  const message = children ?? (error && 'message' in error ? String(error.message) : undefined);

  if (!message) {
    return null;
  }

  return (
    <p id={item?.id ? `${item.id}-message` : undefined} className={cn('text-sm text-danger', className)} {...props}>
      {message}
    </p>
  );
}

function useFormField() {
  const field = useContext(FormFieldContext);
  const item = useContext(FormItemContext);
  const name = field?.name;

  if (!name || !item) {
    return null;
  }

  return { name, id: item.id };
}

export { FormFieldContext, FormItemContext };
