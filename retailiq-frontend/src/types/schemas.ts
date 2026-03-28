/**
 * src/types/schemas.ts
 * Oracle Document sections consumed: 2, 3, 4, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { z } from 'zod';

const contactFieldsSchema = z.object({
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  mobile_number: z.string().optional().or(z.literal('')),
});

/** Oracle sections 12.2 and 12.3 */
export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  mobile_number: z.string().optional().or(z.literal('')),
  password: z.string().optional().or(z.literal('')),
}).refine((value) => {
  if (value.email?.trim()) {
    return true;
  }

  return Boolean(value.mobile_number?.trim() && value.password?.trim());
}, {
  message: 'Use email for OTP or mobile number plus password',
  path: ['email'],
});
export type LoginFormValues = z.infer<typeof loginSchema>;

/** Oracle sections 12.2 and 12.3 */
export const registerSchema = z.object({
  mobile_number: z.string().min(1, 'Mobile number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(1, 'Full name is required'),
  store_name: z.string().optional().or(z.literal('')),
  email: z.string().email('Enter a valid email address'),
  role: z.enum(['owner', 'staff']).optional(),
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

/** Oracle sections 12.2 and 12.3 */
export const verifyOtpSchema = contactFieldsSchema.extend({
  otp: z.string().min(1, 'OTP is required'),
}).refine((value) => Boolean(value.email?.trim() || value.mobile_number?.trim()), {
  message: 'Provide either an email address or a mobile number',
  path: ['email'],
});
export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;

/** Oracle sections 12.2 and 12.3 */
export const resendOtpSchema = contactFieldsSchema.extend({
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  mobile_number: z.string().optional().or(z.literal('')),
  purpose: z.string().optional(),
}).refine((value) => Boolean(value.email?.trim() || value.mobile_number?.trim()), {
  message: 'Provide either an email address or a mobile number',
  path: ['email'],
});
export type ResendOtpFormValues = z.infer<typeof resendOtpSchema>;

/** Oracle sections 12.2 and 12.3 */
export const forgotPasswordSchema = contactFieldsSchema.refine((value) => Boolean(value.email?.trim() || value.mobile_number?.trim()), {
  message: 'Provide either an email address or a mobile number',
  path: ['email'],
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

/** Oracle sections 12.2 and 12.3 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  new_password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

/** Oracle sections 12.2 and 12.3 */
export const mfaSetupSchema = z.object({
  password: z.string().optional().or(z.literal('')),
});
export type MfaSetupFormValues = z.infer<typeof mfaSetupSchema>;

/** Oracle sections 12.2 and 12.3 */
export const mfaVerifySchema = z.object({
  mfa_code: z.string().min(1, 'MFA code is required'),
});
export type MfaVerifyFormValues = z.infer<typeof mfaVerifySchema>;

/** Oracle sections 12.3 */
export const storeProfileSchema = z.object({
  store_name: z.string().min(1).optional(),
  store_type: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  gst_number: z.string().nullable().optional(),
  currency_symbol: z.string().nullable().optional(),
  working_days: z.array(z.string()).optional(),
  opening_time: z.string().nullable().optional(),
  closing_time: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
});
export type StoreProfileFormValues = z.infer<typeof storeProfileSchema>;

/** Oracle sections 12.3 */
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  color_tag: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  gst_rate: z.number().nullable().optional(),
});
export type CategoryFormValues = z.infer<typeof categorySchema>;

/** Oracle sections 12.3 */
export const storeTaxConfigSchema = z.object({
  taxes: z.array(z.object({
    category_id: z.number(),
    gst_rate: z.number(),
  })),
});
export type StoreTaxConfigFormValues = z.infer<typeof storeTaxConfigSchema>;

/** Oracle sections 12.3 */
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category_id: z.number().nullable().optional(),
  sku_code: z.string().nullable().optional(),
  uom: z.enum(['pieces', 'kg', 'litre', 'pack']).optional(),
  cost_price: z.number().nonnegative('Cost price must be at least 0'),
  selling_price: z.number().nonnegative('Selling price must be at least 0'),
  current_stock: z.number().nonnegative().optional(),
  reorder_level: z.number().nonnegative().nullable().optional(),
  supplier_name: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  lead_time_days: z.number().nonnegative().nullable().optional(),
  hsn_code: z.string().nullable().optional(),
}).refine((value) => value.selling_price >= value.cost_price, {
  message: 'Selling price must be greater than or equal to cost price',
  path: ['selling_price'],
});
export type ProductFormValues = z.infer<typeof productSchema>;

/** Oracle sections 12.3 */
export const stockUpdateSchema = z.object({
  quantity_added: z.number().int().min(1, 'Quantity added must be at least 1'),
  purchase_price: z.number().nonnegative('Purchase price must be at least 0'),
  date: z.string().optional(),
  supplier_name: z.string().nullable().optional(),
  update_cost_price: z.boolean().optional(),
});
export type StockUpdateFormValues = z.infer<typeof stockUpdateSchema>;

/** Oracle sections 12.3 */
export const stockAuditSchema = z.object({
  items: z.array(z.object({
    product_id: z.number(),
    counted_quantity: z.number().int(),
  })).min(1, 'At least one item is required'),
  notes: z.string().nullable().optional(),
});
export type StockAuditFormValues = z.infer<typeof stockAuditSchema>;

/** Oracle sections 12.3 */
export const transactionLineItemSchema = z.object({
  product_id: z.number(),
  quantity: z.number().int().positive(),
  selling_price: z.number().nonnegative(),
  discount_amount: z.number().nonnegative().nullable().optional(),
});
export type TransactionLineItemFormValues = z.infer<typeof transactionLineItemSchema>;

/** Oracle sections 12.3 */
export const transactionSchema = z.object({
  transaction_id: z.string().uuid('Transaction ID must be a UUID'),
  timestamp: z.string().min(1, 'Timestamp is required'),
  payment_mode: z.enum(['CASH', 'UPI', 'CARD', 'CREDIT']),
  customer_id: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  line_items: z.array(transactionLineItemSchema).min(1, 'At least one line item is required'),
});
export type TransactionFormValues = z.infer<typeof transactionSchema>;

/** Oracle sections 12.3 */
export const batchTransactionSchema = z.object({
  transactions: z.array(transactionSchema).min(1).max(500),
});
export type BatchTransactionFormValues = z.infer<typeof batchTransactionSchema>;

/** Oracle sections 12.3 */
export const transactionReturnSchema = z.object({
  items: z.array(z.object({
    product_id: z.number(),
    quantity_returned: z.number().int().positive(),
    reason: z.string().optional(),
  })).min(1, 'At least one return item is required'),
});
export type TransactionReturnFormValues = z.infer<typeof transactionReturnSchema>;

/** Oracle sections 12.3 */
export const receiptTemplateSchema = z.object({
  header_text: z.string().nullable().optional(),
  footer_text: z.string().nullable().optional(),
  show_gstin: z.boolean(),
  paper_width_mm: z.number().nullable().optional(),
});
export type ReceiptTemplateFormValues = z.infer<typeof receiptTemplateSchema>;

/** Oracle sections 12.3 */
export const printReceiptSchema = z.object({
  transaction_id: z.string().uuid().nullable().optional(),
  printer_mac_address: z.string().nullable().optional(),
});
export type PrintReceiptFormValues = z.infer<typeof printReceiptSchema>;

/** Oracle sections 12.3 */
export const ocrConfirmSchema = z.object({
  confirmed_items: z.array(z.object({
    item_id: z.string(),
    quantity: z.number().int().positive(),
    matched_product_id: z.number().nullable(),
    unit_price: z.number().nullable().optional(),
  })).min(1, 'At least one item must be confirmed'),
});
export type OcrConfirmFormValues = z.infer<typeof ocrConfirmSchema>;

/** Oracle sections 12.3 */
export const shelfScanSchema = z.object({
  image_url: z.string().min(1, 'Image URL is required'),
});
export type ShelfScanFormValues = z.infer<typeof shelfScanSchema>;

/** Oracle sections 12.3 */
/** Oracle sections 12.3 */
export const kycVerifySchema = z.object({
  provider_code: z.string().min(1, 'Provider code is required'),
  id_number: z.string().min(1, 'ID number is required'),
  country_code: z.string().optional(),
});
export type KycVerifyFormValues = z.infer<typeof kycVerifySchema>;

/** Oracle sections 12.3 */
export const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contact_person: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  address: z.string().nullable().optional(),
  gst_number: z.string().nullable().optional(),
});
export type SupplierFormValues = z.infer<typeof supplierSchema>;

