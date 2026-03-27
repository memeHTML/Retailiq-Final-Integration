import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { routes } from './routes';

describe('route registry', () => {
  it('exposes canonical shell and auth paths', () => {
    expect(routes.login).toBe('/login');
    expect(routes.register).toBe('/register');
    expect(routes.verifyOtp).toBe('/verify-otp');
    expect(routes.mfa).toBe('/mfa');
    expect(routes.financeGst).toBe('/finance/gst');
    expect(routes.financeEinvoice).toBe('/finance/einvoice');
    expect(routes.marketIntelligence).toBe('/market-intelligence');
    expect(routes.pos).toBe('/pos');
    expect(routes.stockAudit).toBe('/inventory/stock-audit');
    expect(routes.inventoryReceipts).toBe('/inventory/receipts');
    expect(routes.inventoryBarcodes).toBe('/inventory/barcodes');
    expect(routes.inventoryVision).toBe('/inventory/vision');
    expect(routes.inventoryVisionReview).toBe('/inventory/vision/:jobId');
    expect(routes.receiptsQueue).toBe('/receipts/queue');
    expect(routes.visionOcr).toBe('/vision/ocr');
    expect(routes.marketplace).toBe('/orders/marketplace');
    expect(routes.chain).toBe('/operations/chain');
    expect(routes.storeProfile).toBe('/store/profile');
    expect(routes.financialCalendar).toBe('/financial-calendar');
    expect(routes.settingsI18n).toBe('/settings/i18n');
  });

  it('retains compatibility aliases for legacy routes', () => {
    expect(routes.authLogin).toBe('/auth/login');
    expect(routes.authRegister).toBe('/auth/register');
    expect(routes.authOtp).toBe('/auth/otp');
    expect(routes.mfaSetup).toBe('/mfa-setup');
    expect(routes.mfaVerify).toBe('/mfa-verify');
    expect(routes.gst).toBe('/gst');
    expect(routes.einvoice).toBe('/e-invoicing');
    expect(routes.receiptsTemplate).toBe('/receipts/template');
    expect(routes.inventoryReceipts).toBe('/inventory/receipts');
    expect(routes.inventoryBarcodes).toBe('/inventory/barcodes');
    expect(routes.inventoryVision).toBe('/inventory/vision');
    expect(routes.marketplaceLegacy).toBe('/marketplace');
    expect(routes.chainLegacy).toBe('/chain');
    expect(routes.operations).toBe('/operations');
    expect(routes.developer).toBe('/operations/developer');
    expect(routes.developerLegacy).toBe('/developer');
    expect(routes.kyc).toBe('/operations/kyc');
    expect(routes.kycLegacy).toBe('/kyc');
    expect(routes.team).toBe('/operations/team');
    expect(routes.teamLegacy).toBe('/team');
    expect(routes.ops).toBe('/operations/maintenance');
    expect(routes.opsLegacy).toBe('/ops');
    expect(routes.events).toBe('/events');
    expect(routes.i18n).toBe('/i18n');
  });

  it('does not hardcode canonical route strings in page navigation files', () => {
    const pageFiles = [
      'Login.tsx',
      'Register.tsx',
      'VerifyOtp.tsx',
      'MfaSetup.tsx',
      'VisionOcrUpload.tsx',
      'I18n.tsx',
      'FinancialCalendar.tsx',
      'Offline.tsx',
    ];
    const forbiddenPatterns = ['/dashboard', '/login', '/register', '/verify-otp', '/mfa-setup', '/mfa-verify', '/vision/ocr/'];
    const pageDir = join(process.cwd(), 'src', 'pages');

    pageFiles.forEach((file) => {
      const source = readFileSync(join(pageDir, file), 'utf8');
      forbiddenPatterns.forEach((pattern) => {
        expect(source).not.toContain(pattern);
      });
    });
  });
});
