import React, { useEffect, useState } from "react";
import { User } from "../../models/User";
import GenericTable from "../../components/GenericTable";
import { userService } from "../../services/userService";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { ApiUser } from "../../models/apiUser";

const Users: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<User[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    // mapea la respuesta del backend (contenida en ApiUser) para convertirla a User
    const mapUser = (u: ApiUser): User => {
        return {
            code: u.code,
            email: u.email,
            role: u.role,
            isActive: u.is_active == true ? "Active":"Inactive",
            createdAt: u.created_at,
            specialty: u.profile?.specialty,
            fullName: `${u.profile?.first_name ?? "No name"} ${u.profile?.last_name ?? ""}`.trim(),
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
        if (action === "edit") {
            navigate(`/users-edit/${item.code}`);
        }

        if (action === "deactivate") {
            Swal.fire({
                title: "¿Desactivar usuario?",
                text: "El usuario quedará inactivo",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, desactivar",
            }).then((result) => {
                if (result.isConfirmed) {
                    console.log("Desactivando usuario:", item);

                    // userService.deactivateUser(item.code);

                    Swal.fire(
                        "Hecho",
                        "Usuario desactivado correctamente",
                        "success"
                    );

                    // opcional: refrescar lista
                    fetchData();
                }
            });
        }
    };

    const handleCreate = () => {
        navigate("/users-create");
    };

    return (
        <div>
            <h1>User List</h1>

            {/* <button
                onClick={handleCreate}
                className="inline-flex items-center justify-center bg-primary py-2 px-4 text-sm font-medium text-white rounded-md"
            >
                Crear
            </button> */}

            <GenericTable
                data={data}
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
            />
        </div>
    );
};

export default Users;