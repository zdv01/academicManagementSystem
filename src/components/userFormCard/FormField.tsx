import { Field } from "../../models/userFormCard";

interface Props {
    field: Field;
}

export default function FormField({ field }: Props) {

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
                {field.label}

                {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                )}
            </label>

            {
                field.type === "select" ? (
                    <select
                        className="
                            border
                            border-gray-300
                            rounded-lg
                            px-3
                            py-2
                            outline-none
                            focus:ring-2
                            focus:ring-green-500
                        "
                        value={field.value}
                        onChange={(e) => field.onChange?.(e.target.value)}
                    >
                        <option value="">
                            Seleccione una opción
                        </option>

                        {
                            field.options?.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </option>
                            ))
                        }
                    </select>
                ) : (
                    <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={field.value}
                        onChange={(e) => field.onChange?.(e.target.value)}
                        className="
                            border
                            border-gray-300
                            rounded-lg
                            px-3
                            py-2
                            outline-none
                            focus:ring-2
                            focus:ring-green-500
                        "
                    />
                )
            }
        </div>
    );
}