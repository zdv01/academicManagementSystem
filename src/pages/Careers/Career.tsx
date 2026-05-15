import React, { useEffect, useState } from "react";

import Swal from "sweetalert2";

import GenericTable from "../../components/GenericTable";
import FilterBar from "../../components/filterBar/FilterBar";
import UserFormCard from "../../components/userFormCard/UserFormCard";

import { Career } from "../../models/Career";

import { careerService } from "../../services/careerService";

import { CreateCareerRequest } from "../../dto/createCareerRequest";
import { UpdateCareerRequest } from "../../dto/updateCareerRequest";

const Careers: React.FC = () => {

    const [data, setData] = useState<Career[]>([]);

    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] = useState("");

    const [showForm, setShowForm] = useState(false);

    const [selectedCareer, setSelectedCareer] =
        useState<Career | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        description: "",
        is_active: true,
    });

    useEffect(() => {

        fetchData();

    }, []);

    // búsqueda backend
    useEffect(() => {

        const loadCareers = async () => {

            try {

                // si no hay búsqueda
                if (!search.trim()) {

                    const careers =
                        await careerService.getCareers();

                    setData(careers);

                    return;
                }

                // búsqueda backend
                const careers =
                    await careerService.searchCareers(
                        search
                    );

                setData(careers);

            } catch (error) {

                console.error(
                    "Error buscando carreras:",
                    error
                );
            }
        };

        loadCareers();

    }, [search]);

    const fetchData = async () => {

        try {

            const careers =
                await careerService.getCareers();

            setData(careers);

        } catch (error) {

            console.error(
                "Error cargando carreras:",
                error
            );

            setData([]);
        }
    };

    const handleCreate = () => {

        setSelectedCareer(null);

        setFormData({
            name: "",
            code: "",
            description: "",
            is_active: true,
        });

        setShowForm(true);
    };

    const handleAction = (
        action: string,
        item: Career
    ) => {

        // editar
        if (action === "edit") {

            setSelectedCareer(item);

            setFormData({
                name: item.name,
                code: item.code,
                description: item.description,
                is_active: item.is_active,
            });

            setShowForm(true);
        }

        // archivar
        if (action === "archive") {

            Swal.fire({
                title: "¿Archivar carrera?",
                text:
                    "La carrera quedará archivada",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, archivar",
            }).then(async (result) => {

                if (result.isConfirmed) {

                    const payload: UpdateCareerRequest = {
                        name: item.name,
                        code: item.code,
                        description: item.description,
                    };

                    const updated =
                        await careerService.updateCareer(
                            item.id,
                            payload
                        );

                    if (updated) {

                        // mock visual mientras backend
                        // no soporta archive real
                        setData((prev) =>
                            prev.map((career) =>
                                career.id === item.id
                                    ? {
                                        ...career,
                                        is_active: false,
                                    }
                                    : career
                            )
                        );

                        Swal.fire(
                            "Hecho",
                            "Carrera archivada",
                            "success"
                        );

                    } else {

                        Swal.fire(
                            "Error",
                            "No se pudo archivar",
                            "error"
                        );
                    }
                }
            });
        }
    };

    const handleSaveCareer = async () => {

        const payload: CreateCareerRequest = {
            name: formData.name,
            code: formData.code,
            description: formData.description,
            is_active: formData.is_active,
        };

        const createdCareer =
            await careerService.createCareer(
                payload
            );

        if (createdCareer) {

            Swal.fire(
                "Éxito",
                "Carrera creada correctamente",
                "success"
            );

            fetchData();

            setShowForm(false);

        } else {

            Swal.fire(
                "Error",
                "No se pudo crear la carrera",
                "error"
            );
        }
    };

    const handleUpdateCareer = async () => {

        if (!selectedCareer) return;

        const payload: UpdateCareerRequest = {
            name: formData.name,
            code: formData.code,
            description: formData.description,
        };

        const updatedCareer =
            await careerService.updateCareer(
                selectedCareer.id,
                payload
            );

        if (updatedCareer) {

            Swal.fire(
                "Éxito",
                "Carrera actualizada correctamente",
                "success"
            );

            fetchData();

            setShowForm(false);

        } else {

            Swal.fire(
                "Error",
                "No se pudo actualizar la carrera",
                "error"
            );
        }
    };

    const clearFilters = () => {

        setSearch("");

        setStatusFilter("");
    };

    const filteredData = data.filter((career) => {

        const matchesStatus =
            !statusFilter ||

            (
                statusFilter === "Active"
                    ? career.is_active
                    : !career.is_active
            );

        return matchesStatus;
    });

    const mappedData = filteredData.map(
        (career) => ({
            ...career,

            status:
                career.is_active
                    ? "Active"
                    : "Archived",
        })
    );

    return (

        <div className="space-y-4">

            <h1 className="text-2xl font-bold">
                CAREERS
            </h1>

            <FilterBar

                searchPlaceholder="Buscar carrera..."

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
                                label: "Activa",
                                value: "Active",
                            },
                            {
                                label: "Archivada",
                                value: "Archived",
                            },
                        ],
                    },
                ]}

                clearButton={{
                    label: "Limpiar",
                    onClick: clearFilters,
                }}

                primaryButton={{
                    label: "Nueva carrera",
                    onClick: handleCreate,
                }}
            />

            <GenericTable

                data={mappedData}

                columns={[
                    "code",
                    "name",
                    "description",
                    "status",
                    "created_at",
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

                onAction={handleAction}

                pageSize={5}
            />

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
                                selectedCareer
                                    ? "Editar carrera"
                                    : "Crear carrera"
                            }

                            sections={[
                                "Datos de carrera"
                            ]}

                            activeSection="Datos de carrera"

                            onSectionChange={() => {}}

                            fields={[

                                {
                                    name: "name",
                                    label: "Nombre",
                                    type: "text",

                                    required: true,

                                    value: formData.name,

                                    onChange: (value) =>
                                        setFormData({
                                            ...formData,
                                            name: value,
                                        }),
                                },

                                {
                                    name: "code",
                                    label: "Código",
                                    type: "text",

                                    required: true,

                                    value: formData.code,

                                    onChange: (value) =>
                                        setFormData({
                                            ...formData,
                                            code: value,
                                        }),
                                },

                                {
                                    name: "description",
                                    label: "Descripción",
                                    type: "text",

                                    value:
                                        formData.description,

                                    onChange: (value) =>
                                        setFormData({
                                            ...formData,
                                            description: value,
                                        }),
                                },

                                {
                                    name: "is_active",
                                    label: "Estado",
                                    type: "select",

                                    value:
                                        formData.is_active
                                            ? "true"
                                            : "false",

                                    onChange: (value) =>
                                        setFormData({
                                            ...formData,

                                            is_active:
                                                value === "true",
                                        }),

                                    options: [
                                        {
                                            label: "Activo",
                                            value: "true",
                                        },
                                        {
                                            label: "Archivado",
                                            value: "false",
                                        },
                                    ],
                                },
                            ]}

                            infoMessage="
                                Complete la información
                                de la carrera.
                            "

                            buttons={[
                                {
                                    label: "Cancelar",

                                    variant: "secondary",

                                    onClick: () =>
                                        setShowForm(false),
                                },

                                {
                                    label:
                                        selectedCareer
                                            ? "Guardar cambios"
                                            : "Guardar carrera",

                                    variant: "primary",

                                    onClick:
                                        selectedCareer
                                            ? handleUpdateCareer
                                            : handleSaveCareer,
                                },
                            ]}
                        />

                    </div>
                )
            }

        </div>
    );
};

export default Careers;