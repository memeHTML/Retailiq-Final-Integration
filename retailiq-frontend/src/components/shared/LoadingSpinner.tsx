export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-6" aria-label="Loading">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
    </div>
  );
}

export default LoadingSpinner;
