import React, { useEffect, useState } from "react";
import { User } from "../../models/User";
import GenericTable from "../../components/GenericTable";
import { userService } from "../../services/userService";
import Swal from "sweetalert2";
// import { useNavigate } from "react-router-dom";
import { ApiUser } from "../../dto/apiUser";
import UserFormCard from "../../components/userFormCard/UserFormCard";
import FilterBar from "../../components/filterBar/FilterBar";
import { CreateUserRequest } from "../../dto/createUserRequest";

const Users: React.FC = () => {

    // const navigate = useNavigate();

    const [data, setData] = useState<User[]>([]);

    const [search, setSearch] = useState("");

    const [roleFilter, setRoleFilter] = useState("");

    const [careerFilter, setCareerFilter] = useState("");

    const [statusFilter, setStatusFilter] = useState("");

    const [showForm, setShowForm] = useState(false);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const [activeSection, setActiveSection] =
    useState("Datos de usuario");

    //data reflejada en los inputs de edit/create
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        code: "",
        role: "",

        firstName: "",
        lastName: "",
        phone: "",
        document: "",
        specialty: "",
    });

    useEffect(() => {
        fetchData();
    }, []);

    // formato de mapeo de la respuesta del backend (contenida en ApiUser) para convertirla a User
    const mapUser = (u: ApiUser): User => {
    return {
        code: u.code,
        id: u.id,

        email: u.email,

        role: u.role,

        isActive: u.is_active
            ? "Active"
            : "Inactive",

        createdAt: u.created_at,

        specialty: u.profile?.specialty,

        firstName: u.profile?.first_name,
        lastName: u.profile?.last_name,

        identification: u.profile?.identification,

        phone: u.profile?.phone,

        fullName:
            `${u.profile?.first_name ?? "No name"} ${u.profile?.last_name ?? ""}`.trim(),
        };
    };
    const fetchData = async () => {

        try {

            const res: ApiUser[] = await userService.getUsers();

            setData(res.map(mapUser));

        } catch (error) {

            console.error("Error cargando usuarios:", error);

            setData([]);
        }
    };

    const handleAction = (action: string, item: User) => {

        //edicion
        if (action === "edit") {

            setSelectedUser(item);

            setFormData({
                email: item.email ?? "",
                password: "",
                code: item.code ?? "",
                role: item.role ?? "",

                firstName: item.firstName ?? "",
                lastName: item.lastName ?? "",
                phone: item.phone ?? "",
                document: item.identification ?? "",
                specialty: item.specialty ?? "",
            });

            setActiveSection("Datos de usuario");

            setShowForm(true);
        }
        //desactivacion con modal
        if (action === "deactivate") {
            Swal.fire({
                title: "¿Desactivar usuario?",
                text: "El usuario quedará inactivo",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, desactivar",
            }).then(async (result) => { // Agregamos async aquí
                if (result.isConfirmed) {
                    const success = await userService.deactivateUser(item.id);

                    if (success) {
                        Swal.fire("Hecho", "Usuario desactivado correctamente", "success");
                        await fetchData(); // Refrescar la tabla
                    } else {
                        Swal.fire("Error", "No se pudo desactivar el usuario", "error");
                    }
                }
            });
        }
    };

    const handleCreate = () => {

        setSelectedUser(null);

        setFormData({
            email: "",
            password: "",
            code: "",
            role: "",

            firstName: "",
            lastName: "",
            phone: "",
            document: "",
            specialty: "",
        });

        setActiveSection("Datos de usuario");

        setShowForm(true);
    };

    //para crear usuario 
    const handleSaveUser = async () => {

    const payload: CreateUserRequest = {
        email: formData.email,
        password: formData.password,
        code: formData.code,
        role: formData.role,

        first_name: formData.firstName,
        last_name: formData.lastName,
        identification: formData.document,
    };

    let createdUser = null;

    // estudiante
    if (formData.role === "STUDENT") {

        createdUser =
            await userService.registerStudent(payload);
    }

    // profesor
    else if (formData.role === "TEACHER") {

        createdUser =
            await userService.registerTeacher(payload);
    }

    else {

        Swal.fire(
            "Error",
            "Seleccione un rol válido",
            "error"
        );

        return;
    }

    if (createdUser) {

        Swal.fire(
            "Éxito",
            "Usuario creado correctamente",
            "success"
        );

        fetchData();

        setShowForm(false);

    } else {

        Swal.fire(
            "Error",
            "No se pudo crear el usuario",
            "error"
        );
    }
};
//para actualizar usuario
    const handleUpdateUser = async () => {

        if (!selectedUser) return;

        const payload = {
            email: formData.email,
            code: formData.code,
            role: formData.role,

            first_name: formData.firstName,
            last_name: formData.lastName,
            identification: formData.document,
        };

        const updatedUser =
            await userService.updateUser(
                selectedUser.id,
                payload
            );

        if (updatedUser) {

            Swal.fire(
                "Éxito",
                "Usuario actualizado correctamente",
                "success"
            );

            fetchData();

            setShowForm(false);

        } else {

            Swal.fire(
                "Error",
                "No se pudo actualizar el usuario",
                "error"
            );
        }
    };

    const clearFilters = () => {

        setSearch("");

        setRoleFilter("");

        setCareerFilter("");

        setStatusFilter("");
    };

    const filteredData = data
    .filter((user) => user.role !== "ADMIN")
    .filter((user) => {

        const matchesSearch =
            user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase());

        const matchesRole =
            !roleFilter || user.role === roleFilter;

        const matchesCareer =
            !careerFilter || user.specialty === careerFilter;

        const matchesStatus =
            !statusFilter || user.isActive === statusFilter;

        return (
            matchesSearch &&
            matchesRole &&
            matchesCareer &&
            matchesStatus
        );
    });

    return (

        <div className="space-y-4">
            <h1>USERS</h1>
            <FilterBar
                searchPlaceholder="Buscar usuario..."
                searchValue={search}
                onSearchChange={setSearch}
                // onSearch={() => console.log("Searching...")}
                filters={[
                    {
                        name: "role",
                        placeholder: "Rol",
                        value: roleFilter,
                        onChange: setRoleFilter,
                        options: [
                            { label: "Admin", value: "ADMIN" },
                            { label: "Teacher", value: "TEACHER" },
                            { label: "Student", value: "STUDENT" },
                        ],
                    },
                    {
                        name: "career",
                        placeholder: "Carrera",
                        value: careerFilter,
                        onChange: setCareerFilter,
                        options: [
                            {
                                label: "Ingeniería de Sistemas",
                                value: "Ingeniería de Sistemas",
                            },
                            {
                                label: "Ingeniería Industrial",
                                value: "Ingeniería Industrial",
                            },
                        ],
                    },
                    {
                        name: "status",
                        placeholder: "Estado",
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                            { label: "Activo", value: "Active" },
                            { label: "Inactivo", value: "Inactive" },
                        ],
                    },
                ]}
                clearButton={{
                    label: "Limpiar",
                    onClick: clearFilters,
                }}
                primaryButton={{
                    label: "Nuevo usuario",
                    onClick: handleCreate,
                }}
            />
            {/* la paginacion se hace dentro de generic table bajo propio criterio ya que el backend no me proporciona info sobre eso */}
            <GenericTable
                data={filteredData}
                columns={[
                    "code",
                    "fullName",
                    "email",
                    "role",
                    "isActive",
                    "createdAt",
                ]}
                actions={[
                    { name: "edit", label: "Edit" },
                    { name: "deactivate", label: "Deactivate" },
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
                    selectedUser
                        ? "Editar usuario"
                        : "Crear usuario"
                }

                sections={[
                    "Datos de usuario",
                    "Datos de perfil"
                ]}

                activeSection={activeSection}

                onSectionChange={setActiveSection}

                fields={
                    activeSection === "Datos de usuario"

                        ? [

                            {
                                name: "email",
                                label: "Email",
                                type: "text",
                                required: true,
                                value: formData.email,
                                onChange: (value) =>
                                    setFormData({
                                        ...formData,
                                        email: value
                                    })
                            },
                            //importante, para editar no requiero contraseña, entonces esto me verifica si esta en editar, no renderizo el input
                            ...(
                selectedUser ? [] : [
                                        {
                                            name: "password",
                                            label: "Contraseña",
                                            type: "password" as const,
                                            required: true,
                                            value: formData.password,
                                            onChange: (value: string) =>
                                                setFormData({
                                                    ...formData,
                                                    password: value
                                                })
                                        }
                                    ]
            ),

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
                                name: "role",
                                label: "Rol",
                                type: "select",
                                value: formData.role,
                                onChange: (value) =>
                                    setFormData({
                                        ...formData,
                                        role: value
                                    }),
                                options: [
                                    {
                                        label: "Admin",
                                        value: "ADMIN"
                                    },
                                    {
                                        label: "Teacher",
                                        value: "TEACHER"
                                    },
                                    {
                                        label: "Student",
                                        value: "STUDENT"
                                    }
                                ]
                            }
                        ]

                        : [

                            {
                                name: "firstName",
                                label: "Nombre",
                                type: "text",
                                value: formData.firstName,
                                onChange: (value) =>
                                    setFormData({
                                        ...formData,
                                        firstName: value
                                    })
                            },

                            {
                                name: "lastName",
                                label: "Apellido",
                                type: "text",
                                value: formData.lastName,
                                onChange: (value) =>
                                    setFormData({
                                        ...formData,
                                        lastName: value
                                    })
                            },

                            {
                                name: "phone",
                                label: "Teléfono",
                                type: "text",
                                value: formData.phone,
                                onChange: (value) =>
                                    setFormData({
                                        ...formData,
                                        phone: value
                                    })
                            },

                            {
                                name: "document",
                                label: "Cédula",
                                type: "text",
                                value: formData.document,
                                onChange: (value) =>
                                    setFormData({
                                        ...formData,
                                        document: value
                                    })
                            },

                            {
                                name: "specialty",
                                label: "Especialidad",
                                type: "text",
                                value: formData.specialty,
                                onChange: (value) =>
                                    setFormData({
                                        ...formData,
                                        specialty: value
                                    })
                            }
                        ]
                }

                infoMessage={
                    activeSection === "Datos de usuario"
                        ? "Los datos de perfil se completan en la siguiente pestaña."
                        : "Complete la información del perfil."
                }

                buttons={[
                    {
                        label: "Cancelar",
                        variant: "secondary",
                        onClick: () => setShowForm(false)
                    },

                    activeSection === "Datos de usuario"

                        ? {
                            label: "Siguiente",
                            variant: "primary",
                            onClick: () =>
                                setActiveSection("Datos de perfil")
                        }

                        : {
                            label: selectedUser
                                ? "Guardar cambios"
                                : "Guardar usuario",

                            variant: "primary",

                            onClick: selectedUser
                        ? handleUpdateUser
                        : handleSaveUser
                        }
                ]}
            />

        </div>
    )
}

        </div>
    );
};

export default Users;