import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { DailySummaryCard } from '@/components/shared/DailySummaryCard';
import { useProductsQuery } from '@/hooks/inventory';
import { useCustomersQuery } from '@/hooks/customers';
import { useCreateTransactionMutation } from '@/hooks/transactions';
import { transactionSchema, type TransactionFormValues } from '@/types/schemas';
import { normalizeApiError } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';

type CartItem = {
  product_id: number;
  name: string;
  sku_code: string | null;
  selling_price: number;
  current_stock: number;
  quantity: number;
};

type DiscountMode = 'flat' | 'percent';

const initialTransactionId = () => crypto.randomUUID();

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const distributeDiscount = (items: CartItem[], discountTotal: number) => {
  if (discountTotal <= 0 || items.length === 0) {
    return items.map((item) => ({ ...item, discount_amount: 0 }));
  }

  const gross = items.reduce((sum, item) => sum + item.quantity * item.selling_price, 0);
  if (gross <= 0) {
    return items.map((item) => ({ ...item, discount_amount: 0 }));
  }

  let allocated = 0;
  return items.map((item, index) => {
    const lineGross = item.quantity * item.selling_price;
    const share = index === items.length - 1
      ? roundMoney(Math.max(0, discountTotal - allocated))
      : roundMoney(Math.max(0, (lineGross / gross) * discountTotal));
    allocated += share;
    return { ...item, discount_amount: share };
  });
};

