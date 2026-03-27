/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SecretKeyDialog } from './SecretKeyDialog';

const clipboardWriteText = vi.fn().mockResolvedValue(undefined);
const execCommandMock = vi.fn().mockReturnValue(true);

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    value: execCommandMock,
  });
});

describe('SecretKeyDialog', () => {
  it('copies the secret through the clipboard API when available', async () => {
    Object.defineProperty(Navigator.prototype, 'clipboard', {
      configurable: true,
      get: () => ({ writeText: clipboardWriteText }),
    });
    const onCopySuccess = vi.fn();
    const onCopyError = vi.fn();

    render(
      <SecretKeyDialog
        open
        secret="client-secret-create"
        title="API key created"
        onCopySuccess={onCopySuccess}
        onCopyError={onCopyError}
        onClose={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /copy secret/i }));

    await waitFor(() => {
      expect(clipboardWriteText).toHaveBeenCalledWith('client-secret-create');
    });
    expect(execCommandMock).not.toHaveBeenCalled();
    expect(onCopySuccess).toHaveBeenCalledTimes(1);
    expect(onCopyError).not.toHaveBeenCalled();
  });

  it('falls back to execCommand when the clipboard API is unavailable', async () => {
    Object.defineProperty(Navigator.prototype, 'clipboard', {
      configurable: true,
      get: () => undefined,
    });
    const onCopySuccess = vi.fn();
    const onCopyError = vi.fn();

    render(
      <SecretKeyDialog
        open
        secret="client-secret-rotate"
        title="API key regenerated"
        onCopySuccess={onCopySuccess}
        onCopyError={onCopyError}
        onClose={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /copy secret/i }));

    await waitFor(() => {
      expect(execCommandMock).toHaveBeenCalledWith('copy');
    });
    expect(clipboardWriteText).not.toHaveBeenCalled();
    expect(onCopySuccess).toHaveBeenCalledTimes(1);
    expect(onCopyError).not.toHaveBeenCalled();
  });

  it('reports an error when the fallback copy command fails', async () => {
    Object.defineProperty(Navigator.prototype, 'clipboard', {
      configurable: true,
      get: () => undefined,
    });
    execCommandMock.mockReturnValueOnce(false);
    const onCopySuccess = vi.fn();
    const onCopyError = vi.fn();

    render(
      <SecretKeyDialog
        open
        secret="client-secret-failed"
        title="API key regenerated"
        onCopySuccess={onCopySuccess}
        onCopyError={onCopyError}
        onClose={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /copy secret/i }));

    await waitFor(() => {
      expect(onCopyError).toHaveBeenCalledTimes(1);
    });
    expect(onCopySuccess).not.toHaveBeenCalled();
  });
});
