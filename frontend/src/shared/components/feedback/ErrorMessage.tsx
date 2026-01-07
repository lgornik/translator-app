import { cn } from '@/shared/utils';
import { Button } from '../ui/Button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Error message component
 */
export function ErrorMessage({
  title = 'Wystąpił błąd',
  message,
  onRetry,
  className,
}: ErrorMessageProps) {
  return (
    <div className={cn('error-message', className)}>
      <div className="error-message__icon">⚠️</div>
      <h3 className="error-message__title">{title}</h3>
      <p className="error-message__text">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Spróbuj ponownie
        </Button>
      )}
    </div>
  );
}