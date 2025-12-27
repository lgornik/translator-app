import { cn } from '@/shared/utils';

interface LoadingProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Loading spinner component
 */
export function Loading({ text = 'Åadowanie...', size = 'medium', className }: LoadingProps) {
  return (
    <div className={cn('loading', `loading--${size}`, className)}>
      <div className="loading__spinner" />
      {text && <span className="loading__text">{text}</span>}
    </div>
  );
}
