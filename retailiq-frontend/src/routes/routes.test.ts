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
    expect(routes.receiptsQueue).toBe('/receipts/queue');
    expect(routes.visionOcr).toBe('/vision/ocr');
    expect(routes.storeProfile).toBe('/store/profile');
  });

  it('retains compatibility aliases for legacy routes', () => {
    expect(routes.authLogin).toBe('/auth/login');
    expect(routes.authRegister).toBe('/auth/register');
    expect(routes.authOtp).toBe('/auth/otp');
    expect(routes.mfaSetup).toBe('/mfa-setup');
    expect(routes.mfaVerify).toBe('/mfa-verify');
    expect(routes.gst).toBe('/gst');
    expect(routes.einvoice).toBe('/e-invoicing');
  });

  it('does not hardcode canonical route strings in page navigation files', () => {
    const pageFiles = ['Login.tsx', 'Register.tsx', 'VerifyOtp.tsx', 'MfaSetup.tsx', 'VisionOcrUpload.tsx'];
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
