import React, {
    useEffect,
    useState
} from "react";

import Swal from "sweetalert2";

import GenericTable from "../../components/GenericTable";

import FilterBar from "../../components/filterBar/FilterBar";

import UserFormCard from "../../components/userFormCard/UserFormCard";

import { Semester } from "../../models/Semester";

import { Career } from "../../models/Career";

import { semesterService } from "../../services/semesterService";

import { careerService } from "../../services/careerService";

import { CreateSemesterRequest }
from "../../dto/createSemesterRequest";

import { UpdateSemesterRequest }
from "../../dto/updateSemesterRequest";

const Semesters: React.FC = () => {

    const [data, setData] =
        useState<Semester[]>([]);

    const [careers, setCareers] =
        useState<Career[]>([]);

    const [search, setSearch] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("");

    const [showForm, setShowForm] =
        useState(false);

    const [selectedSemester,
        setSelectedSemester] =
        useState<Semester | null>(null);

    const [formData, setFormData] =
        useState({

            career_id: "",

            name: "",

            code: "",

            start_date: "",

            end_date: "",

            is_active: true,
        });

    useEffect(() => {

        fetchData();

        fetchCareers();

    }, []);

    useEffect(() => {

        const loadSemesters = async () => {

            try {

                if (!search.trim()) {

                    const semesters =
                        await semesterService
                            .getSemesters();

                    setData(semesters);

                    return;
                }

                const semesters =
                    await semesterService
                        .searchSemesters(search);

                setData(semesters);

            } catch (error) {

                console.error(
                    "Error buscando semesters:",
                    error
                );
            }
        };

        loadSemesters();

    }, [search]);

    const fetchData = async () => {

        try {

            const semesters =
                await semesterService
                    .getSemesters();

            setData(semesters);

        } catch (error) {

            console.error(
                "Error cargando semesters:",
                error
            );

            setData([]);
        }
    };

    const fetchCareers = async () => {

        try {

            const careersData =
                await careerService
                    .getCareers();

            setCareers(careersData);

        } catch (error) {

            console.error(
                "Error cargando careers:",
                error
            );
        }
    };

    const handleCreate = () => {

        setSelectedSemester(null);

        setFormData({

            career_id: "",

            name: "",

            code: "",

            start_date: "",

            end_date: "",

            is_active: true,
        });

        setShowForm(true);
    };

    const handleAction = (
        action: string,
        item: Semester
    ) => {

        if (action === "edit") {

            setSelectedSemester(item);

            setFormData({

                career_id:
                    item.career_id ?? "",

                name: item.name,

                code: item.code,

                start_date:
                    item.start_date,

                end_date:
                    item.end_date,

                is_active:
                    item.is_active,
            });

            setShowForm(true);
        }

        if (action === "archive") {

            Swal.fire({
                title:
                    "¿Archivar semestre?",
                text:
                    "El semestre quedará archivado",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText:
                    "Sí, archivar",
            }).then(async (result) => {

                if (result.isConfirmed) {

                    setData((prev) =>
                        prev.map((semester) =>
                            semester.id === item.id
                                ? {
                                    ...semester,
                                    is_active: false,
                                }
                                : semester
                        )
                    );

                    Swal.fire(
                        "Hecho",
                        "Semestre archivado",
                        "success"
                    );
                }
            });
        }
    };

    const validateDates = () => {

        return (
            new Date(formData.start_date)
            <
            new Date(formData.end_date)
        );
    };

    const handleSaveSemester = async () => {

        if (!validateDates()) {

            Swal.fire(
                "Error",
                "La fecha inicial debe ser menor a la final",
                "error"
            );

            return;
        }

        const payload:
            CreateSemesterRequest = {

            career_id:
                formData.career_id,

            name:
                formData.name,

            code:
                formData.code,

            start_date:
                formData.start_date,

            end_date:
                formData.end_date,

            is_active:
                formData.is_active,
        };

        const createdSemester =
            await semesterService
                .createSemester(payload);

        if (createdSemester) {

            Swal.fire(
                "Éxito",
                "Semestre creado correctamente",
                "success"
            );

            fetchData();

            setShowForm(false);

        } else {

            Swal.fire(
                "Error",
                "No se pudo crear el semestre",
                "error"
            );
        }
    };

    const handleUpdateSemester = async () => {

        if (!selectedSemester) return;

        if (!validateDates()) {

            Swal.fire(
                "Error",
                "La fecha inicial debe ser menor a la final",
                "error"
            );

            return;
        }

        const payload:
            UpdateSemesterRequest = {

            career_id:
                formData.career_id,

            name:
                formData.name,

            code:
                formData.code,

            start_date:
                formData.start_date,

            end_date:
                formData.end_date,

            is_active:
                formData.is_active,
        };

        const updatedSemester =
            await semesterService
                .updateSemester(
                    selectedSemester.id,
                    payload
                );

        if (updatedSemester) {

            Swal.fire(
                "Éxito",
                "Semestre actualizado correctamente",
                "success"
            );

            fetchData();

            setShowForm(false);

        } else {

            Swal.fire(
                "Error",
                "No se pudo actualizar el semestre",
                "error"
            );
        }
    };

    const clearFilters = () => {

        setSearch("");

        setStatusFilter("");
    };

    const filteredData =
        data.filter((semester) => {

            const matchesStatus =

                !statusFilter ||

                (
                    statusFilter === "Active"
                        ? semester.is_active
                        : !semester.is_active
                );

            return matchesStatus;
        });

    const mappedData =
        filteredData.map((semester) => ({

            ...semester,

            status:
                semester.is_active
                    ? "Active"
                    : "Archived",
        }));

    return (

        <div className="space-y-4">

            <h1 className="
                text-2xl
                font-bold
            ">
                SEMESTERS
            </h1>

            <FilterBar

                searchPlaceholder="
                    Buscar semestre...
                "

                searchValue={search}

                onSearchChange={setSearch}

                filters={[
                    {
                        name: "status",

                        placeholder: "Estado",

                        value: statusFilter,

                        onChange:
                            setStatusFilter,

                        options: [
                            {
                                label: "Activo",
                                value: "Active",
                            },
                            {
                                label: "Archivado",
                                value: "Archived",
                            },
                        ],
                    },
                ]}

                clearButton={{
                    label: "Limpiar",

                    onClick:
                        clearFilters,
                }}

                primaryButton={{
                    label:
                        "Nuevo semestre",

                    onClick:
                        handleCreate,
                }}
            />

            <GenericTable

                data={mappedData}

                columns={[
                    "code",
                    "name",
                    "start_date",
                    "end_date",
                    "status",
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

                onAction={
                    handleAction
                }

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
                                selectedSemester
                                    ? "Editar semestre"
                                    : "Crear semestre"
                            }

                            sections={[
                                "Datos de semestre"
                            ]}

                            activeSection="
                                Datos de semestre
                            "

                            onSectionChange={
                                () => {}
                            }

                            fields={[

                                {
                                    name:
                                        "career_id",

                                    label:
                                        "Carrera",

                                    type:
                                        "select",

                                    value:
                                        formData
                                            .career_id,

                                    onChange:
                                        (value) =>
                                            setFormData({
                                                ...formData,
                                                career_id:
                                                    value,
                                            }),

                                    options:
                                        careers.map(
                                            (
                                                career
                                            ) => ({
                                                label:
                                                    career.name,
                                                value:
                                                    career.id,
                                            })
                                        ),
                                },

                                {
                                    name:
                                        "name",

                                    label:
                                        "Nombre",

                                    type:
                                        "text",

                                    required:
                                        true,

                                    value:
                                        formData.name,

                                    onChange:
                                        (value) =>
                                            setFormData({
                                                ...formData,
                                                name:
                                                    value,
                                            }),
                                },

                                {
                                    name:
                                        "code",

                                    label:
                                        "Código",

                                    type:
                                        "text",

                                    required:
                                        true,

                                    value:
                                        formData.code,

                                    onChange:
                                        (value) =>
                                            setFormData({
                                                ...formData,
                                                code:
                                                    value,
                                            }),
                                },

                                {
                                    name:
                                        "start_date",

                                    label:
                                        "Fecha inicio",

                                    type:
                                        "date",

                                    value:
                                        formData
                                            .start_date,

                                    onChange:
                                        (value) =>
                                            setFormData({
                                                ...formData,
                                                start_date:
                                                    value,
                                            }),
                                },

                                {
                                    name:
                                        "end_date",

                                    label:
                                        "Fecha fin",

                                    type:
                                        "date",

                                    value:
                                        formData
                                            .end_date,

                                    onChange:
                                        (value) =>
                                            setFormData({
                                                ...formData,
                                                end_date:
                                                    value,
                                            }),
                                },

                                {
                                    name:
                                        "is_active",

                                    label:
                                        "Estado",

                                    type:
                                        "select",

                                    value:
                                        formData
                                            .is_active
                                                ? "true"
                                                : "false",

                                    onChange:
                                        (value) =>
                                            setFormData({
                                                ...formData,

                                                is_active:
                                                    value ===
                                                    "true",
                                            }),

                                    options: [
                                        {
                                            label:
                                                "Activo",

                                            value:
                                                "true",
                                        },
                                        {
                                            label:
                                                "Archivado",

                                            value:
                                                "false",
                                        },
                                    ],
                                },
                            ]}

                            infoMessage="
                                Complete la información
                                del semestre.
                            "

                            buttons={[

                                {
                                    label:
                                        "Cancelar",

                                    variant:
                                        "secondary",

                                    onClick:
                                        () =>
                                            setShowForm(
                                                false
                                            ),
                                },

                                {
                                    label:
                                        selectedSemester
                                            ? "Guardar cambios"
                                            : "Guardar semestre",

                                    variant:
                                        "primary",

                                    onClick:
                                        selectedSemester
                                            ? handleUpdateSemester
                                            : handleSaveSemester,
                                },
                            ]}
                        />

                    </div>
                )
            }

        </div>
    );
};

export default Semesters;