import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/shared/utils';

export type InputState = 'default' | 'correct' | 'incorrect';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  state?: InputState;
  fullWidth?: boolean;
  /** Helper text shown below input */
  helperText?: string;
}

const stateClasses: Record<InputState, string> = {
  default: '',
  correct: 'input--correct',
  incorrect: 'input--incorrect',
};

/**
 * Reusable Input component with full accessibility support
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      state = 'default',
      fullWidth = true,
      helperText,
      className,
      id,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // Build aria-describedby from error, helper text, and any passed value
    const describedByParts: string[] = [];
    if (error) describedByParts.push(errorId);
    if (helperText && !error) describedByParts.push(helperId);
    if (ariaDescribedBy) describedByParts.push(ariaDescribedBy);
    const describedBy = describedByParts.length > 0 ? describedByParts.join(' ') : undefined;

    return (
      <div className={cn('input-group', fullWidth && 'input-group--full-width')}>
        {label && (
          <label className="input-group__label" htmlFor={inputId}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'input-group__input',
            stateClasses[state],
            error && 'input-group__input--error',
            className
          )}
          aria-invalid={!!error || state === 'incorrect'}
          aria-describedby={describedBy}
          {...props}
        />
        {error && (
          <span 
            id={errorId} 
            className="input-group__error" 
            role="alert"
            aria-live="polite"
          >
            {error}
          </span>
        )}
        {helperText && !error && (
          <span id={helperId} className="input-group__helper">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
