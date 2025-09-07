export interface MultiSelectOption {
    value: number;
    label: string;
}

export interface CustomMultiSelectProps {
    label: string;
    name: string;
    options: MultiSelectOption[];
    value: number[];
    onChange: (value: number[]) => void;
    error?: string;
    placeholder?: string;
    disabled?: boolean;
    searchPlaceholder?: string;
    noOptionsMessage?: string;
    maxHeight?: number;
}
