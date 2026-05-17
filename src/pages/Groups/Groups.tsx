import React, {
    useEffect,
    useMemo,
    useState
} from "react";

import Swal from "sweetalert2";

import FilterBar from
"../../components/filterBar/FilterBar";

import GenericTable from
"../../components/GenericTable";

import DetailCard from
"../../components/detailCard/DetailCard";

import UserFormCard from
"../../components/userFormCard/UserFormCard";

import { Group } from "../../models/Group";
import { Subject } from "../../models/Subject";
import { Semester } from "../../models/Semester";
import { Teacher } from "../../models/Teacher";

import { groupService }
from "../../services/groupsService";

import { subjectService }
from "../../services/subjectService";

import { semesterService }
from "../../services/semesterService";

import { teacherService }
from "../../services/teacherService";

const Groups: React.FC = () => {

    const [groups, setGroups] =
        useState<Group[]>([]);

    const [subjects, setSubjects] =
        useState<Subject[]>([]);

    const [semesters, setSemesters] =
        useState<Semester[]>([]);

    const [teachers, setTeachers] =
        useState<Teacher[]>([]);

    const [selectedGroup, setSelectedGroup] =
        useState<Group | null>(null);

    const [selectedTeacher, setSelectedTeacher] =
        useState<Teacher | null>(null);

    const [search, setSearch] =
        useState("");

    const [semesterFilter, setSemesterFilter] =
        useState("");

    const [teacherSearch, setTeacherSearch] =
        useState("");

    const [showAssignModal, setShowAssignModal] =
        useState(false);

    const [isReassigning, setIsReassigning] =
        useState(false);

    useEffect(() => {

        fetchData();

    }, []);

    const fetchData = async () => {

        const [
            groupsData,
            subjectsData,
            semestersData
        ] = await Promise.all([
            groupService.getGroups(),
            subjectService.getSubjects(),
            semesterService.getSemesters()
        ]);

        setGroups(groupsData);

        setSubjects(subjectsData);

        setSemesters(semestersData);

        if (groupsData.length > 0) {

            setSelectedGroup(groupsData[0]);
        }
    };

    const handleTeacherSearch =
    async (query: string) => {

        setTeacherSearch(query);

        const result =
            await teacherService
                .searchTeachers(query);

        setTeachers(result);
    };

    const handleAssignTeacher = async () => {

        if (
            !selectedGroup ||
            !selectedTeacher
        ) return;

        const semester =
            semesters.find(
                (s) =>
                    s.id ===
                    selectedGroup.semester_id
            );

        const subject =
            subjects.find(
                (s) =>
                    s.id ===
                    selectedGroup.subject_id
            );

        const result =
            await Swal.fire({

                title:
                    isReassigning
                        ? "¿Reasignar docente?"
                        : "¿Asignar docente?",

                html: `
                    <div style="text-align:left">
                        <p>
                            <strong>Grupo:</strong>
                            ${selectedGroup.name}
                        </p>

                        <p>
                            <strong>Código:</strong>
                            ${selectedGroup.group_code}
                        </p>

                        <p>
                            <strong>Asignatura:</strong>
                            ${subject?.name || "-"}
                        </p>

                        <p>
                            <strong>Semestre:</strong>
                            ${semester?.name || "-"}
                        </p>

                        <p>
                            <strong>Docente:</strong>
                            ${selectedTeacher.first_name}
                            ${selectedTeacher.last_name}
                        </p>
                    </div>
                `,

                icon: "question",

                showCancelButton: true,

                confirmButtonText:
                    isReassigning
                        ? "Reasignar"
                        : "Asignar"
            });

        if (!result.isConfirmed) return;

        /**
         * ===================================================
         * TODO:
         * Validar aquí si el grupo ya tiene notas registradas
         * y bloquear la reasignación.
         *
         * Requiere endpoint:
         * getGroupEvaluations(groupId)
         * o
         * getFinalScores(groupId)
         * ===================================================
         */

        const updated =
            await groupService.assignTeacher(
                selectedGroup.id,
                selectedTeacher.id
            );

        if (updated) {

            Swal.fire(
                "Éxito",
                isReassigning
                    ? "Docente reasignado correctamente"
                    : "Docente asignado correctamente",
                "success"
            );

            fetchData();

            setShowAssignModal(false);

            setSelectedTeacher(null);

        } else {

            Swal.fire(
                "Error",
                "No se pudo asignar el docente",
                "error"
            );
        }
    };

    const handleAction = (
        action: string,
        group: Group
    ) => {

        if (
            action === "assign" ||
            action === "reassign"
        ) {

            setSelectedGroup(group);

            setSelectedTeacher(null);

            setTeachers([]);

            setTeacherSearch("");

            setIsReassigning(
                action === "reassign"
            );

            setShowAssignModal(true);
        }
    };

    const filteredGroups =
        useMemo(() => {

            return groups.filter((group) => {

                const semester =
                    semesters.find(
                        (s) =>
                            s.id ===
                            group.semester_id
                    );

                const matchesSearch =

                    group.name
                        .toLowerCase()
                        .includes(
                            search.toLowerCase()
                        )

                    ||

                    group.group_code
                        .toLowerCase()
                        .includes(
                            search.toLowerCase()
                        );

                const matchesSemester =

                    !semesterFilter ||

                    group.semester_id ===
                    semesterFilter;

                return (
                    matchesSearch &&
                    matchesSemester &&
                    semester?.is_active
                );
            });

        }, [
            groups,
            search,
            semesterFilter,
            semesters
        ]);

    const selectedSubject =
        subjects.find(
            (s) =>
                s.id ===
                selectedGroup?.subject_id
        );

    const selectedSemester =
        semesters.find(
            (s) =>
                s.id ===
                selectedGroup?.semester_id
        );

    const currentTeacher =
        teachers.find(
            (t) =>
                t.id ===
                selectedGroup?.teacher_id
        );

    return (

        <div className="space-y-4">

            <div>

                <h1
                    className="
                        text-2xl
                        font-bold
                    "
                >
                    Asignación de docentes
                </h1>

                <p
                    className="
                        text-sm
                        text-gray-500
                    "
                >
                    Gestión de grupos y
                    asignación de docentes.
                </p>

            </div>

            <FilterBar

                searchPlaceholder=
                "Buscar grupo..."

                searchValue={search}

                onSearchChange={setSearch}

                filters={[

                    {
                        name: "semester",

                        placeholder: "Semestre",

                        value: semesterFilter,

                        onChange:
                            setSemesterFilter,

                        options:
                            semesters
                                .filter(
                                    (s) => s.is_active
                                )
                                .map((semester) => ({
                                    label:
                                        semester.name,

                                    value:
                                        semester.id
                                }))
                    }
                ]}

                clearButton={{
                    label: "Limpiar",

                    onClick: () => {

                        setSearch("");

                        setSemesterFilter("");
                    }
                }}
            />

            <div
                className="
                    grid
                    grid-cols-12
                    gap-4
                "
            >

                {/* TABLA */}

                <div
                    className="
                        col-span-8
                        bg-white
                        rounded-xl
                        shadow
                        p-4
                    "
                >

                    <GenericTable

                        data={
                            filteredGroups.map(
                                (group) => {

                                    const subject =
                                        subjects.find(
                                            (s) =>
                                                s.id ===
                                                group.subject_id
                                        );

                                    const semester =
                                        semesters.find(
                                            (s) =>
                                                s.id ===
                                                group.semester_id
                                        );

                                    const teacher =
                                        teachers.find(
                                            (t) =>
                                                t.id ===
                                                group.teacher_id
                                        );

                                    return {

                                        ...group,

                                        subject:
                                            `${subject?.code || "-"} - ${subject?.name || "-"}`,

                                        semester:
                                            semester?.name || "-",

                                        teacher:
                                            teacher
                                                ? `${teacher.first_name} ${teacher.last_name}`
                                                : "Sin asignar"
                                    };
                                }
                            )
                        }

                        columns={[
                            "group_code",
                            "name",
                            "subject",
                            "semester",
                            "teacher",
                            "capacity"
                        ]}

                        actions={[

                            {
                                name: "assign",

                                label:
                                    "Asignar"
                            },

                            {
                                name: "reassign",

                                label:
                                    "Reasignar"
                            }
                        ]}

                        onAction={(action, item) =>
                            handleAction(
                                action,
                                item as Group
                            )
                        }

                        onRowClick={(item) =>
                            setSelectedGroup(
                                item as Group
                            )
                        }

                        pageSize={6}
                    />

                </div>

                {/* DETAIL */}

                <div
                    className="
                        col-span-4
                    "
                >

                    <DetailCard

                        title=
                        "Detalles del grupo"

                        details={[

                            {
                                label: "Grupo",

                                value:
                                    selectedGroup?.name
                                    || "-"
                            },

                            {
                                label: "Código",

                                value:
                                    selectedGroup?.group_code
                                    || "-"
                            },

                            {
                                label:
                                    "Asignatura",

                                value:
                                    selectedSubject
                                        ? `${selectedSubject.code} - ${selectedSubject.name}`
                                        : "-"
                            },

                            {
                                label:
                                    "Semestre",

                                value:
                                    selectedSemester?.name
                                    || "-"
                            },

                            {
                                label:
                                    "Docente actual",

                                value:
                                    currentTeacher
                                        ? `${currentTeacher.first_name} ${currentTeacher.last_name}`
                                        : "Sin asignar"
                            },

                            {
                                label:
                                    "Capacidad",

                                value:
                                    selectedGroup?.capacity
                                    || "-"
                            },

                            {
                                label:
                                    "Actualizado",

                                value:
                                    selectedGroup?.updated_at
                                        ? new Date(
                                            selectedGroup.updated_at
                                        ).toLocaleString()
                                        : "-"
                            }
                        ]}
                    />

                </div>

            </div>

            {
                showAssignModal && (

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
                                isReassigning
                                    ? "Reasignar docente"
                                    : "Asignar docente"
                            }

                            sections={[
                                "Selección"
                            ]}

                            activeSection=
                            "Selección"

                            onSectionChange={() => {}}

                            fields={[

                                {
                                    name:
                                        "teacherSearch",

                                    label:
                                        "Buscar docente",

                                    type: "text",

                                    value:
                                        teacherSearch,

                                    onChange:
                                        handleTeacherSearch
                                },

                                {
                                    name:
                                        "teacher",

                                    label:
                                        "Docente",

                                    type: "select",

                                    value:
                                        selectedTeacher?.id
                                        || "",

                                    onChange: (
                                        value
                                    ) => {

                                        const teacher =
                                            teachers.find(
                                                (t) =>
                                                    t.id === value
                                            );

                                        setSelectedTeacher(
                                            teacher || null
                                        );
                                    },

                                    options:
                                        teachers.map(
                                            (teacher) => ({
                                                label:
                                                    `${teacher.first_name} ${teacher.last_name} - ${teacher.identification}`,

                                                value:
                                                    teacher.id
                                            })
                                        )
                                }
                            ]}

                            infoMessage={
                                selectedGroup

                                ? `Grupo seleccionado: ${selectedGroup.group_code}`

                                : ""
                            }

                            buttons={[

                                {
                                    label:
                                        "Cancelar",

                                    variant:
                                        "secondary",

                                    onClick: () =>
                                        setShowAssignModal(false)
                                },

                                {
                                    label:
                                        isReassigning
                                            ? "Reasignar"
                                            : "Asignar",

                                    variant:
                                        "primary",

                                    onClick:
                                        handleAssignTeacher
                                }
                            ]}
                        />

                    </div>
                )
            }

        </div>
    );
};

export default Groups;