export default function PosPage() {
  const navigate = useNavigate();
  const addToast = uiStore((state) => state.addToast);
  const createTransactionMutation = useCreateTransactionMutation();
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [transactionId, setTransactionId] = useState(initialTransactionId);
  const [timestamp, setTimestamp] = useState(() => new Date().toISOString());
  const [paymentMode, setPaymentMode] = useState<TransactionFormValues['payment_mode']>('CASH');
  const [customerLookup, setCustomerLookup] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [discountMode, setDiscountMode] = useState<DiscountMode>('flat');
  const [discountValue, setDiscountValue] = useState('0');
  const [submittedTransactionId, setSubmittedTransactionId] = useState<string | null>(null);
  const [submittedTotal, setSubmittedTotal] = useState<number | null>(null);

  const productsQuery = useProductsQuery({ page_size: 200 });
  const customersQuery = useCustomersQuery({ page_size: 100 });
  const products = productsQuery.data?.data ?? [];
  const customers = customersQuery.data?.data ?? [];

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(productSearch.trim().toLowerCase()), 300);
    return () => window.clearTimeout(timer);
  }, [productSearch]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        void handleSubmit();
      }

      if (event.key === 'Escape') {
        if (cart.length > 0 && window.confirm('Clear the current cart?')) {
          setCart([]);
          setDiscountValue('0');
        }
      }

      if (event.key === 'F2' || event.key === '/') {
        if (event.key === '/') {
          const activeTag = document.activeElement?.tagName?.toLowerCase();
          if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
            return;
          }
          event.preventDefault();
        }
        searchRef.current?.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cart.length]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (cart.length > 0) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [cart.length]);

  const filteredProducts = useMemo(() => {
    if (!debouncedSearch) {
      return products;
    }

    return products.filter((product) => {
      const haystack = `${product.name} ${product.sku_code ?? ''} ${product.barcode ?? ''}`.toLowerCase();
      return haystack.includes(debouncedSearch);
    });
  }, [debouncedSearch, products]);

  const allocatedCart = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.selling_price, 0);
    const discountInput = Number(discountValue || 0);
    const discountTotal = discountMode === 'percent'
      ? roundMoney((Math.max(0, discountInput) / 100) * subtotal)
      : Math.min(roundMoney(Math.max(0, discountInput)), subtotal);

    const withDiscounts = distributeDiscount(cart, discountTotal);
    const lineTotals = withDiscounts.map((item) => ({
      ...item,
      line_total: roundMoney(item.quantity * item.selling_price - item.discount_amount),
    }));

    const total = roundMoney(Math.max(0, subtotal - discountTotal));
    return {
      subtotal: roundMoney(subtotal),
      discountTotal,
      taxTotal: 0,
      total,
      items: lineTotals,
    };
  }, [cart, discountMode, discountValue]);

  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) {
      return null;
    }

    return customers.find((customer) => customer.customer_id === selectedCustomerId) ?? null;
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    if (!customerLookup.trim()) {
      setSelectedCustomerId(null);
      return;
    }

    const matched = customers.find((customer) => {
      const label = `${customer.customer_id} ${customer.name} ${customer.mobile_number}`.toLowerCase();
      return label.includes(customerLookup.trim().toLowerCase());
    });

    setSelectedCustomerId(matched?.customer_id ?? null);
  }, [customerLookup, customers]);

  const addToCart = (productId: number) => {
    const product = products.find((item) => item.product_id === productId);
    if (!product || product.current_stock <= 0) {
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.product_id === product.product_id);
      if (existing) {
        return current.map((item) => (
          item.product_id === product.product_id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.current_stock) }
            : item
        ));
      }

      return [
        ...current,
        {
          product_id: product.product_id,
          name: product.name,
          sku_code: product.sku_code ?? null,
          selling_price: Number(product.selling_price ?? 0),
          current_stock: Number(product.current_stock ?? 0),
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setCart((current) =>
      current
        .map((item) => (item.product_id === productId ? { ...item, quantity: Math.max(1, Math.min(quantity, item.current_stock)) } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = (productId: number) => {
    setCart((current) => current.filter((item) => item.product_id !== productId));
  };

  const resetSale = () => {
    setTransactionId(initialTransactionId());
    setTimestamp(new Date().toISOString());
    setPaymentMode('CASH');
    setCustomerLookup('');
    setSelectedCustomerId(null);
    setNotes('');
    setCart([]);
    setProductSearch('');
    setDebouncedSearch('');
    setDiscountMode('flat');
    setDiscountValue('0');
    setSubmittedTransactionId(null);
    setSubmittedTotal(null);
  };

  const handleSubmit = async () => {
    if (!cart.length) {
      addToast({ title: 'Cart is empty', message: 'Add at least one product before completing the sale.', variant: 'error' });
      return;
    }

    const payload: TransactionFormValues = {
      transaction_id: transactionId,
      timestamp,
      payment_mode: paymentMode,
      customer_id: selectedCustomerId,
      notes: notes || null,
      line_items: allocatedCart.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        selling_price: item.selling_price,
        discount_amount: item.discount_amount,
      })),
    };

    const parsed = transactionSchema.safeParse(payload);
    if (!parsed.success) {
      addToast({ title: 'Sale not ready', message: parsed.error.issues[0]?.message ?? 'Please review the sale details.', variant: 'error' });
      return;
    }

    try {
      const result = await createTransactionMutation.mutateAsync(parsed.data);
      const nextTotal = allocatedCart.total;
      setSubmittedTransactionId(result.transaction_id);
      setSubmittedTotal(nextTotal);
      addToast({ title: 'Transaction created', message: `Saved transaction ${result.transaction_id}.`, variant: 'success' });
      setCart([]);
    } catch (error) {
      const apiError = normalizeApiError(error);
      addToast({ title: 'Transaction failed', message: apiError.message, variant: 'error' });
    }
  };

  return (
    <PageFrame
      title="Point of sale"
      subtitle="Search products, build a cart, and complete a sale."
      actions={(
        <div className="button-row">
          <button className="button button--secondary" type="button" onClick={() => navigate('/customers')}>
            Add customer
          </button>
          <button className="button button--ghost" type="button" onClick={resetSale}>
            New sale
          </button>
        </div>
      )}
    >
      {submittedTransactionId ? (
        <section className="card">
          <div className="card__header">
            <strong>Sale complete</strong>
          </div>
          <div className="card__body stack">
            <div>Transaction ID: {submittedTransactionId}</div>
            <div>Total: {submittedTotal?.toFixed(2) ?? '0.00'}</div>
            <div>Payment mode: {paymentMode}</div>
            <div className="button-row">
              <Link className="button" to={`/orders/transactions/${submittedTransactionId}`}>
                View transaction
              </Link>
              <button className="button button--secondary" type="button" onClick={resetSale}>
                New sale
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid grid--2" style={{ alignItems: 'start' }}>
        <section className="card">
          <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <strong>Product search</strong>
              <div className="muted">Use / or F2 to focus search.</div>
            </div>
            <div className="muted">{filteredProducts.length} results</div>
          </div>
          <div className="card__body stack">
            <label className="field">
              <span>Search products</span>
              <input
                ref={searchRef}
                className="input"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Search by name, SKU, or barcode"
              />
            </label>
            <div className="stack">
              {filteredProducts.map((product) => {
                const inCart = cart.find((item) => item.product_id === product.product_id);
                const disabled = Number(product.current_stock ?? 0) <= 0;
                return (
                  <article key={product.product_id} className="card" style={{ padding: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                      <div>
                        <strong>{product.name}</strong>
                        <div className="muted" style={{ fontSize: '0.875rem' }}>
                          {product.sku_code || 'No SKU'} · Stock {Number(product.current_stock ?? 0)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div><strong>₹{Number(product.selling_price ?? 0).toFixed(2)}</strong></div>
                        <button className="button button--secondary" type="button" onClick={() => addToCart(product.product_id)} disabled={disabled}>
                          {disabled ? 'Out of stock' : inCart ? 'Add more' : 'Add to cart'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
              {filteredProducts.length === 0 ? <div className="muted">No products match your search.</div> : null}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <strong>Current cart</strong>
              <div className="muted">{cart.length} items</div>
            </div>
            <div className="muted">Ctrl/Cmd + Enter to complete sale</div>
          </div>
          <div className="card__body stack">
            <label className="field">
              <span>Customer</span>
              <input
                className="input"
                value={customerLookup}
                onChange={(event) => setCustomerLookup(event.target.value)}
                placeholder="Type customer name, mobile, or ID"
                list="customer-options"
              />
              <datalist id="customer-options">
                {customers.map((customer) => (
                  <option key={customer.customer_id} value={`${customer.customer_id} ${customer.name} ${customer.mobile_number}`} />
                ))}
              </datalist>
            </label>
            {selectedCustomer ? (
              <div className="card" style={{ padding: '0.8rem' }}>
                <strong>{selectedCustomer.name}</strong>
                <div className="muted">{selectedCustomer.mobile_number}</div>
              </div>
            ) : null}

            <label className="field">
              <span>Notes</span>
              <textarea className="textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>

            <div className="grid grid--2">
              <label className="field">
                <span>Payment mode</span>
                <select className="select" value={paymentMode} onChange={(event) => setPaymentMode(event.target.value as TransactionFormValues['payment_mode'])}>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="CREDIT">Credit</option>
                </select>
              </label>
              <label className="field">
                <span>Timestamp</span>
                <input
                  className="input"
                  type="datetime-local"
                  value={timestamp.slice(0, 16)}
                  onChange={(event) => {
                    const value = event.target.value;
                    setTimestamp(value ? new Date(value).toISOString() : new Date().toISOString());
                  }}
                />
              </label>
            </div>

            <div className="grid grid--2">
              <label className="field">
                <span>Discount type</span>
                <select className="select" value={discountMode} onChange={(event) => setDiscountMode(event.target.value as DiscountMode)}>
                  <option value="flat">Flat amount</option>
                  <option value="percent">Percentage</option>
                </select>
              </label>
              <label className="field">
                <span>Discount value</span>
                <input className="input" type="number" min="0" step="0.01" value={discountValue} onChange={(event) => setDiscountValue(event.target.value)} />
              </label>
            </div>

            <div className="button-row">
              <button className="button button--secondary" type="button" onClick={() => navigate('/customers')}>
                Manage customers
              </button>
            </div>

            <div className="card" style={{ padding: '0' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Unit</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {allocatedCart.items.length ? allocatedCart.items.map((item) => (
                    <tr key={item.product_id}>
                      <td>
                        <strong>{item.name}</strong>
                        <div className="muted" style={{ fontSize: '0.875rem' }}>{item.sku_code ?? 'No SKU'}</div>
                      </td>
                      <td>₹{item.selling_price.toFixed(2)}</td>
                      <td>
                        <div className="button-row" style={{ gap: '0.35rem' }}>
                          <button className="button button--ghost" type="button" onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>-</button>
                          <input
                            className="input"
                            style={{ width: 72 }}
                            type="number"
                            min="1"
                            max={item.current_stock}
                            value={item.quantity}
                            onChange={(event) => updateQuantity(item.product_id, Number(event.target.value))}
                          />
                          <button className="button button--ghost" type="button" onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>+</button>
                        </div>
                      </td>
                      <td>
                        ₹{item.line_total.toFixed(2)}
                        {item.discount_amount > 0 ? <div className="muted" style={{ fontSize: '0.75rem' }}>incl. ₹{item.discount_amount.toFixed(2)} discount</div> : null}
                      </td>
                      <td>
                        <button className="button button--ghost" type="button" onClick={() => removeItem(item.product_id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="muted" style={{ padding: '1rem' }}>
                        Add products from the search panel to build the cart.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="card" style={{ padding: '0.9rem' }}>
              <div className="stack">
                <div className="flex items-center justify-between"><span>Subtotal</span><strong>₹{allocatedCart.subtotal.toFixed(2)}</strong></div>
                <div className="flex items-center justify-between"><span>Discount</span><strong>-₹{allocatedCart.discountTotal.toFixed(2)}</strong></div>
                <div className="flex items-center justify-between"><span>Tax</span><strong>₹{allocatedCart.taxTotal.toFixed(2)}</strong></div>
                <div className="flex items-center justify-between" style={{ fontSize: '1.1rem' }}><span>Total</span><strong>₹{allocatedCart.total.toFixed(2)}</strong></div>
              </div>
            </div>

            <div className="button-row">
              <button className="button button--secondary" type="button" onClick={() => navigate('/customers')}>
                Add customer quick-link
              </button>
              <button
                className="button"
                type="button"
                onClick={() => void handleSubmit()}
                disabled={createTransactionMutation.isPending || cart.length === 0}
              >
                {createTransactionMutation.isPending ? 'Completing…' : 'Complete sale'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </PageFrame>
  );
}
