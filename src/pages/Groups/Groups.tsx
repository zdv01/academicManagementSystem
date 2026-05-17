import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsService } from '../../services/groupsService';
import { semesterService } from '../../services/semesterService';
import { Groups } from '../../models/Groups';
import { Semester } from '../../models/Semester';

interface GroupWithSemester extends Groups {
    semester?: Semester;
}

const GroupsPage: React.FC = () => {
    const navigate = useNavigate();
    const [groups, setGroups] = useState<GroupWithSemester[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const [rawGroups, semesters] = await Promise.all([
                groupsService.getGroups(),
                semesterService.getSemesters(),
            ]);
            const semesterMap = new Map(semesters.map((s) => [s.id, s]));
            setGroups(
                rawGroups.map((g) => ({ ...g, semester: semesterMap.get(g.semester_id) }))
            );
            setLoading(false);
        };
        load();
    }, []);

    return (
        <div className="mx-auto max-w-7xl">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-black dark:text-white">Grupos</h2>
                <p className="text-sm text-gray-5 mt-1">
                    Selecciona un grupo para registrar las notas finales del semestre.
                </p>
            </div>

            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                {loading ? (
                    <div className="p-10 text-center text-gray-5">Cargando grupos...</div>
                ) : groups.length === 0 ? (
                    <div className="p-10 text-center text-gray-5">No hay grupos disponibles.</div>
                ) : (
                    <div className="max-w-full overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead>
                                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                    <th className="px-6 py-4 font-medium text-black dark:text-white">
                                        Código
                                    </th>
                                    <th className="px-6 py-4 font-medium text-black dark:text-white">
                                        Nombre del grupo
                                    </th>
                                    <th className="px-6 py-4 font-medium text-black dark:text-white">
                                        Semestre
                                    </th>
                                    <th className="px-6 py-4 font-medium text-black dark:text-white">
                                        Estado
                                    </th>
                                    <th className="px-6 py-4 font-medium text-black dark:text-white text-right">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups.map((group) => (
                                    <tr
                                        key={group.id}
                                        className="border-b border-stroke dark:border-strokedark hover:bg-gray-1 dark:hover:bg-slate-800 transition"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-sm text-black dark:text-white">
                                                {group.group_code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-black dark:text-white">
                                            {group.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-5">
                                            {group.semester?.name ?? group.semester_id}
                                        </td>
                                        <td className="px-6 py-4">
                                            {group.semester?.is_active ? (
                                                <span className="inline-flex rounded-full bg-success bg-opacity-10 px-3 py-1 text-xs font-medium text-success">
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-danger bg-opacity-10 px-3 py-1 text-xs font-medium text-danger">
                                                    Inactivo
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/evaluations/register-final-grades/${group.id}`
                                                    )
                                                }
                                                className="rounded bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-opacity-90 transition"
                                            >
                                                Registrar Notas Finales
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupsPage;