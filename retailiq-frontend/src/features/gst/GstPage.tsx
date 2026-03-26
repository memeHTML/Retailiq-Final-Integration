import { useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { formatYearMonthLocal } from '@/utils/dates';
import { GstConfigTab } from './components/GstConfigTab';
import { GstGstr1Tab } from './components/GstGstr1Tab';
import { GstHsnTab } from './components/GstHsnTab';
import { GstLiabilityTab } from './components/GstLiabilityTab';
import { GstSummaryTab } from './components/GstSummaryTab';
import { GstTaxCalculatorTab } from './components/GstTaxCalculatorTab';

type Tab = 'config' | 'summary' | 'gstr1' | 'hsn' | 'liability' | 'tax';

const currentPeriod = () => formatYearMonthLocal();

const tabLabel = (tab: Tab) => {
  if (tab === 'gstr1') return 'GSTR1';
  if (tab === 'hsn') return 'HSN Mappings';
  if (tab === 'liability') return 'Liability Slabs';
  if (tab === 'tax') return 'Tax Calculator';
  return tab.charAt(0).toUpperCase() + tab.slice(1);
};

export default function GstPage() {
  const [tab, setTab] = useState<Tab>('config');
  const [period, setPeriod] = useState(currentPeriod());

  return (
    <PageFrame title="GST / Tax" subtitle="GST compliance, tax engine preview, and e-invoice aligned to backend contracts.">
      <div className="mb-6 flex flex-wrap gap-2">
        {(['config', 'summary', 'gstr1', 'hsn', 'liability', 'tax'] as Tab[]).map((value) => (
          <Button key={value} variant={tab === value ? 'primary' : 'secondary'} size="sm" onClick={() => setTab(value)}>
            {tabLabel(value)}
          </Button>
        ))}
      </div>

      {tab === 'config' ? <GstConfigTab /> : null}
      {tab === 'summary' ? <GstSummaryTab period={period} onPeriodChange={setPeriod} /> : null}
      {tab === 'gstr1' ? <GstGstr1Tab period={period} onPeriodChange={setPeriod} /> : null}
      {tab === 'hsn' ? <GstHsnTab /> : null}
      {tab === 'liability' ? <GstLiabilityTab period={period} onPeriodChange={setPeriod} /> : null}
      {tab === 'tax' ? <GstTaxCalculatorTab period={period} onPeriodChange={setPeriod} /> : null}
    </PageFrame>
  );
}
