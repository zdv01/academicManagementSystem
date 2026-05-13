interface Props {
    sections: string[];

    activeSection: string;

    onSectionChange?: (section: string) => void;
}

export default function SectionTabs({
    sections,
    activeSection,
    onSectionChange
}: Props) {

    return (
        <div className="flex border-b border-gray-200 mb-6">
            {
                sections.map((section) => {

                    const active = section === activeSection;

                    return (
                        <button
                            key={section}
                            onClick={() => onSectionChange?.(section)}
                            className={`
                                px-4
                                py-3
                                text-sm
                                font-medium
                                border-b-2
                                transition-all
                                ${active
                                    ? "border-green-600 text-green-600"
                                    : "border-transparent text-gray-500"
                                }
                            `}
                        >
                            {section}
                        </button>
                    );
                })
            }
        </div>
    );
}