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
  title = 'WystÃ„â€¦piÃ…â€š bÃ…â€šÃ„â€¦d',
  message,
  onRetry,
  className,
}: ErrorMessageProps) {
  return (
    <div className={cn('error-message', className)}>
      <div className="error-message__icon">Ã¢Å¡Â Ã¯Â¸Â</div>
      <h3 className="error-message__title">{title}</h3>
      <p className="error-message__text">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          SprÃƒÂ³buj ponownie
        </Button>
      )}
    </div>
  );
}
