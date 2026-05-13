import FormField from "./FormField";
import InfoMessage from "./InfoMessage";
import SectionTabs from "./SectionTabs";

import {
    UserFormCardProps
} from "../../models/props/userFormCard";

export default function UserFormCard({
    title,
    sections,
    activeSection,
    onSectionChange,
    fields,
    infoMessage,
    buttons
}: UserFormCardProps) {

    return (
        <div
            className="
                bg-white
                rounded-2xl
                shadow-md
                p-6
                w-full
                max-w-2xl
            "
        >

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                    {title}
                </h2>
            </div>

            <SectionTabs
                sections={sections}
                activeSection={activeSection}
                onSectionChange={onSectionChange}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {
                    fields.map((field) => (
                        <FormField
                            key={field.name}
                            field={field}
                        />
                    ))
                }

            </div>

            {
                infoMessage && (
                    <div className="mt-6">
                        <InfoMessage message={infoMessage} />
                    </div>
                )
            }

            <div className="flex justify-end gap-3 mt-6">

                {
                    buttons.map((button) => {

                        const isPrimary =
                            button.variant === "primary";

                        return (
                            <button
                                key={button.label}
                                onClick={button.onClick}
                                className={`
                                    px-5
                                    py-2
                                    rounded-lg
                                    font-medium
                                    transition-all
                                    ${isPrimary
                                        ? "bg-primary text-white hover:bg-green"
                                        : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                                    }
                                `}
                            >
                                {button.label}
                            </button>
                        );
                    })
                }

            </div>
        </div>
    );
}