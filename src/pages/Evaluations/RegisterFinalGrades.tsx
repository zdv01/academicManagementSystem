import React, { useState, useEffect } from 'react';
import { finalGradeService } from '../../services/finalGradeService'; // Ajusta la ruta a tu estructura
import { GradeReportGenerator } from '../../utils/gradeReportGenerator'; // Ajusta la ruta a tu estructura
import { ConsolidatedGrade } from '../../models/dto/consolidatedGrade';
import { RegisterFinalGradeRequest } from '../../models/dto/registerFinalGradeRequest';

interface Props {
    groupId: string;
    groupCode: string;
    subjectName: string;
    semesterName: string;
    isSemesterActive: boolean; // Precondición y Excepción E2
}

const ConsolidatedGradesModule: React.FC<Props> = ({
    groupId,
    groupCode,
    subjectName,
    semesterName,
    isSemesterActive
}) => {
    // ── ESTADOS DEL COMPONENTE ───────────────────────────────────────────────
    const [grades, setGrades] = useState<ConsolidatedGrade[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    
    // Alertas de la validación del Backend (Excepción E1)
    const [isReady, setIsReady] = useState<boolean>(true);
    const [incompleteStudents, setIncompleteStudents] = useState<string[]>([]);
    const [validationMessage, setValidationMessage] = useState<string>("");

    // ── CARGA DE DATOS E INICIALIZACIÓN ──────────────────────────────────────
    const loadGroupData = async () => {
        setLoading(true);
        try {
            // 1. Validar el estado de completitud del grupo (Permisivo por ahora)
            try {
                const readiness = await finalGradeService.validateGroupReadiness(groupId);
                setIsReady(readiness.isReady);
                setIncompleteStudents(readiness.incompleteStudents || []);
                setValidationMessage(readiness.message || "");
            } catch (e) {
                console.warn("Servicio de validación readiness no disponible o fallando. Ignorado por desarrollo.");
                setIsReady(true);
            }

            // 2. Traer las notas consolidadas y ponderadas desde el servidor
            const consolidatedData = await finalGradeService.getConsolidatedGradesByGroup(groupId);
            
            // Inyectar observaciones por defecto automáticas sin bloquear nada
            const mappedData = (consolidatedData || []).map(student => {
                const hasIncompleteEvaluations = incompleteStudents.includes(student.student_id);
                return {
                    ...student,
                    observations: student.observations 
                        ? student.observations 
                        : hasIncompleteEvaluations 
                            ? "Nota calculada parcialmente. Faltan evaluaciones por calificar." 
                            : ""
                };
            });
            
            setGrades(mappedData);
        } catch (error) {
            console.error("Error al inicializar el módulo:", error);
            // Fallback para que no se quede la pantalla cargando infinitamente si el backend falla
            setGrades([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Ejecutar siempre sin importar si el semestre está activo o no por ahora
        loadGroupData();
    }, [groupId]);

    // ── MANEJO DE CAMBIOS EN LAS OBSERVACIONES ────────────────────────────────
    const handleObservationChange = (enrollmentId: string, text: string) => {
        setGrades(prevGrades =>
            prevGrades.map(g => (g.enrollment_id === enrollmentId ? { ...g, observations: text } : g))
        );
    };

    // ── REGISTRO OFICIAL EN LOTE (BATCH) ─────────────────────────────────────
    const handleConfirmRegistration = async () => {
        setIsSaving(true);

        // Mapeamos al DTO requerido por la API: RegisterFinalGradeRequest[]
        const requestPayload: RegisterFinalGradeRequest[] = grades.map(g => ({
            enrollment_id: g.enrollment_id,
            group_id: groupId,
            final_grade: g.weighted_final_grade,
            observations: g.observations || undefined,
            is_locked: true 
        }));

        try {
            const success = await finalGradeService.registerFinalGradesBatch(groupId, requestPayload);
            if (success) {
                alert("¡Lote procesado exitosamente!");
                await loadGroupData();
            } else {
                alert("El servidor devolvió un estado falso, pero forzaremos recarga de datos.");
                await loadGroupData();
            }
        } catch (error) {
            console.error("Error al registrar notas en lote:", error);
            alert("Error de red o de servidor al guardar. Revisa la consola.");
        } finally {
            setIsSaving(false);
        }
    };

    // ── ACCIONADORES DEL REPORTE GENERATOR ────────────────────────────────────
    const handleDownloadPDFReport = async () => {
        if (GradeReportGenerator && typeof GradeReportGenerator.generateGradeTablePDF === 'function') {
            await GradeReportGenerator.generateGradeTablePDF(grades, `${subjectName}_G${groupCode}`, semesterName);
        } else {
            alert("GradeReportGenerator o generateGradeTablePDF no está disponible en este entorno.");
        }
    };

    // Obtener los nombres únicos de las evaluaciones del primer estudiante para construir dinámicamente los headers de la tabla
    const evaluationHeaders = grades[0]?.evaluation_details || [];
    // Desactivado temporalmente para permitir edición sin importar que ya esté bloqueado en la base de datos
    

    return (
        <div className="mx-auto max-w-7xl">
            {/* AVISO TEMPORAL DE SEMESTRE INACTIVO (Modo Permisivo) */}
            {!isSemesterActive && (
                <div className="mb-4 rounded border border-danger bg-danger bg-opacity-10 p-3 text-danger text-sm font-medium">
                    ⚠️ <strong>Modo Sandbox/Desarrollo activo:</strong> El semestre figura como INACTIVO en las propiedades, pero el bloqueo de pantalla estricto ha sido deshabilitado temporalmente.
                </div>
            )}

            {/* Encabezado e Información del Grupo */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-black dark:text-white">
                        Consolidación y Registro Oficial de Notas
                    </h2>
                    <p className="text-sm text-gray-5 mt-1">
                        {subjectName} — <span className="font-medium">Grupo {groupCode}</span> | Semestre Académico: {semesterName}
                    </p>
                </div>

                {/* Descarga del Reporte PDF habilitada */}
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            if (GradeReportGenerator && typeof GradeReportGenerator.downloadCSV === 'function') {
                                GradeReportGenerator.downloadCSV(grades, `Notas_${subjectName}.csv`);
                            } else {
                                alert("Función downloadCSV no disponible.");
                            }
                        }}
                        className="flex items-center gap-2 rounded border border-stroke bg-white px-4 py-2 text-sm font-medium text-black hover:shadow-1 dark:border-strokedark dark:bg-boxdark dark:text-white"
                    >
                        Exportar CSV
                    </button>
                    <button
                        onClick={handleDownloadPDFReport}
                        className="flex items-center gap-2 rounded bg-success px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 transition"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Descargar Acta PDF
                    </button>
                </div>
            </div>

            {/* Banner de Advertencia Informativo - No Bloqueante */}
            {!isReady && (
                <div className="mb-6 flex items-start gap-4 rounded-sm border border-warning bg-warning bg-opacity-5 p-4 dark:border-strokedark">
                    <div className="mt-0.5 text-warning">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-warning-2">Aviso: Calificaciones Incompletas en el Grupo</h4>
                        <p className="text-xs text-warning mt-1">{validationMessage || "Existen estudiantes con evaluaciones sin registrar en el sistema."}</p>
                        {incompleteStudents.length > 0 && (
                            <p className="text-xs text-warning font-medium mt-1">
                                IDs afectados: {incompleteStudents.join(', ')}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Estado General del Cierre */}
            <div className="mb-4 flex justify-between items-center">
                <span className="text-sm text-gray-5">
                    Estudiantes inscritos activos: <span className="font-semibold text-black dark:text-white">{grades.length}</span>
                </span>
                <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-warning bg-opacity-10 text-warning">
                    📝 Modo permisivo (Edición Abierta)
                </span>
            </div>

            {/* Tabla de Consolidación */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                {loading ? (
                    <div className="p-10 text-center text-gray-5">Procesando y calculando matriz de notas ponderadas...</div>
                ) : grades.length === 0 ? (
                    <div className="p-10 text-center text-gray-5">No se encontraron registros de estudiantes o el servicio retornó un arreglo vacío.</div>
                ) : (
                    <div className="max-w-full overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead>
                                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                    <th className="min-w-[250px] px-4 py-4 font-medium text-black dark:text-white xl:pl-8">
                                        Identificación y Estudiante
                                    </th>
                                    {/* Columnas dinámicas mapeadas según las evaluaciones del DTO */}
                                    {evaluationHeaders.map((ev, index) => (
                                        <th key={index} className="px-3 py-4 font-medium text-black dark:text-white text-center text-xs min-w-[100px]">
                                            <span className="block truncate max-w-[120px]" title={ev.evaluation_name}>
                                                {ev.evaluation_name}
                                            </span>
                                            <span className="block text-[10px] text-gray-5 font-normal">({ev.evaluation_weight}%)</span>
                                        </th>
                                    ))}
                                    <th className="px-4 py-4 font-medium text-black dark:text-white text-center bg-gray-3 dark:bg-slate-700 min-w-[100px]">
                                        Nota Final
                                    </th>
                                    <th className="min-w-[260px] px-4 py-4 font-medium text-black dark:text-white">
                                        Observación Oficial
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {grades.map((student) => (
                                    <tr key={student.enrollment_id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-1 dark:hover:bg-slate-800 transition">
                                        <td className="px-4 py-4 pl-8 dark:border-strokedark">
                                            <h5 className="font-medium text-sm text-black dark:text-white">
                                                {student.student_name}
                                            </h5>
                                            <p className="text-[11px] text-gray-5">ID: {student.identification} | <span className="text-[10px] bg-slate-100 dark:bg-meta-4 px-1 rounded">{student.status}</span></p>
                                        </td>
                                        
                                        {/* Detalle por evaluación mapeado */}
                                        {(student.evaluation_details || []).map((detail, idx) => (
                                            <td key={idx} className="px-3 py-4 text-center text-sm dark:border-strokedark">
                                                <div className="font-medium text-black dark:text-white">
                                                    {detail.grade_value !== null && detail.grade_value !== undefined ? (
                                                        detail.grade_value.toFixed(1)
                                                    ) : (
                                                        <span className="text-danger font-semibold text-xs">N/C</span>
                                                    )}
                                                </div>
                                                <span className="block text-[10px] text-gray-5">
                                                    +{detail.calculated_contribution ? detail.calculated_contribution.toFixed(2) : "0.00"}
                                                </span>
                                            </td>
                                        ))}

                                        {/* Celda Nota Final Calculada */}
                                        <td className="px-4 py-4 text-center dark:border-strokedark bg-gray-2 bg-opacity-40 dark:bg-meta-4 font-bold text-base">
                                            <span className={student.weighted_final_grade >= 3.0 ? 'text-success' : 'text-danger'}>
                                                {student.weighted_final_grade ? student.weighted_final_grade.toFixed(2) : "0.00"}
                                            </span>
                                        </td>

                                        {/* Observaciones Siempre Habilitadas */}
                                        <td className="px-4 py-4 dark:border-strokedark">
                                            <input
                                                type="text"
                                                value={student.observations || ""}
                                                onChange={(e) => handleObservationChange(student.enrollment_id, e.target.value)}
                                                placeholder="Ingrese una observación oficial..."
                                                className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-xs text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Barra de Acciones Inferior */}
            <div className="mt-6 flex flex-col gap-4 rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-gray-5 max-w-xl">
                    <p>
                        💡 Puedes modificar las observaciones y hacer clic en <strong>Confirmar Registro Oficial</strong> para simular el envío masivo al Backend.
                    </p>
                </div>

                <div className="flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={() => alert("Simulación: Redirigiendo a pantalla de Calificaciones por Evaluación (CU-10)...")}
                        className="rounded border border-stroke px-4 py-2 text-sm font-medium text-black hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4 transition"
                    >
                        Corregir Evaluaciones (CU-10)
                    </button>

                    <button
                        onClick={handleConfirmRegistration}
                        disabled={isSaving || grades.length === 0}
                        className="rounded px-5 py-2 text-sm font-medium text-white shadow-sm transition bg-primary hover:bg-opacity-90 disabled:opacity-50"
                    >
                        {isSaving ? 'Registrando en Lote...' : 'Confirmar Registro Oficial'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConsolidatedGradesModule;