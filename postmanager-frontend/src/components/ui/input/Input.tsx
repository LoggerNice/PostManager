import { InputHTMLAttributes, forwardRef } from 'react';
import { FieldError } from 'react-hook-form';

interface IInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: FieldError;
}

export const Input = forwardRef<HTMLInputElement, IInputProps>(
    ({ label, error, className, ...rest }, ref) => {
        return (
            <div className="flex flex-col gap-1 w-full">
                {label && (
                    <label className="text-sm font-medium">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 ${
                        error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                    } ${className || ''}`}
                    {...rest}
                />
                {error && (
                    <span className="text-sm text-red-500 dark:text-red-400">
                        {error.message}
                    </span>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input'; 