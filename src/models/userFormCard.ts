export interface FieldOption {
    label: string;
    value: string;
}

export interface Field {
    name: string;
    label: string;

    type: "text" | "password" | "select";

    placeholder?: string;

    required?: boolean;

    options?: FieldOption[];

    value?: string;

    onChange?: (value: string) => void;
}

export interface ActionButton {
    label: string;

    variant?: "primary" | "secondary";

    onClick: () => void;
}

export interface UserFormCardProps {
    title: string;

    sections: string[];

    activeSection: string;

    onSectionChange?: (section: string) => void;

    fields: Field[];

    infoMessage?: string;

    buttons: ActionButton[];
}