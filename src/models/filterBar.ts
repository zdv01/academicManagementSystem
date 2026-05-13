export interface SelectOption {
    label: string;
    value: string;
}

export interface SelectFilter {
    name: string;

    placeholder?: string;

    value?: string;

    options: SelectOption[];

    onChange?: (value: string) => void;
}

export interface ActionButton {
    label: string;

    variant?: "primary" | "secondary";

    onClick: () => void;
}

export interface FilterBarProps {

    searchPlaceholder?: string;

    searchValue?: string;

    onSearchChange?: (value: string) => void;

    onSearch?: () => void;

    filters?: SelectFilter[];

    clearButton?: ActionButton;

    primaryButton?: ActionButton;
}