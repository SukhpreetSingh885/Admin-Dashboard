export function LoadingState({ label = 'Loading records…' }: { label?: string }) {
  return <div className="loading-state"><span className="spinner" /><p>{label}</p></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="error-state"><div>!</div><h3>We couldn’t load this view</h3><p>{message}</p>{onRetry && <button className="button secondary" onClick={onRetry}>Try again</button>}</div>;
}
