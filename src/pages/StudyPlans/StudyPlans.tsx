import React, { useEffect, useMemo, useState } from "react";

import Swal from "sweetalert2";

import FilterBar from "../../components/filterBar/FilterBar";
import GenericTable from "../../components/GenericTable";

import DetailCard from
"../../components/detailCard/DetailCard";

import VersionHistoryModal from
"../../components/studyPlan/VersionHistoryModal";

import UserFormCard from
"../../components/userFormCard/UserFormCard";

import { StudyPlan } from "../../models/StudyPlan";
import { Subject } from "../../models/Subject";

import { studyPlanService }
from "../../services/studyPlanService";

import { subjectService }
from "../../services/subjectService";

const StudyPlanPage: React.FC = () => {

    const [studyPlans, setStudyPlans] =
        useState<StudyPlan[]>([]);

    const [subjects, setSubjects] =
        useState<Subject[]>([]);

    const [planSubjects, setPlanSubjects] =
        useState<Subject[]>([]);

    const [selectedPlan, setSelectedPlan] =
        useState<StudyPlan | null>(null);

    const [careerFilter, setCareerFilter] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [showVersions, setShowVersions] =
        useState(false);

    // FORM STATES
    const [showStudyPlanForm, setShowStudyPlanForm] =
        useState(false);

    const [studyPlanFormMode, setStudyPlanFormMode] =
        useState<
            "add-subject"
            | "edit-subject"
            | "publish-version"
            | null
        >(null);

    const [selectedPlanSubject, setSelectedPlanSubject] =
        useState<Subject | null>(null);

    const [studyPlanFormData, setStudyPlanFormData] =
        useState({
            subjectId: "",
            suggestedSemester: "",
            credits: "",
            year: "",
        });

    useEffect(() => {

        fetchData();

    }, []);

    const fetchData = async () => {

        const plans =
            await studyPlanService.getStudyPlans();

        const allSubjects =
            await subjectService.getSubjects();

        setStudyPlans(plans);

        setSubjects(allSubjects);

        if (plans.length > 0) {

            const activePlan =
                plans
                    .sort((a, b) => b.year - a.year)[0];

            setSelectedPlan(activePlan);

            fetchPlanSubjects(activePlan.id);
        }
    };

    const fetchPlanSubjects = async (
        studyPlanId: string
    ) => {

        const data =
            await studyPlanService
                .getStudyPlanSubjects(studyPlanId);

        setPlanSubjects(data);
    };

    // =========================
    // FORM HANDLERS
    // =========================

    const handleOpenAddSubject = () => {

        setStudyPlanFormMode("add-subject");

        setSelectedPlanSubject(null);

        setStudyPlanFormData({
            subjectId: "",
            suggestedSemester:
                selectedPlan?.suggested_semester.toString() || "1",
            credits: "",
            year: "",
        });

        setShowStudyPlanForm(true);
    };

    const handleOpenEditSubject = (
        subject: Subject
    ) => {

        setStudyPlanFormMode("edit-subject");

        setSelectedPlanSubject(subject);

        setStudyPlanFormData({
            subjectId: subject.id,

            suggestedSemester:
                selectedPlan?.suggested_semester
                    ?.toString() || "1",

            credits:
                subject.credits.toString(),

            year: "",
        });

        setShowStudyPlanForm(true);
    };

    const handleOpenPublishVersion = () => {

        setStudyPlanFormMode("publish-version");

        setSelectedPlanSubject(null);

        setStudyPlanFormData({
            subjectId: "",
            suggestedSemester: "",
            credits: "",

            year:
                (
                    selectedPlan?.year
                    ? selectedPlan.year + 1
                    : new Date().getFullYear()
                ).toString(),
        });

        setShowStudyPlanForm(true);
    };

    // =========================
    // PLAN HANDLERS
    // =========================

    const handleChangePlan = async (
        year: string
    ) => {

        const plan =
            studyPlans.find(
                (p) => p.year.toString() === year
            );

        if (!plan) return;

        setSelectedPlan(plan);

        fetchPlanSubjects(plan.id);
    };

    const handleAddSubject = async (
        subjectId: string
    ) => {

        if (!selectedPlan) return;

        const result =
            await studyPlanService
                .linkSubjectToStudyPlan(
                    selectedPlan.id,
                    subjectId
                );

        if (result) {

            Swal.fire(
                "Éxito",
                "Asignatura agregada correctamente",
                "success"
            );

            fetchPlanSubjects(selectedPlan.id);

        } else {

            Swal.fire(
                "Error",
                "No se pudo agregar la asignatura",
                "error"
            );
        }
    };

    const handleEditSubject = async () => {

        if (
            !selectedPlan ||
            !selectedPlanSubject
        ) return;

        // como no existe endpoint update subject-plan,
        // hacemos unlink + link

        const removed =
            await studyPlanService
                .unlinkSubjectFromStudyPlan(
                    selectedPlan.id,
                    selectedPlanSubject.id
                );

        if (!removed) {

            Swal.fire(
                "Error",
                "No se pudo actualizar",
                "error"
            );

            return;
        }

        const added =
            await studyPlanService
                .linkSubjectToStudyPlan(
                    selectedPlan.id,
                    studyPlanFormData.subjectId
                );

        if (added) {

            Swal.fire(
                "Éxito",
                "Asignatura actualizada",
                "success"
            );

            fetchPlanSubjects(selectedPlan.id);

        } else {

            Swal.fire(
                "Error",
                "No se pudo actualizar",
                "error"
            );
        }
    };

    const handleRemoveSubject = async (
        subject: Subject
    ) => {

        if (!selectedPlan) return;

        Swal.fire({
            title: "¿Eliminar asignatura?",
            text: "No se podrá recuperar",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Eliminar"
        }).then(async (result) => {

            if (result.isConfirmed) {

                const deleted =
                    await studyPlanService
                        .unlinkSubjectFromStudyPlan(
                            selectedPlan.id,
                            subject.id
                        );

                if (deleted) {

                    Swal.fire(
                        "Eliminada",
                        "Asignatura removida",
                        "success"
                    );

                    fetchPlanSubjects(selectedPlan.id);

                } else {

                    Swal.fire(
                        "Error",
                        "No se pudo eliminar",
                        "error"
                    );
                }
            }
        });
    };

    // =========================
    // MEMOS
    // =========================

    const availableSubjects = useMemo(() => {

        return subjects.filter((subject) => {

            const alreadyExists =
                planSubjects.some(
                    (ps) => ps.id === subject.id
                );

            const matchesSearch =
                subject.name
                    .toLowerCase()
                    .includes(search.toLowerCase())

                ||

                subject.code
                    .toLowerCase()
                    .includes(search.toLowerCase());

            return !alreadyExists && matchesSearch;
        });

    }, [subjects, planSubjects, search]);

    const totalCredits = useMemo(() => {

        return planSubjects.reduce(
            (acc, curr) => acc + curr.credits,
            0
        );

    }, [planSubjects]);

    return (

        <div className="space-y-4">

            <h1 className="text-2xl font-bold">
                Plan de estudios
            </h1>

            <FilterBar

                searchPlaceholder=
                "Buscar asignatura..."

                searchValue={search}

                onSearchChange={setSearch}

                filters={[

                    {
                        name: "career",
                        placeholder: "Carrera",
                        value: careerFilter,
                        onChange: setCareerFilter,
                        options: [
                            {
                                label:
                                "Ingeniería de Sistemas",
                                value: "systems"
                            }
                        ]
                    },

                    {
                        name: "version",
                        placeholder: "Versión activa",

                        value:
                            selectedPlan?.year.toString() || "",

                        onChange: handleChangePlan,

                        options:
                            studyPlans.map((plan) => ({
                                label:
                                    plan.year.toString(),

                                value:
                                    plan.year.toString()
                            }))
                    }
                ]}

                clearButton={{
                    label: "Historial",
                    onClick: () =>
                        setShowVersions(true)
                }}

                primaryButton={{
                    label: "Nueva versión",
                    onClick: handleOpenPublishVersion
                }}
            />

            <div
                className="
                    grid
                    grid-cols-12
                    gap-4
                "
            >

                {/* CATALOGO */}

                <div
                    className="
                        col-span-3
                        bg-white
                        rounded-xl
                        shadow
                        p-4
                    "
                >

                    <h2 className="font-semibold mb-4">
                        Catálogo de asignaturas
                    </h2>

                    <div className="space-y-2">

                        {
                            availableSubjects.map(
                                (subject) => (

                                <div
                                    key={subject.id}

                                    className="
                                        border
                                        rounded-lg
                                        p-3
                                        flex
                                        justify-between
                                        items-center
                                    "
                                >

                                    <div>

                                        <p className="font-medium">
                                            {subject.code}
                                        </p>

                                        <p
                                            className="
                                                text-sm
                                                text-gray-500
                                            "
                                        >
                                            {subject.name}
                                        </p>

                                        <p
                                            className="
                                                text-xs
                                                text-gray-400
                                            "
                                        >
                                            Créditos:
                                            {" "}
                                            {subject.credits}
                                        </p>

                                    </div>

                                    <button
                                        onClick={() =>
                                            handleAddSubject(subject.id)
                                        }

                                        className="
                                            bg-green-600
                                            hover:bg-green-700
                                            text-white
                                            px-3
                                            py-1
                                            rounded
                                        "
                                    >
                                        +
                                    </button>

                                </div>
                            ))
                        }

                    </div>

                </div>

                {/* TABLA */}

                <div
                    className="
                        col-span-6
                        bg-white
                        rounded-xl
                        shadow
                        p-4
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

                        <h2 className="font-semibold">
                            {selectedPlan?.name}
                        </h2>

                        <span
                            className="
                                text-sm
                                px-2
                                py-1
                                rounded-full
                                bg-green-100
                                text-green-700
                            "
                        >
                            {
                                selectedPlan?.is_published
                                    ? "Publicado"
                                    : "Borrador"
                            }
                        </span>

                    </div>

                    <div
                        className="
                            flex
                            justify-end
                            mb-4
                        "
                    >

                        <button
                            onClick={handleOpenAddSubject}

                            className="
                                bg-primary
                                text-white
                                px-4
                                py-2
                                rounded-lg
                                text-sm
                            "
                        >
                            + Agregar asignatura
                        </button>

                    </div>

                    <GenericTable
                        data={planSubjects}

                        columns={[
                            "code",
                            "name",
                            "credits"
                        ]}

                        actions={[
                            {
                                name: "edit",
                                label: "Edit"
                            },
                            {
                                name: "remove",
                                label: "Remove"
                            }
                        ]}

                        onAction={(action, item) => {

                            if (action === "remove") {

                                handleRemoveSubject(
                                    item as Subject
                                );
                            }

                            if (action === "edit") {

                                handleOpenEditSubject(
                                    item as Subject
                                );
                            }
                        }}

                        pageSize={6}
                    />

                </div>

                {/* PANEL DERECHO */}

                <div className="col-span-3">

                    <DetailCard
                        title="Detalles del plan"

                        details={[
                            {
                                label: "Nombre",
                                value: selectedPlan?.name
                            },

                            {
                                label: "Año",
                                value: selectedPlan?.year
                            },

                            {
                                label: "Estado",
                                value:
                                    selectedPlan?.is_published
                                        ? "Publicado"
                                        : "Borrador"
                            },

                            {
                                label: "Total asignaturas",
                                value: planSubjects.length
                            },

                            {
                                label: "Total créditos",
                                value: totalCredits
                            },

                            {
                                label: "Actualizado",
                                value:
                                    selectedPlan?.updated_at
                                        ? new Date(
                                            selectedPlan.updated_at
                                        ).toLocaleDateString()
                                        : "-"
                            }
                        ]}
                    />

                </div>

            </div>

            {/* VERSIONES */}

            {
                showVersions && (

                    <VersionHistoryModal

                        versions={studyPlans}

                        onClose={() =>
                            setShowVersions(false)
                        }

                        onSelectVersion={(plan) => {

                            setSelectedPlan(plan);

                            fetchPlanSubjects(plan.id);

                            setShowVersions(false);
                        }}
                    />
                )
            }

            {/* FORM */}

            {
                showStudyPlanForm && (

                    <div
                        className="
                            fixed
                            inset-0
                            bg-black/40
                            flex
                            items-center
                            justify-center
                            z-50
                            p-4
                        "
                    >

                        <UserFormCard

                            title={
                                studyPlanFormMode === "add-subject"
                                    ? "Agregar asignatura"

                                : studyPlanFormMode === "edit-subject"
                                    ? "Editar asignatura"

                                : "Publicar nueva versión"
                            }

                            sections={["Información"]}

                            activeSection="Información"

                            onSectionChange={() => {}}

                            fields={

                                studyPlanFormMode ===
                                "publish-version"

                                ? [

                                    {
                                        name: "year",
                                        label: "Año",
                                        type: "number",

                                        required: true,

                                        value:
                                            studyPlanFormData.year,

                                        onChange: (value) =>
                                            setStudyPlanFormData({
                                                ...studyPlanFormData,
                                                year: value
                                            })
                                    }

                                ]

                                : [

                                    {
                                        name: "subjectId",
                                        label: "Asignatura",
                                        type: "select",

                                        value:
                                            studyPlanFormData.subjectId,

                                        onChange: (value) => {

                                            const subject =
                                                subjects.find(
                                                    (s) =>
                                                        s.id === value
                                                );

                                            setStudyPlanFormData({
                                                ...studyPlanFormData,

                                                subjectId: value,

                                                credits:
                                                    subject?.credits
                                                        .toString()
                                                    || ""
                                            });
                                        },

                                        options:

                                            (
                                                studyPlanFormMode
                                                === "edit-subject"

                                                    ? subjects

                                                    : availableSubjects
                                            )

                                            .map((subject) => ({

                                                label:
                                                    `${subject.code} - ${subject.name} (${subject.credits} créditos)`,

                                                value:
                                                    subject.id
                                            }))
                                    },

                                    {
                                        name:
                                            "suggestedSemester",

                                        label:
                                            "Semestre sugerido",

                                        type: "select",

                                        value:
                                            studyPlanFormData
                                                .suggestedSemester,

                                        onChange: (value) =>
                                            setStudyPlanFormData({
                                                ...studyPlanFormData,
                                                suggestedSemester: value
                                            }),

                                        options:
                                            Array.from(
                                                { length: 10 },
                                                (_, i) => ({
                                                    label:
                                                        `${i + 1}`,

                                                    value:
                                                        `${i + 1}`
                                                })
                                            )
                                    },

                                    {
                                        name: "credits",
                                        label: "Créditos",
                                        type: "number",

                                        value:
                                            studyPlanFormData.credits,

                                        onChange: (value) =>
                                            setStudyPlanFormData({
                                                ...studyPlanFormData,
                                                credits: value
                                            })
                                    }
                                ]
                            }

                            infoMessage={

                                studyPlanFormMode ===
                                "publish-version"

                                ? "Se creará una nueva versión del plan."

                                : "Configure la asignatura del plan."
                            }

                            buttons={[

                                {
                                    label: "Cancelar",

                                    variant: "secondary",

                                    onClick: () =>
                                        setShowStudyPlanForm(false)
                                },

                                {
                                    label:

                                        studyPlanFormMode ===
                                        "add-subject"

                                            ? "Agregar"

                                        : studyPlanFormMode ===
                                        "edit-subject"

                                            ? "Guardar cambios"

                                        : "Publicar",

                                    variant: "primary",

                                    onClick: async () => {

                                        // ADD SUBJECT
                                        if (
                                            studyPlanFormMode ===
                                            "add-subject"
                                        ) {

                                            await handleAddSubject(
                                                studyPlanFormData
                                                    .subjectId
                                            );

                                            setShowStudyPlanForm(false);
                                        }

                                        // EDIT SUBJECT
                                        if (
                                            studyPlanFormMode ===
                                            "edit-subject"
                                        ) {

                                            await handleEditSubject();

                                            setShowStudyPlanForm(false);
                                        }

                                        // PUBLISH VERSION
                                        if (
                                            studyPlanFormMode ===
                                            "publish-version"
                                        ) {

                                            if (!selectedPlan) return;

                                            await studyPlanService
                                                .createStudyPlan({

                                                    career_id:
                                                        selectedPlan.career_id,

                                                    name:
                                                        `${selectedPlan.name}`,

                                                    year:
                                                        Number(
                                                            studyPlanFormData.year
                                                        ),

                                                    suggested_semester: 1,

                                                    is_published: true
                                                });

                                            Swal.fire(
                                                "Éxito",
                                                "Nueva versión publicada",
                                                "success"
                                            );

                                            fetchData();

                                            setShowStudyPlanForm(false);
                                        }
                                    }
                                }
                            ]}
                        />

                    </div>
                )
            }

        </div>
    );
};

export default StudyPlanPage;