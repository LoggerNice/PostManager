import { SelectHTMLAttributes, forwardRef } from 'react';
import { FieldError } from 'react-hook-form';

interface ISelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: FieldError;
    options: { value: string | number; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, ISelectProps>(
    ({ label, error, options, ...rest }, ref) => {
        return (
            <div className="flex flex-col gap-1 w-full">
                {label && (
                    <label className="text-sm font-medium">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        className={`appearance-none w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 ${
                            error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        {...rest}
                    >
                        <option value="">Выберите отдел</option>
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                    </div>
                </div>
                {error && (
                    <span className="text-sm text-red-500 dark:text-red-400">
                        {error.message}
                    </span>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select'; 