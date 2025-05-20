'use client';

import Select from 'react-select';
import { StylesConfig } from 'react-select';

interface Option {
    value: number;
    label: string;
}

interface MultiSelectProps {
    label: string;
    name: string;
    options: Option[];
    value: number[];
    onChange: (value: number[]) => void;
    error?: { message?: string };
    placeholder?: string;
}

const customStyles: StylesConfig<Option, true> = {
    control: (base, state) => ({
        ...base,
        minHeight: '42px',
        background: 'var(--select-bg, white)',
        borderColor: state.isFocused ? 'var(--select-focus-border, #6366f1)' : 'var(--select-border, #d1d5db)',
        boxShadow: state.isFocused ? '0 0 0 2px var(--select-focus-shadow, rgba(99, 102, 241, 0.2))' : 'none',
        '&:hover': {
            borderColor: 'var(--select-hover-border, #6366f1)'
        }
    }),
    menu: (base) => ({
        ...base,
        background: 'var(--select-bg, white)',
        border: '1px solid var(--select-border, #d1d5db)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
            ? 'var(--select-option-selected-bg, #6366f1)'
            : state.isFocused
            ? 'var(--select-option-focused-bg, #eef2ff)'
            : 'transparent',
        color: state.isSelected
            ? 'var(--select-option-selected-color, white)'
            : 'var(--select-option-color, #111827)',
        '&:hover': {
            backgroundColor: 'var(--select-option-hover-bg, #eef2ff)'
        }
    }),
    multiValue: (base) => ({
        ...base,
        backgroundColor: 'var(--select-multi-value-bg, #eef2ff)',
        borderRadius: '0.375rem'
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: 'var(--select-multi-value-color, #4f46e5)',
        fontSize: '0.875rem',
        padding: '0.25rem 0.5rem'
    }),
    multiValueRemove: (base, state) => ({
        ...base,
        color: 'var(--select-multi-value-remove-color, #4f46e5)',
        borderRadius: '0 0.375rem 0.375rem 0',
        '&:hover': {
            backgroundColor: 'var(--select-multi-value-remove-hover-bg, #e0e7ff)',
            color: 'var(--select-multi-value-remove-hover-color, #4338ca)'
        }
    }),
    placeholder: (base) => ({
        ...base,
        color: 'var(--select-placeholder-color, #6b7280)'
    }),
    singleValue: (base) => ({
        ...base,
        color: 'var(--select-value-color, #111827)'
    }),
    input: (base) => ({
        ...base,
        color: 'var(--select-input-color, #111827)'
    }),
    indicatorsContainer: (base) => ({
        ...base,
        color: 'var(--select-indicator-color, #6b7280)'
    }),
    indicatorSeparator: (base) => ({
        ...base,
        backgroundColor: 'var(--select-indicator-separator-color, #d1d5db)'
    })
};

export function MultiSelect({ 
    label, 
    name, 
    options, 
    value, 
    onChange, 
    error,
    placeholder = 'Выберите...'
}: MultiSelectProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
            </label>
            <Select<Option, true>
                isMulti
                name={name}
                options={options}
                styles={customStyles}
                classNamePrefix="react-select"
                placeholder={placeholder}
                value={options.filter(option => value?.includes(option.value))}
                onChange={(newValue) => onChange(newValue.map(option => option.value))}
            />
            {error && (
                <p className="mt-1 text-sm text-red-500">{error.message}</p>
            )}
        </div>
    );
} 