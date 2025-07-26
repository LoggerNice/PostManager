import { ButtonHTMLAttributes, FC } from 'react';

interface IButton extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline';
}

export const Button: FC<IButton> = ({
    children,
    className = '',
    variant = 'primary',
    ...props
}) => {
    const baseStyles = 'w-full h-12 py-2 px-4 rounded-md transition-colors';
    const variantStyles = {
        primary: 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700',
        secondary: 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300',
        outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
    };

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}; 