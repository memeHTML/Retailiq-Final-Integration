import { useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useBarcodesQuery, useBarcodeLookupQuery, useRegisterBarcodeMutation } from '@/hooks/barcodes';
import { ProductPicker } from '@/components/shared/ProductPicker';
import { uiStore } from '@/stores/uiStore';
import { normalizeApiError } from '@/utils/errors';

type BarcodeTab = 'lookup' | 'register' | 'list';

const BARCODE_RE = /^[A-Za-z0-9-]{4,64}$/;

export default function BarcodesPage() {
  const addToast = uiStore((state) => state.addToast);
  const [activeTab, setActiveTab] = useState<BarcodeTab>('lookup');
  const [lookupInput, setLookupInput] = useState('');
  const [lookupValue, setLookupValue] = useState('');
  const [registerProductId, setRegisterProductId] = useState('');
  const [registerBarcodeValue, setRegisterBarcodeValue] = useState('');
  const [registerBarcodeType, setRegisterBarcodeType] = useState('EAN13');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [registerProductValid, setRegisterProductValid] = useState(false);

  const lookupQuery = useBarcodeLookupQuery(lookupValue || null);
  const registerMutation = useRegisterBarcodeMutation();
  const barcodeListQuery = useBarcodesQuery(selectedProductId || null);
  const lookupResult = lookupQuery.data;

  const runLookup = () => {
    setServerMessage(null);
    const value = lookupInput.trim();
    if (!value) {
      setServerMessage('Barcode value is required.');
      return;
    }

    setLookupValue(value);
    setActiveTab('lookup');
  };

  const runRegister = async () => {
    setServerMessage(null);
    const productId = registerProductId.trim();
    const barcodeValue = registerBarcodeValue.trim();

    if (!productId) {
      setServerMessage('Product ID is required.');
      return;
    }

    if (!registerProductValid) {
      setServerMessage('Select a valid product before registering a barcode.');
      return;
    }

    if (!BARCODE_RE.test(barcodeValue)) {
      setServerMessage('Barcode value must be 4 to 64 characters and contain only letters, numbers, and hyphens.');
      return;
    }

    try {
      await registerMutation.mutateAsync({
        product_id: productId,
        barcode_value: barcodeValue,
        barcode_type: registerBarcodeType.trim() || 'EAN13',
      });
      setRegisterBarcodeValue('');
      setSelectedProductId(productId);
      addToast({ title: 'Barcode registered', message: 'The barcode was saved by the backend.', variant: 'success' });
      setActiveTab('list');
    } catch (error) {
      setServerMessage(normalizeApiError(error).message);
    }
  };

  const renderLookupTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Barcode lookup</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <Input label="Barcode value" value={lookupInput} onChange={(event) => setLookupInput(event.target.value)} placeholder="ABC-12345" />
          <Button type="button" onClick={runLookup} loading={lookupQuery.isFetching && Boolean(lookupValue)}>
            Look up barcode
          </Button>
        </CardContent>
      </Card>

      {lookupValue ? (
        lookupQuery.isLoading ? (
          <SkeletonLoader variant="rect" height={180} />
        ) : lookupQuery.isError ? (
          <ErrorState error={normalizeApiError(lookupQuery.error)} onRetry={() => void lookupQuery.refetch()} />
        ) : lookupResult ? (
          <Card>
            <CardHeader>
              <CardTitle>Matched product</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div><strong>Barcode:</strong> {lookupResult.barcode_value}</div>
              <div><strong>Type:</strong> {lookupResult.barcode_type}</div>
              <div><strong>Product ID:</strong> {lookupResult.product_id}</div>
              <div><strong>Product name:</strong> {lookupResult.product_name}</div>
              <div><strong>Current stock:</strong> {lookupResult.current_stock}</div>
              <div><strong>Price:</strong> {lookupResult.price}</div>
            </CardContent>
          </Card>
        ) : (
          <EmptyState title="Barcode not found" body="No product matched this barcode. Register it against a product to continue." />
        )
      ) : (
        <EmptyState title="Start with a barcode" body="Enter a barcode value to resolve the matching product." />
      )}
    </div>
  );

  const renderRegisterTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Register barcode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Barcode value" value={registerBarcodeValue} onChange={(event) => setRegisterBarcodeValue(event.target.value)} placeholder="ABC-12345" />
            <Input label="Barcode type" value={registerBarcodeType} onChange={(event) => setRegisterBarcodeType(event.target.value)} placeholder="EAN13" />
          </div>

          <ProductPicker
            value={registerProductId}
            onChange={setRegisterProductId}
            label="Product"
            helperText="Browse inventory pages or load a product by exact ID. The product must resolve successfully before the barcode can be registered."
            onResolutionChange={(resolution) => {
              setRegisterProductValid(Boolean(resolution.product) && !resolution.isLoading && !resolution.isError);
            }}
          />

          <Button type="button" loading={registerMutation.isPending} onClick={() => void runRegister()} disabled={registerMutation.isPending || !registerProductValid || !BARCODE_RE.test(registerBarcodeValue.trim())}>
            Register barcode
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Barcodes for selected product</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProductPicker
            value={selectedProductId}
            onChange={setSelectedProductId}
            label="Product"
            helperText="Choose the product whose registered barcodes you want to review."
          />
        </CardContent>
      </Card>

      {!selectedProductId.trim() ? (
        <EmptyState title="Select a product" body="Enter a product ID or choose one from the inventory list to view its barcodes." />
      ) : barcodeListQuery.isLoading ? (
        <SkeletonLoader variant="rect" height={220} />
      ) : barcodeListQuery.isError ? (
        <ErrorState error={normalizeApiError(barcodeListQuery.error)} onRetry={() => void barcodeListQuery.refetch()} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Registered barcodes</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'barcode_value', header: 'Barcode', render: (row) => row.barcode_value },
                { key: 'barcode_type', header: 'Type', render: (row) => row.barcode_type },
                { key: 'created_at', header: 'Created At', render: (row) => row.created_at ?? '-' },
              ]}
              data={barcodeListQuery.data ?? []}
              emptyMessage="No barcodes registered for this product yet."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <PageFrame title="Barcodes" subtitle="Look up, register, and review barcodes for individual products.">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Button variant={activeTab === 'lookup' ? 'primary' : 'ghost'} onClick={() => setActiveTab('lookup')}>Lookup</Button>
          <Button variant={activeTab === 'register' ? 'primary' : 'ghost'} onClick={() => setActiveTab('register')}>Register</Button>
          <Button variant={activeTab === 'list' ? 'primary' : 'ghost'} onClick={() => setActiveTab('list')}>Product Barcodes</Button>
        </div>

        {activeTab === 'lookup' ? renderLookupTab() : null}
        {activeTab === 'register' ? renderRegisterTab() : null}
        {activeTab === 'list' ? renderListTab() : null}

        {serverMessage ? <div className="text-sm text-red-600">{serverMessage}</div> : null}
      </div>
    </PageFrame>
  );
}
