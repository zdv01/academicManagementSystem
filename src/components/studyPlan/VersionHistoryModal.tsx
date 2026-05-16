import React from "react";

import { StudyPlan } from "../../models/StudyPlan";

interface Props {

    versions: StudyPlan[];

    onClose: () => void;

    onSelectVersion: (
        plan: StudyPlan
    ) => void;
}

const VersionHistoryModal: React.FC<Props> = ({
    versions,
    onClose,
    onSelectVersion
}) => {

    return (

        <div
            className="
                fixed
                inset-0
                bg-black/40
                flex
                justify-center
                items-center
                z-50
            "
        >

            <div
                className="
                    bg-white
                    rounded-xl
                    shadow-xl
                    w-[500px]
                    max-h-[80vh]
                    overflow-y-auto
                    p-6
                "
            >

                <div
                    className="
                        flex
                        justify-between
                        items-center
                        mb-4
                    "
                >

                    <h2 className="text-xl font-bold">
                        Historial de versiones
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-gray-500"
                    >
                        ✕
                    </button>

                </div>

                <div className="space-y-3">

                    {
                        versions
                            .sort((a, b) => b.year - a.year)
                            .map((version) => (

                            <button
                                key={version.id}

                                onClick={() =>
                                    onSelectVersion(version)
                                }

                                className="
                                    w-full
                                    border
                                    rounded-lg
                                    p-4
                                    text-left
                                    hover:bg-gray-50
                                "
                            >

                                <div
                                    className="
                                        flex
                                        justify-between
                                    "
                                >

                                    <div>

                                        <p className="font-semibold">
                                            {version.year}
                                        </p>

                                        <p
                                            className="
                                                text-sm
                                                text-gray-500
                                            "
                                        >
                                            {
                                                version.is_published
                                                ? "Publicado"
                                                : "Borrador"
                                            }
                                        </p>

                                    </div>

                                    <p
                                        className="
                                            text-sm
                                            text-gray-400
                                        "
                                    >
                                        {
                                            new Date(
                                                version.updated_at
                                            ).toLocaleDateString()
                                        }
                                    </p>

                                </div>

                            </button>
                        ))
                    }

                </div>

                <div className="mt-6 flex justify-end">

                    <button
                        onClick={onClose}

                        className="
                            bg-gray-200
                            hover:bg-gray-300
                            px-4
                            py-2
                            rounded
                        "
                    >
                        Ver todas las versiones
                    </button>

                </div>

            </div>

        </div>
    );
};

export default VersionHistoryModal;