import { SelectFilter } from "../../models/filterBar";

interface Props {
    filter: SelectFilter;
}

export default function FilterSelect({
    filter
}: Props) {

    return (
        <select
            value={filter.value}
            onChange={(e) => filter.onChange?.(e.target.value)}
            className="
                border
                border-gray-300
                rounded-lg
                px-4
                py-2
                min-w-[180px]
                outline-none
                focus:ring-2
                focus:ring-green-500
            "
        >

            <option value="">
                {filter.placeholder || "Seleccione"}
            </option>

            {
                filter.options.map((option) => (
                    <option
                        key={option.value}
                        value={option.value}
                    >
                        {option.label}
                    </option>
                ))
            }

        </select>
    );
}