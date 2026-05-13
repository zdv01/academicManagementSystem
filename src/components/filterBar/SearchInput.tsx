import { Search } from "lucide-react";

interface Props {
    placeholder?: string;

    value?: string;

    onChange?: (value: string) => void;

    onSearch?: () => void;
}

export default function SearchInput({
    placeholder,
    value,
    onChange,
    onSearch
}: Props) {

    return (
        <div className="relative w-full">

            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                className="
                    w-full
                    border
                    border-gray-300
                    rounded-lg
                    px-4
                    py-2
                    pr-10
                    outline-none
                    focus:ring-2
                    focus:ring-green-500
                "
            />

            <button
                onClick={onSearch}
                className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-500
                    hover:text-gray-700
                "
            >
                <Search size={18} />
            </button>

        </div>
    );
}