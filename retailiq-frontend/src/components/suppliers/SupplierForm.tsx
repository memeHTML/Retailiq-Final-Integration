import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { useCreateSupplier, useUpdateSupplier } from '@/hooks/suppliers';
import { uiStore } from '@/stores/uiStore';
import { normalizeApiError } from '@/utils/errors';
import type { ApiError } from '@/types/api';
import type { SupplierCreatePayload, SupplierUpdatePayload } from '@/api/suppliers';

export interface SupplierFormValues {
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  payment_terms_days: string;
  is_active: boolean;
}

interface SupplierFormProps {
  supplierId?: string;
  initialValues?: Partial<SupplierFormValues>;
  onSuccess?: (supplierId: string) => void;
  onCancel?: () => void;
}

const defaultValues: SupplierFormValues = {
  name: '',
  contact_name: '',
  phone: '',
  email: '',
  address: '',
  payment_terms_days: '30',
  is_active: true,
};

const toPayload = (values: SupplierFormValues): SupplierCreatePayload | SupplierUpdatePayload => ({
  name: values.name.trim(),
  contact_name: values.contact_name.trim() || undefined,
  phone: values.phone.trim() || undefined,
  email: values.email.trim() || undefined,
  address: values.address.trim() || undefined,
  payment_terms_days: values.payment_terms_days.trim() ? Number(values.payment_terms_days) : undefined,
  is_active: values.is_active,
});

export function SupplierForm({ supplierId, initialValues, onSuccess, onCancel }: SupplierFormProps) {
  const navigate = useNavigate();
  const addToast = uiStore((state) => state.addToast);
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const mutation = supplierId ? updateMutation : createMutation;
  const [values, setValues] = useState<SupplierFormValues>({ ...defaultValues, ...initialValues });

  useEffect(() => {
    setValues({ ...defaultValues, ...initialValues });
  }, [initialValues]);

  const error = mutation.error ? normalizeApiError(mutation.error) : null;

  const handleChange = (key: keyof SupplierFormValues) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const nextValue = event.target.type === 'checkbox'
      ? (event.target as HTMLInputElement).checked
      : event.target.value;
    setValues((current) => ({ ...current, [key]: nextValue }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = toPayload(values);
    try {
      const response = supplierId
        ? await updateMutation.mutateAsync({ supplierId, payload: payload as SupplierUpdatePayload })
        : await createMutation.mutateAsync(payload as SupplierCreatePayload);
      addToast({
        title: supplierId ? 'Supplier updated' : 'Supplier created',
        message: values.name,
        variant: 'success',
      });
      onSuccess?.(response.id);
      if (!onSuccess) {
        navigate(`/suppliers/${response.id}`);
      }
    } catch {
      // surface through ErrorState
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? <ErrorState error={error as ApiError} onRetry={() => mutation.reset()} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>{supplierId ? 'Edit Supplier' : 'Create Supplier'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Supplier Name</span>
              <Input value={values.name} onChange={handleChange('name')} required placeholder="Supplier name" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Contact Person</span>
              <Input value={values.contact_name} onChange={handleChange('contact_name')} placeholder="Contact person" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Email</span>
              <Input type="email" value={values.email} onChange={handleChange('email')} placeholder="supplier@example.com" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Phone</span>
              <Input value={values.phone} onChange={handleChange('phone')} placeholder="+91..." />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Address</span>
              <textarea
                className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={values.address}
                onChange={handleChange('address')}
                placeholder="Address"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Payment Terms Days</span>
              <Input
                type="number"
                min={0}
                value={values.payment_terms_days}
                onChange={handleChange('payment_terms_days')}
                placeholder="30"
              />
            </label>
            <label className="flex items-center gap-2 pt-8">
              <input type="checkbox" checked={values.is_active} onChange={handleChange('is_active')} />
              <span className="text-sm font-medium">Active</span>
            </label>
          </div>
          <div className="flex gap-3">
            <Button type="submit" loading={mutation.isPending}>
              {supplierId ? 'Save Changes' : 'Create Supplier'}
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
