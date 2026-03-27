import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { normalizeApiError } from '@/utils/errors';
import type { Customer } from '@/types/models';
import type { CreateCustomerRequest, UpdateCustomerRequest } from '@/types/api';

const customerSchema = z.object({
  name: z.string().trim().min(1, 'Customer name is required'),
  mobile_number: z.string().trim().regex(/^\d{10,15}$/, 'Mobile number must be 10 to 15 digits'),
  email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface BaseCustomerFormProps {
  open: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
}

interface CreateCustomerFormProps extends BaseCustomerFormProps {
  mode: 'create';
  customer?: null | undefined;
  onSubmit: (payload: CreateCustomerRequest) => Promise<void>;
}

interface EditCustomerFormProps extends BaseCustomerFormProps {
  mode: 'edit';
  customer: Customer;
  onSubmit: (payload: UpdateCustomerRequest) => Promise<void>;
}

type CustomerFormProps = CreateCustomerFormProps | EditCustomerFormProps;

function toFormValues(customer?: Customer | null): CustomerFormValues {
  const gender: CustomerFormValues['gender'] =
    customer?.gender === 'male' || customer?.gender === 'female' || customer?.gender === 'other'
      ? customer.gender
      : '';
  return {
    name: customer?.name ?? '',
    mobile_number: customer?.mobile_number ?? '',
    email: customer?.email ?? '',
    gender,
    birth_date: customer?.birth_date ?? '',
    address: customer?.address ?? '',
    notes: customer?.notes ?? '',
  };
}

function toPayload(values: CustomerFormValues): CreateCustomerRequest | UpdateCustomerRequest {
  const normalize = (value?: string | null) => {
    const next = value?.trim();
    return next ? next : undefined;
  };

  return {
    name: values.name.trim(),
    mobile_number: values.mobile_number.trim(),
    email: normalize(values.email),
    gender: normalize(values.gender) as CreateCustomerRequest['gender'] | UpdateCustomerRequest['gender'],
    birth_date: normalize(values.birth_date),
    address: normalize(values.address),
    notes: normalize(values.notes),
  };
}

export function CustomerForm(props: CustomerFormProps) {
  const { open, isSubmitting = false, onClose } = props;
  const mode = props.mode;
  const customer = mode === 'edit' ? props.customer : null;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const defaultValues = useMemo(() => toFormValues(customer), [customer]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues);
      setSubmitError(null);
    }
  }, [defaultValues, open, reset]);

  const close = () => {
    setSubmitError(null);
    reset(defaultValues);
    onClose();
  };

  const submit = handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      const payload = toPayload(values);
      if (mode === 'create') {
        await props.onSubmit(payload as CreateCustomerRequest);
      } else {
        await props.onSubmit(payload as UpdateCustomerRequest);
      }
      close();
    } catch (error) {
      setSubmitError(normalizeApiError(error).message);
    }
  });

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={close}>
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="dialog__header">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="customer-form-title" style={{ margin: 0 }}>
                {mode === 'create' ? 'Create Customer' : 'Edit Customer'}
              </h2>
              <p className="muted" style={{ margin: '0.35rem 0 0' }}>
                Keep the wire contract on `name` and `mobile_number`.
              </p>
            </div>
            <div className="badge badge--info">{mode === 'create' ? 'New record' : 'Update record'}</div>
          </div>
        </header>

        <div className="dialog__body stack">
          {submitError ? <p style={{ margin: 0, color: 'var(--danger)' }}>{submitError}</p> : null}

          <div className="customer-form__grid customer-form__grid--two">
            <Input label="Name" placeholder="Customer name" error={errors.name?.message} {...register('name')} />
            <Input label="Mobile Number" placeholder="10 to 15 digits" error={errors.mobile_number?.message} {...register('mobile_number')} />
            <Input label="Email" type="email" placeholder="customer@example.com" error={errors.email?.message} {...register('email')} />
            <label className="field">
              <span>Gender</span>
              <select className="select" {...register('gender')}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender ? <p style={{ margin: 0, color: 'var(--danger)' }}>{errors.gender.message}</p> : null}
            </label>
            <Input label="Birth Date" type="date" error={errors.birth_date?.message} {...register('birth_date')} />
            <Input label="Address" placeholder="Customer address" error={errors.address?.message} {...register('address')} />
          </div>

          <label className="field">
            <span>Notes</span>
            <Textarea className="textarea" placeholder="Optional notes" rows={4} {...register('notes')} />
            {errors.notes ? <p style={{ margin: 0, color: 'var(--danger)' }}>{errors.notes.message}</p> : null}
          </label>
        </div>

        <footer className="dialog__footer">
          <Button variant="ghost" type="button" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} loading={isSubmitting}>
            {mode === 'create' ? 'Create Customer' : 'Save Changes'}
          </Button>
        </footer>
      </section>
    </div>
  );
}

export default CustomerForm;
