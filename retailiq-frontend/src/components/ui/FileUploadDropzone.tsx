/**
 * src/components/ui/FileUploadDropzone.tsx
 * Oracle Document sections consumed: 3, 7, 9, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
interface FileUploadDropzoneProps {
  accept: string;
  label: string;
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  helperText?: string;
  error?: string | null;
}

export function FileUploadDropzone({ accept, label, onFileSelected, disabled, helperText, error }: FileUploadDropzoneProps) {
  return (
    <label className="card" style={{ display: 'grid', gap: '0.75rem', padding: '1.25rem' }}>
      <strong>{label}</strong>
      <span className="muted">{helperText ?? `Accepts ${accept}`}</span>
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFileSelected(file);
          }
        }}
      />
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </label>
  );
}
