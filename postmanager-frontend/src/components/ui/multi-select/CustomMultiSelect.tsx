'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CustomMultiSelectProps } from '@/types/multiselect';

export function CustomMultiSelect({
    label,
    name,
    options,
    value,
    onChange,
    error,
    placeholder = 'Выберите...',
    disabled = false,
    searchPlaceholder = 'Поиск...',
    noOptionsMessage = 'Ничего не найдено',
    maxHeight = 200
}: CustomMultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Получаем выбранные опции
    const selectedOptions = useMemo(() => {
        return options.filter(option => value.includes(option.value));
    }, [options, value]);

    // Фильтруем опции по поисковому запросу и исключаем уже выбранные
    const filteredOptions = useMemo(() => {
        // Сначала исключаем уже выбранные опции
        const unselectedOptions = options.filter(option => !value.includes(option.value));
        
        // Затем фильтруем по поисковому запросу
        if (!searchTerm.trim()) return unselectedOptions;
        
        return unselectedOptions.filter(option =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm, value]);

    // Обработчик клика вне компонента
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const isClickOnContainer = containerRef.current && containerRef.current.contains(target);
            const isClickOnDropdown = dropdownRef.current && dropdownRef.current.contains(target);
            
            if (!isClickOnContainer && !isClickOnDropdown) {
                setIsOpen(false);
                setSearchTerm('');
                setIsSearching(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Фокус на поле ввода при открытии
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Расчет позиции выпадающего списка
    const updateDropdownPosition = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    // Обновляем позицию при открытии
    useEffect(() => {
        if (isOpen) {
            updateDropdownPosition();
            // Обновляем позицию при скролле или изменении размера окна
            const handleUpdatePosition = () => updateDropdownPosition();
            window.addEventListener('scroll', handleUpdatePosition);
            window.addEventListener('resize', handleUpdatePosition);
            
            return () => {
                window.removeEventListener('scroll', handleUpdatePosition);
                window.removeEventListener('resize', handleUpdatePosition);
            };
        }
    }, [isOpen]);

    // Обработчик изменения значения
    const handleToggleOption = (optionValue: number) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        
        onChange(newValue);
        // Очищаем поле ввода после выбора
        setSearchTerm('');
        // Автоматически закрываем выпадающее меню
        setIsOpen(false);
        setIsSearching(false);
    };

    // Обработчик удаления выбранного элемента
    const handleRemoveOption = (optionValue: number) => {
        const newValue = value.filter(v => v !== optionValue);
        onChange(newValue);
    };

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Лейбл */}
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
            </label>

            {/* Основной контейнер */}
            <div
                className={`
                    relative min-h-[42px] border rounded-md cursor-pointer
                    ${disabled 
                        ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 opacity-60 cursor-not-allowed' 
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }
                    ${isOpen ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800' : ''}
                    ${error ? 'border-red-500 dark:border-red-400' : ''}
                `}
                onClick={() => {
                    if (!disabled) {
                        setIsOpen(!isOpen);
                        setIsSearching(!isSearching);
                        // Фокус на поле ввода после небольшой задержки для корректного рендеринга
                        setTimeout(() => {
                            if (inputRef.current) {
                                inputRef.current.focus();
                            }
                        }, 0);
                    }
                }}
            >
                {/* Выбранные элементы и поле поиска */}
                <div className="flex flex-wrap items-center gap-1 p-2 min-h-[38px]">
                    {selectedOptions.map(option => (
                        <span
                            key={option.value}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-md"
                        >
                            {option.label}
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveOption(option.value);
                                    }}
                                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                                    aria-label={`Удалить ${option.label}`}
                                >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </span>
                    ))}
                    
                    {/* Поле поиска */}
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={selectedOptions.length === 0 ? placeholder : ''}
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (!isOpen) {
                                setIsOpen(true);
                                setIsSearching(true);
                            }
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                            setIsSearching(!isSearching);
                        }}
                        className={`
                            flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm
                            ${selectedOptions.length === 0 && !isSearching ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}
                            placeholder-gray-500 dark:placeholder-gray-400
                        `}
                        disabled={disabled}
                    />
                </div>

                {/* Стрелка */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg 
                        className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Выпадающий список через портал */}
            {isOpen && !disabled && typeof window !== 'undefined' && createPortal(
                <div 
                    ref={dropdownRef}
                    className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg"
                    style={{
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width
                    }}
                >
                    {/* Список опций */}
                    <div 
                        className="max-h-[200px] overflow-y-auto"
                        style={{ maxHeight: `${maxHeight}px` }}
                    >
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => {
                                const isSelected = value.includes(option.value);
                                
                                return (
                                    <div
                                        key={option.value}
                                        className={`
                                            px-3 py-2 text-sm cursor-pointer flex items-center justify-between
                                            ${isSelected ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
                                        `}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleOption(option.value);
                                        }}
                                    >
                                        <span>{option.label}</span>
                                        {isSelected && (
                                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                {noOptionsMessage}
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}

            {/* Сообщение об ошибке */}
            {error && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}
