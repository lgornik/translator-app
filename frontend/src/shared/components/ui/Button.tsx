import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  /** Accessible label for screen readers */
  'aria-label'?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'btn--primary',
  secondary: 'btn--secondary',
  text: 'btn--text',
  danger: 'btn--danger',
};

const sizeClasses: Record<ButtonSize, string> = {
  small: 'btn--small',
  medium: '',
  large: 'btn--large',
};

/**
 * Reusable Button component with full accessibility support
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      fullWidth = false,
      loading = false,
      disabled,
      className,
      children,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'btn',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'btn--full-width',
          loading && 'btn--loading',
          className
        )}
        disabled={disabled || loading}
        aria-label={ariaLabel}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="btn__spinner" aria-hidden="true" />
            <span className="btn__text">{children}</span>
            <span className="sr-only">Åadowanie...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
