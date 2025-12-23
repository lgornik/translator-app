import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/utils';

export type InputState = 'default' | 'correct' | 'incorrect';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  state?: InputState;
  fullWidth?: boolean;
}

const stateClasses: Record<InputState, string> = {
  default: '',
  correct: 'input--correct',
  incorrect: 'input--incorrect',
};

/**
 * Reusable Input component
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      state = 'default',
      fullWidth = true,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

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
          {...props}
        />
        {error && <span className="input-group__error">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