/** Oracle sections 12.3 */
export const purchaseOrderSchema = z.object({
  supplier_id: z.number(),
  items: z.array(z.object({
    product_id: z.number(),
    quantity: z.number().int().positive(),
    unit_cost: z.number().nonnegative(),
  })).min(1, 'At least one purchase order item is required'),
});
export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

/** Oracle sections 12.3 */
export const chainGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
});
export type ChainGroupFormValues = z.infer<typeof chainGroupSchema>;

/** Oracle sections 12.3 */
export const whatsappConfigSchema = z.object({
  access_token: z.string().optional(),
  phone_number_id: z.string().optional(),
  webhook_verify_token: z.string().optional(),
});
export type WhatsappConfigFormValues = z.infer<typeof whatsappConfigSchema>;

/** Oracle sections 12.3 */
export const eventSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, 'Event title is required'),
  event_type: z.enum(['HOLIDAY', 'FESTIVAL', 'PROMOTION', 'SALE_DAY', 'CLOSURE']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
});
export type EventFormValues = z.infer<typeof eventSchema>;

/** Oracle sections 12.3 */
export const loyaltyProgramSchema = z.object({
  points_per_rupee: z.number().nonnegative(),
  redemption_rate: z.number().nonnegative(),
  min_redemption_points: z.number().int().nonnegative(),
  expiry_days: z.number().int().nonnegative(),
  is_active: z.boolean(),
});
export type LoyaltyProgramFormValues = z.infer<typeof loyaltyProgramSchema>;
