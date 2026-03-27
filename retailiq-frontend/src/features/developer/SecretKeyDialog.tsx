import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';

export interface SecretKeyDialogProps {
  open: boolean;
  title?: string;
  secret: string;
  onCopySuccess: () => void;
  onCopyError: () => void;
  onClose: () => void;
}

export function SecretKeyDialog({ open, title, secret, onCopySuccess, onCopyError, onClose }: SecretKeyDialogProps) {
  const handleCopy = async () => {
    const trimmedSecret = secret.trim();

    try {
      if (!trimmedSecret) {
        throw new Error('Missing secret');
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(trimmedSecret);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = trimmedSecret;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        try {
          textarea.select();
          const copied = document.execCommand('copy');

          if (!copied) {
            throw new Error('Copy command failed');
          }
        } finally {
          document.body.removeChild(textarea);
        }
      }

      onCopySuccess();
    } catch {
      onCopyError();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>{title ?? 'API key secret'}</DialogTitle>
        <DialogDescription>Save this secret now. It will not be shown again.</DialogDescription>
        <div className="mt-4 space-y-4">
          <Input label="Client secret" value={secret} readOnly className="font-mono text-sm" />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void handleCopy()}>Copy secret</Button>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
