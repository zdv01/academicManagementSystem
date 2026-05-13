import SearchInput from "./SearchInput";
import FilterSelect from "./FilterSelect";

import {
    FilterBarProps
} from "../../models/filterBar";

import {
    RotateCcw,
    Plus
} from "lucide-react";

export default function FilterBar({
    searchPlaceholder,
    searchValue,
    onSearchChange,
    onSearch,
    filters = [],
    clearButton,
    primaryButton
}: FilterBarProps) {

    return (
        <div
            className="
                bg-white
                border
                border-gray-200
                rounded-xl
                p-4
                flex
                flex-wrap
                gap-4
                items-center
            "
        >

            <div className="flex-1 min-w-[280px]">

                <SearchInput
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={onSearchChange}
                    onSearch={onSearch}
                />

            </div>

            {
                filters.map((filter) => (
                    <FilterSelect
                        key={filter.name}
                        filter={filter}
                    />
                ))
            }

            {
                clearButton && (
                    <button
                        onClick={clearButton.onClick}
                        className="
                            flex
                            items-center
                            gap-2
                            border
                            border-gray-300
                            px-4
                            py-2
                            rounded-lg
                            hover:bg-gray-100
                            transition-all
                        "
                    >
                        <RotateCcw size={16} />

                        {clearButton.label}
                    </button>
                )
            }

            {
                primaryButton && (
                    <button
                        onClick={primaryButton.onClick}
                        className="
                                    flex
                                    items-center
                                    gap-2
                                    bg-primary
                                    text-white
                                    px-4
                                    py-2
                                    rounded-lg
                                    hover:opacity-90
                                    transition-all
                                "
                                >
                        <Plus size={16} />

                        {primaryButton.label}
                    </button>
                )
            }

        </div>
    );
}