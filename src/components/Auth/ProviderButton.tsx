import React from "react";

interface ProviderButtonProps {
    icon: React.ReactNode;
    label: string;
    action: () => void | Promise<void>;
    disabled?: boolean;
}

const ProviderButton: React.FC<ProviderButtonProps> = ({
    icon,
    label,
    action,
    disabled = false,
}) => {
    return (
        <button
        type="button"
        onClick={action}
        disabled={disabled}
        className="
            flex w-full items-center justify-center gap-3.5
            rounded-lg border border-stroke bg-gray p-4
            hover:bg-opacity-50
            disabled:cursor-not-allowed disabled:opacity-60
            dark:border-strokedark dark:bg-meta-4 dark:hover:bg-opacity-50
        "
        >
        <span className="flex items-center justify-center">
            {icon}
        </span>

        <span className="font-medium text-black dark:text-white">
            {label}
        </span>
        </button>
    );
};

export default ProviderButton;