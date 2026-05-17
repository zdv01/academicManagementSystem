import React, { useEffect, useState } from "react";

import Swal from "sweetalert2";

import GenericTable from "../../components/GenericTable";
import FilterBar from "../../components/filterBar/FilterBar";
import UserFormCard from "../../components/userFormCard/UserFormCard";
import DetailCard from "../../components/detailCard/DetailCard";

import { Subject } from "../../models/Subject";

import { CreateSubjectRequest } from "../../models/dto/createSubjectRequest";
import { UpdateSubjectRequest } from "../../models/dto/updateSubjectRequest";

import { subjectService } from "../../services/subjectService";

const Subjects: React.FC = () => {

    const [data, setData] = useState<Subject[]>([]);

    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] = useState("");

    const [creditsFilter, setCreditsFilter] = useState("");

    const [showForm, setShowForm] = useState(false);

    const [selectedSubject, setSelectedSubject] =
        useState<Subject | null>(null);

    const [formData, setFormData] = useState({
        code: "",
        name: "",
        description: "",
        credits: "",
        is_active: true,
    });

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {

        const res = await subjectService.getSubjects();

        setData(res);

        // selecciona el primero automáticamente
        if (res.length > 0 && !selectedSubject) {

            setSelectedSubject(res[0]);
        }
    };

    const handleCreate = () => {

        setSelectedSubject(null);

        setFormData({
            code: "",
            name: "",
            description: "",
            credits: "",
            is_active: true,
        });

        setShowForm(true);
    };

    const handleAction = (
        action: string,
        item: Subject
    ) => {

        if (action === "edit") {

            setSelectedSubject(item);

            setFormData({
                code: item.code,
                name: item.name,
                description: item.description ?? "",
                credits: item.credits.toString(),
                is_active: item.is_active,
            });

            setShowForm(true);
        }

        if (action === "archive") {

            Swal.fire({
                title: "¿Archivar asignatura?",
                text:
                    "La asignatura quedará inactiva.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, archivar",
                cancelButtonText: "Cancelar",
            }).then(async (result) => {

                if (result.isConfirmed) {

                    const payload: UpdateSubjectRequest = {
                        code: item.code,
                        name: item.name,
                        description: item.description,
                        credits: item.credits,
                        is_active: false,
                    };

                    const updated =
                        await subjectService.updateSubject(
                            item.id,
                            payload
                        );

                    if (updated) {

                        Swal.fire(
                            "Archivada",
                            "La asignatura fue archivada correctamente.",
                            "success"
                        );

                        fetchSubjects();

                    } else {

                        Swal.fire(
                            "Error",
                            "No se pudo archivar la asignatura.",
                            "error"
                        );
                    }
                }
            });
        }
    };

    const handleSaveSubject = async () => {

        const payload: CreateSubjectRequest = {
            code: formData.code,
            name: formData.name,
            description: formData.description,
            credits: Number(formData.credits),
            is_active: formData.is_active,
        };

        const created =
            await subjectService.createSubject(payload);

        if (created) {

            Swal.fire(
                "Éxito",
                "Asignatura creada correctamente.",
                "success"
            );

            setShowForm(false);

            fetchSubjects();

        } else {

            Swal.fire(
                "Error",
                "No se pudo crear la asignatura.",
                "error"
            );
        }
    };

    const handleUpdateSubject = async () => {

        if (!selectedSubject) return;

        const payload: UpdateSubjectRequest = {
            code: formData.code,
            name: formData.name,
            description: formData.description,
            credits: Number(formData.credits),
            is_active: formData.is_active,
        };

        const updated =
            await subjectService.updateSubject(
                selectedSubject.id,
                payload
            );

        if (updated) {

            Swal.fire(
                "Éxito",
                "Asignatura actualizada correctamente.",
                "success"
            );

            setShowForm(false);

            fetchSubjects();

        } else {

            Swal.fire(
                "Error",
                "No se pudo actualizar la asignatura.",
                "error"
            );
        }
    };

    const clearFilters = () => {

        setSearch("");

        setStatusFilter("");

        setCreditsFilter("");
    };

    const filteredData = data.filter((subject) => {

        const matchesSearch =
            subject.name
                .toLowerCase()
                .includes(search.toLowerCase()) ||

            subject.code
                .toLowerCase()
                .includes(search.toLowerCase());

        const matchesStatus =
            !statusFilter ||

            (
                statusFilter === "ACTIVE"
                    ? subject.is_active
                    : !subject.is_active
            );

        const matchesCredits =
            !creditsFilter ||
            subject.credits.toString() === creditsFilter;

        return (
            matchesSearch &&
            matchesStatus &&
            matchesCredits
        );
    });

    // SOLO para renderizar en tabla
    const tableData = filteredData.map((subject) => ({
        ...subject,

        is_active:
            subject.is_active
                ? "Active"
                : "Archived",

        updated_at:
            new Date(
                subject.updated_at
            ).toLocaleDateString(),
    }));

    return (

        <div className="space-y-4">

            <div>
                <h1
                    className="
                        text-2xl
                        font-bold
                    "
                >
                    Asignaturas
                </h1>

                <p
                    className="
                        text-gray-500
                        text-sm
                    "
                >
                    Catálogo de asignaturas disponibles en el sistema.
                </p>
            </div>

            <FilterBar
                searchPlaceholder="Buscar asignatura..."
                searchValue={search}
                onSearchChange={setSearch}

                filters={[
                    {
                        name: "status",
                        placeholder: "Estado",
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                            {
                                label: "Activas",
                                value: "ACTIVE",
                            },
                            {
                                label: "Archivadas",
                                value: "INACTIVE",
                            },
                        ],
                    },

                    {
                        name: "credits",
                        placeholder: "Créditos",
                        value: creditsFilter,
                        onChange: setCreditsFilter,
                        options: [
                            { label: "2", value: "2" },
                            { label: "3", value: "3" },
                            { label: "4", value: "4" },
                            { label: "5", value: "5" },
                        ],
                    },
                ]}

                clearButton={{
                    label: "Limpiar filtros",
                    onClick: clearFilters,
                }}

                primaryButton={{
                    label: "Nueva asignatura",
                    onClick: handleCreate,
                }}
            />

            <div
                className="
                    grid
                    grid-cols-1
                    xl:grid-cols-4
                    gap-4
                "
            >

                <div
                    className="
                        xl:col-span-3
                    "
                >

                    <GenericTable
                        data={tableData}

                        columns={[
                            "code",
                            "name",
                            "description",
                            "credits",
                            "is_active",
                            "updated_at",
                        ]}

                        actions={[
                            {
                                name: "edit",
                                label: "Edit",
                            },

                            {
                                name: "archive",
                                label: "Archive",
                            },
                        ]}

                        onAction={(action, item) => {

                            const subject =
                                filteredData.find(
                                    (s) => s.id === item.id
                                );

                            if (!subject) return;

                            handleAction(
                                action,
                                subject
                            );
                        }}

                        onRowClick={(item) => {

                            const subject =
                                filteredData.find(
                                    (s) => s.id === item.id
                                );

                            if (!subject) return;

                            setSelectedSubject(subject);
                        }}

                        pageSize={5}
                    />

                </div>

                <div>

                    <DetailCard
                        title="Detalles de la asignatura"

                        details={[
                            {
                                label: "Código",
                                value:
                                    selectedSubject?.code
                                    ?? "-"
                            },

                            {
                                label: "Nombre",
                                value:
                                    selectedSubject?.name
                                    ?? "-"
                            },

                            {
                                label: "Descripción",
                                value:
                                    selectedSubject?.description
                                    ?? "-"
                            },

                            {
                                label: "Créditos",
                                value:
                                    selectedSubject?.credits
                                    ?? "-"
                            },

                            {
                                label: "Estado",
                                value:
                                    selectedSubject?.is_active
                                        ? "Activa"
                                        : "Archivada"
                            },

                            {
                                label: "Creada",
                                value:
                                    selectedSubject?.created_at
                                        ? new Date(
                                            selectedSubject.created_at
                                        ).toLocaleString()
                                        : "-"
                            },

                            {
                                label: "Actualizada",
                                value:
                                    selectedSubject?.updated_at
                                        ? new Date(
                                            selectedSubject.updated_at
                                        ).toLocaleString()
                                        : "-"
                            },

                            {
                                label: "ID",
                                value:
                                    selectedSubject?.id
                                    ?? "-"
                            },
                        ]}
                    />

                </div>

            </div>

            {
                showForm && (

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
                                selectedSubject
                                    ? "Editar asignatura"
                                    : "Nueva asignatura"
                            }

                            sections={[
                                "Información"
                            ]}

                            activeSection="Información"

                            onSectionChange={() => { }}

                            fields={[

                                {
                                    name: "code",
                                    label: "Código",
                                    type: "text",
                                    required: true,
                                    value: formData.code,
                                    onChange: (value) =>
                                        setFormData({
                                            ...formData,
                                            code: value
                                        })
                                },

                                {
                                    name: "name",
                                    label: "Nombre",
                                    type: "text",
                                    required: true,
                                    value: formData.name,
                                    onChange: (value) =>
                                        setFormData({
                                            ...formData,
                                            name: value
                                        })
                                },

                                {
                                    name: "description",
                                    label: "Descripción",
                                    type: "textarea",
                                    value: formData.description,
                                    onChange: (value) =>
                                        setFormData({
                                            ...formData,
                                            description: value
                                        })
                                },

                                {
                                    name: "credits",
                                    label: "Créditos",
                                    type: "number",
                                    required: true,
                                    value: formData.credits,
                                    onChange: (value) =>
                                        setFormData({
                                            ...formData,
                                            credits: value
                                        })
                                },

                                {
                                    name: "is_active",
                                    label: "Estado",
                                    type: "select",
                                    value:
                                        formData.is_active
                                            ? "ACTIVE"
                                            : "INACTIVE",

                                    onChange: (value) =>
                                        setFormData({
                                            ...formData,
                                            is_active:
                                                value === "ACTIVE"
                                        }),

                                    options: [
                                        {
                                            label: "Activa",
                                            value: "ACTIVE"
                                        },

                                        {
                                            label: "Archivada",
                                            value: "INACTIVE"
                                        }
                                    ]
                                }
                            ]}

                            infoMessage="
                                Complete la información
                                de la asignatura.
                            "

                            buttons={[

                                {
                                    label: "Cancelar",
                                    variant: "secondary",
                                    onClick: () =>
                                        setShowForm(false)
                                },

                                {
                                    label:
                                        selectedSubject
                                            ? "Guardar cambios"
                                            : "Guardar",

                                    variant: "primary",

                                    onClick:
                                        selectedSubject
                                            ? handleUpdateSubject
                                            : handleSaveSubject
                                }
                            ]}
                        />

                    </div>
                )
            }

        </div>
    );
};

export default Subjects;