import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Subject } from "../../models/Subject";
import { subjectService } from "../../services/subjectService";
import { rubricService } from "../../services/rubricService";
import { criterionService } from "../../services/criterionService";

interface CriterionDraft {
    tempId: string;
    name: string;
    description: string;
    weight: number;
}

const STEPS = [
    "Información de la rúbrica",
    "Criterios",
    "Revisión",
    "Publicar o guardar",
];

const CreateRubric: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [saving, setSaving] = useState(false);
    const [dragIndex, setDragIndex] = useState<number | null>(null);

    // Form
    const [subjectId, setSubjectId] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [criteria, setCriteria] = useState<CriterionDraft[]>([]);

    useEffect(() => {
        subjectService.getSubjects().then(setSubjects);
    }, []);

    const totalWeight = criteria.reduce(
        (sum, c) => sum + (Number(c.weight) || 0),
        0
    );
    const isWeightValid = Math.round(totalWeight * 100) / 100 === 100;
    const selectedSubject = subjects.find((s) => s.id === subjectId);
    const canPublish =
        title.trim() !== "" && criteria.length > 0 && isWeightValid;
    const allCriteriaFilled = criteria.every((c) => c.name.trim() !== "");

    // ── Criteria management ──────────────────────────────────────────────────

    const addCriterion = () => {
        setCriteria((prev) => [
            ...prev,
            { tempId: crypto.randomUUID(), name: "", description: "", weight: 0 },
        ]);
    };

    const removeCriterion = (tempId: string) => {
        setCriteria((prev) => prev.filter((c) => c.tempId !== tempId));
    };

    const updateCriterion = (
        tempId: string,
        field: keyof CriterionDraft,
        value: string | number
    ) => {
        setCriteria((prev) =>
            prev.map((c) => (c.tempId === tempId ? { ...c, [field]: value } : c))
        );
    };

    // ── Drag and drop ────────────────────────────────────────────────────────

    const handleDragStart = (index: number) => setDragIndex(index);

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === index) return;
        const next = [...criteria];
        const [moved] = next.splice(dragIndex, 1);
        next.splice(index, 0, moved);
        setCriteria(next);
        setDragIndex(index);
    };

    const handleDragEnd = () => setDragIndex(null);

    // ── Navigation ───────────────────────────────────────────────────────────

    const handleNext = () => {
        if (step === 1 && !title.trim()) {
            Swal.fire("Campo requerido", "El título de la rúbrica es obligatorio.", "warning");
            return;
        }
        if (step < 4) setStep((s) => s + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep((s) => s - 1);
    };

    // ── Save / Publish ───────────────────────────────────────────────────────

    const persistRubric = async (publish: boolean) => {
        if (!title.trim()) {
            Swal.fire("Campo requerido", "El título de la rúbrica es obligatorio.", "warning");
            return;
        }
        if (publish && !canPublish) {
            Swal.fire(
                "No se puede publicar",
                "La rúbrica debe tener al menos un criterio y los pesos deben sumar exactamente 100 %.",
                "error"
            );
            return;
        }

        setSaving(true);
        try {
            const rubric = await rubricService.createRubric({ title, description });
            if (!rubric) throw new Error("No se pudo crear la rúbrica");

            for (const c of criteria) {
                if (!c.name.trim()) continue;
                await criterionService.createCriterion({
                    name: c.name,
                    description: c.description,
                    weight: Number(c.weight),
                    rubric_id: rubric.id,
                });
            }

            if (publish) {
                const ok = await rubricService.publishRubric(rubric.id);
                if (!ok) throw new Error("No se pudo publicar la rúbrica");
            }

            await Swal.fire(
                publish ? "Publicada" : "Guardada",
                publish
                    ? "La rúbrica fue publicada correctamente."
                    : "La rúbrica se guardó como borrador. Ahora define las escalas para cada criterio.",
                "success"
            );
            if (publish) {
                navigate("/rubrics");
            } else {
                navigate(`/rubrics/${rubric.id}/scales`);
            }
        } catch (err: any) {
            Swal.fire("Error", err.message || "Ocurrió un error inesperado.", "error");
        } finally {
            setSaving(false);
        }
    };

    // ── Render helpers ───────────────────────────────────────────────────────

    const renderStepper = () => (
        <div className="flex items-center mb-8">
            {STEPS.map((label, i) => {
                const num = i + 1;
                const active = step === num;
                const done = step > num;
                return (
                    <React.Fragment key={num}>
                        <div className="flex items-center gap-2 shrink-0">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                                    active
                                        ? "bg-primary text-white"
                                        : done
                                        ? "bg-success text-white"
                                        : "border-2 border-stroke text-gray-5 dark:border-strokedark"
                                }`}
                            >
                                {done ? (
                                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    num
                                )}
                            </div>
                            <span
                                className={`hidden text-sm md:block ${
                                    active
                                        ? "font-semibold text-primary"
                                        : done
                                        ? "text-success"
                                        : "text-gray-5"
                                }`}
                            >
                                {label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div
                                className={`mx-3 h-px flex-1 transition-colors ${
                                    done ? "bg-success" : "bg-stroke dark:bg-strokedark"
                                }`}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );

    const renderSidebar = () => (
        <div className="space-y-4">
            {/* Resumen */}
            <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
                <h4 className="mb-4 font-semibold text-black dark:text-white">
                    Resumen de la rúbrica
                </h4>
                <dl className="space-y-3 text-sm">
                    <div>
                        <dt className="text-gray-5">Asignatura:</dt>
                        <dd className="font-medium text-black dark:text-white">
                            {selectedSubject
                                ? `${selectedSubject.name} (${selectedSubject.code})`
                                : "No seleccionada"}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-gray-5">Título:</dt>
                        <dd className="font-medium text-black dark:text-white">
                            {title || "—"}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-gray-5">Estado:</dt>
                        <dd className="mt-1">
                            <span className="rounded-full bg-warning bg-opacity-10 px-3 py-1 text-xs font-medium text-warning">
                                Borrador (no publicada)
                            </span>
                        </dd>
                    </div>
                    <div>
                        <dt className="text-gray-5">Criterios:</dt>
                        <dd className="font-medium text-black dark:text-white">
                            {criteria.length}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-gray-5">Suma de pesos:</dt>
                        <dd
                            className={`font-semibold ${
                                isWeightValid ? "text-success" : totalWeight > 0 ? "text-danger" : "text-black dark:text-white"
                            }`}
                        >
                            {totalWeight} %
                        </dd>
                    </div>
                </dl>
            </div>

            {/* Estado publicación */}
            {canPublish ? (
                <div className="rounded-sm border border-success bg-success bg-opacity-5 p-4">
                    <div className="flex items-start gap-2">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-success" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="font-semibold text-success">Listo para publicar</p>
                            <p className="mt-0.5 text-xs text-success text-opacity-80">
                                Puedes publicar esta rúbrica cuando lo desees.
                            </p>
                        </div>
                    </div>
                </div>
            ) : criteria.length > 0 || title ? (
                <div className="rounded-sm border border-danger bg-danger bg-opacity-5 p-4">
                    <p className="text-xs text-danger">
                        La rúbrica necesita al menos un criterio y los pesos deben sumar 100 %.
                    </p>
                </div>
            ) : null}

            {/* CU-09 hint */}
            <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="flex items-start gap-2">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-warning" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <p className="font-semibold text-black dark:text-white">Incluye CU-09</p>
                        <p className="mt-1 text-xs text-gray-5">
                            Después de crear los criterios, puedes definir las escalas de evaluación para cada criterio.
                        </p>
                        <button
                            onClick={() => step === 1 && criteria.length > 0 && setStep(2)}
                            className="mt-2 text-xs font-medium text-primary hover:underline"
                        >
                            Definir escalas (CU-09) →
                        </button>
                    </div>
                </div>
            </div>

            {/* Historial */}
            <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="flex items-center gap-2 mb-2">
                    <svg className="h-4 w-4 text-gray-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-semibold text-black dark:text-white">
                        Historial de la rúbrica
                    </p>
                </div>
                <p className="text-xs text-gray-5">Aún no hay historial.</p>
            </div>
        </div>
    );

    // ── Step 1: Info + Criteria ──────────────────────────────────────────────

    const renderStep1 = () => (
        <div className="space-y-6">
            {/* Info section */}
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                <h3 className="mb-5 font-semibold text-black dark:text-white">
                    Información de la rúbrica
                </h3>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* Asignatura */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Asignatura <span className="text-danger">*</span>
                        </label>
                        <select
                            value={subjectId}
                            onChange={(e) => setSubjectId(e.target.value)}
                            className="w-full rounded border border-stroke bg-transparent px-4 py-2 text-black outline-none transition focus:border-primary dark:border-strokedark dark:text-white dark:focus:border-primary"
                        >
                            <option value="">Selecciona una asignatura</option>
                            {subjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Estado */}
                    <div className="flex flex-col justify-end">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Estado de la rúbrica
                        </label>
                        <span className="inline-flex w-fit rounded-full bg-warning bg-opacity-10 px-4 py-1.5 text-sm font-medium text-warning">
                            Borrador (no publicada)
                        </span>
                    </div>

                    {/* Título */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Título <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej. Rúbrica para Proyecto de Programación"
                            className="w-full rounded border border-stroke bg-transparent px-4 py-2 text-black outline-none transition focus:border-primary dark:border-strokedark dark:text-white dark:focus:border-primary"
                        />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Descripción
                        </label>
                        <div className="relative">
                            <textarea
                                rows={3}
                                maxLength={500}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe el propósito de esta rúbrica..."
                                className="w-full rounded border border-stroke bg-transparent px-4 py-2 text-black outline-none transition focus:border-primary dark:border-strokedark dark:text-white dark:focus:border-primary"
                            />
                            <span className="absolute bottom-2 right-3 text-xs text-gray-5">
                                {description.length}/500
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Criteria section */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-strokedark">
                    <div>
                        <h3 className="font-semibold text-black dark:text-white">
                            Criterios de evaluación
                        </h3>
                        <p className="text-xs text-gray-5 mt-0.5">
                            Agrega los criterios que utilizarás para evaluar. La suma de los pesos debe ser exactamente 100 %.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-1.5 rounded border border-stroke px-3 py-1.5 text-sm text-gray-5 hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4">
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                            </svg>
                            Plantillas de rúbricas
                        </button>
                        <button
                            onClick={addCriterion}
                            className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-sm text-white hover:bg-opacity-90"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Agregar criterio
                        </button>
                    </div>
                </div>

                {criteria.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <svg className="mb-3 h-10 w-10 text-stroke dark:text-strokedark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-sm text-gray-5">Aún no hay criterios.</p>
                        <p className="mt-1 text-xs text-gray-5">
                            Haz clic en "Agregar criterio" para comenzar.
                        </p>
                    </div>
                ) : (
                    <div className="p-4">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-stroke dark:border-strokedark">
                                        <th className="w-8 pb-3" />
                                        <th className="w-8 pb-3 text-left text-xs font-medium text-gray-5">#</th>
                                        <th className="pb-3 text-left text-xs font-medium text-gray-5">
                                            Nombre del criterio
                                        </th>
                                        <th className="pb-3 text-left text-xs font-medium text-gray-5">
                                            Descripción
                                        </th>
                                        <th className="w-28 pb-3 text-left text-xs font-medium text-gray-5">
                                            Peso (%)
                                        </th>
                                        <th className="w-20 pb-3 text-center text-xs font-medium text-gray-5">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {criteria.map((c, i) => (
                                        <tr
                                            key={c.tempId}
                                            draggable
                                            onDragStart={() => handleDragStart(i)}
                                            onDragOver={(e) => handleDragOver(e, i)}
                                            onDragEnd={handleDragEnd}
                                            className={`border-b border-stroke last:border-0 dark:border-strokedark ${
                                                dragIndex === i ? "opacity-50" : ""
                                            }`}
                                        >
                                            {/* Drag handle */}
                                            <td className="py-3 pr-2 cursor-grab text-gray-5">
                                                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                                                </svg>
                                            </td>
                                            <td className="py-3 pr-3 text-gray-5">{i + 1}</td>
                                            <td className="py-3 pr-3">
                                                <input
                                                    type="text"
                                                    value={c.name}
                                                    onChange={(e) =>
                                                        updateCriterion(c.tempId, "name", e.target.value)
                                                    }
                                                    placeholder="Nombre del criterio"
                                                    className="w-full rounded border border-stroke bg-transparent px-2 py-1.5 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white dark:focus:border-primary"
                                                />
                                            </td>
                                            <td className="py-3 pr-3">
                                                <input
                                                    type="text"
                                                    value={c.description}
                                                    onChange={(e) =>
                                                        updateCriterion(c.tempId, "description", e.target.value)
                                                    }
                                                    placeholder="Descripción breve"
                                                    className="w-full rounded border border-stroke bg-transparent px-2 py-1.5 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white dark:focus:border-primary"
                                                />
                                            </td>
                                            <td className="py-3 pr-3">
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        value={c.weight === 0 ? "" : c.weight}
                                                        onChange={(e) =>
                                                            updateCriterion(
                                                                c.tempId,
                                                                "weight",
                                                                e.target.value === ""
                                                                    ? 0
                                                                    : parseFloat(e.target.value) || 0
                                                            )
                                                        }
                                                        placeholder="0"
                                                        className="w-16 rounded border border-stroke bg-transparent px-2 py-1.5 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white dark:focus:border-primary"
                                                    />
                                                    <span className="text-gray-5">%</span>
                                                </div>
                                            </td>
                                            <td className="py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => removeCriterion(c.tempId)}
                                                        className="text-danger hover:text-opacity-70"
                                                        title="Eliminar criterio"
                                                    >
                                                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Weight summary */}
                        <div className="mt-4 flex items-center justify-between border-t border-stroke pt-4 dark:border-strokedark">
                            <div className="flex items-center gap-2 text-xs text-gray-5">
                                <svg className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                Arrastra los criterios para cambiar el orden de evaluación.
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-black dark:text-white">
                                        Suma total de pesos
                                    </span>
                                    <span
                                        className={`text-xl font-bold ${
                                            isWeightValid
                                                ? "text-success"
                                                : "text-danger"
                                        }`}
                                    >
                                        {totalWeight} %
                                    </span>
                                </div>
                                {isWeightValid ? (
                                    <p className="mt-1 flex items-center justify-end gap-1 text-xs text-success">
                                        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        La suma de los pesos es correcta.
                                    </p>
                                ) : criteria.length > 0 ? (
                                    <p className="mt-1 text-xs text-danger">
                                        {totalWeight < 100
                                            ? `Faltan ${(100 - totalWeight).toFixed(1)} % para llegar a 100.`
                                            : `Excede el 100 % en ${(totalWeight - 100).toFixed(1)} %.`}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // ── Step 2: Scales placeholder (HU-09) ──────────────────────────────────

    const renderStep2 = () => (
        <div className="rounded-sm border border-stroke bg-white p-10 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary bg-opacity-10">
                    <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">
                    Definir escalas por criterio (HU-09)
                </h3>
                <p className="max-w-md text-sm text-gray-5">
                    En este paso podrás definir los niveles de calificación para cada criterio (Insuficiente, Básico, Satisfactorio, Excelente…). Esta funcionalidad se implementará en HU-09.
                </p>
                <p className="mt-4 text-xs text-gray-5">
                    Puedes continuar para revisar y guardar la rúbrica sin escalas por ahora.
                </p>
            </div>
        </div>
    );

    // ── Step 3: Review ───────────────────────────────────────────────────────

    const renderStep3 = () => (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
                <h3 className="font-semibold text-black dark:text-white">
                    Revisión de la rúbrica
                </h3>
                <p className="text-xs text-gray-5 mt-0.5">
                    Verifica que todo esté correcto antes de guardar o publicar.
                </p>
            </div>
            <div className="p-6 space-y-6">
                {/* Info */}
                <div className="grid grid-cols-2 gap-4 rounded-md bg-gray-2 p-4 dark:bg-meta-4">
                    <div>
                        <p className="text-xs text-gray-5">Asignatura</p>
                        <p className="mt-0.5 font-medium text-black dark:text-white">
                            {selectedSubject ? `${selectedSubject.name} (${selectedSubject.code})` : "No seleccionada"}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-5">Estado</p>
                        <span className="mt-1 inline-flex rounded-full bg-warning bg-opacity-10 px-3 py-0.5 text-xs font-medium text-warning">
                            Borrador
                        </span>
                    </div>
                    <div>
                        <p className="text-xs text-gray-5">Título</p>
                        <p className="mt-0.5 font-medium text-black dark:text-white">{title || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-5">Descripción</p>
                        <p className="mt-0.5 text-sm text-black dark:text-white">{description || "—"}</p>
                    </div>
                </div>

                {/* Criteria list */}
                <div>
                    <h4 className="mb-3 font-medium text-black dark:text-white">
                        Criterios ({criteria.length})
                    </h4>
                    {criteria.length === 0 ? (
                        <p className="text-sm text-gray-5">Sin criterios añadidos.</p>
                    ) : (
                        <div className="space-y-2">
                            {criteria.map((c, i) => (
                                <div
                                    key={c.tempId}
                                    className="flex items-start gap-3 rounded-md border border-stroke p-3 dark:border-strokedark"
                                >
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary bg-opacity-10 text-xs font-semibold text-primary">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-black dark:text-white">{c.name || "Sin nombre"}</p>
                                        {c.description && (
                                            <p className="text-xs text-gray-5 mt-0.5">{c.description}</p>
                                        )}
                                    </div>
                                    <span
                                        className={`shrink-0 text-sm font-semibold ${
                                            isWeightValid ? "text-success" : "text-danger"
                                        }`}
                                    >
                                        {c.weight} %
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Weight total */}
                <div className={`flex items-center justify-between rounded-md p-3 ${isWeightValid ? "bg-success bg-opacity-5 border border-success" : "bg-danger bg-opacity-5 border border-danger"}`}>
                    <span className="text-sm font-medium text-black dark:text-white">
                        Suma total de pesos
                    </span>
                    <span className={`font-bold ${isWeightValid ? "text-success" : "text-danger"}`}>
                        {totalWeight} %
                    </span>
                </div>
            </div>
        </div>
    );

    // ── Step 4: Publish / Save ───────────────────────────────────────────────

    const renderStep4 = () => (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
                <h3 className="font-semibold text-black dark:text-white">Publicar o guardar</h3>
                <p className="text-xs text-gray-5 mt-0.5">
                    Elige cómo deseas guardar tu rúbrica.
                </p>
            </div>
            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
                {/* Draft option */}
                <div className="rounded-md border-2 border-stroke p-6 dark:border-strokedark">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-2 dark:bg-meta-4">
                        <svg className="h-5 w-5 text-gray-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                    </div>
                    <h4 className="mb-1 font-semibold text-black dark:text-white">
                        Guardar como borrador
                    </h4>
                    <p className="mb-4 text-sm text-gray-5">
                        La rúbrica quedará guardada pero no será visible para otros. Podrás editarla y publicarla después.
                    </p>
                    <button
                        onClick={() => persistRubric(false)}
                        disabled={saving}
                        className="w-full rounded border border-stroke py-2 text-sm font-medium text-black hover:bg-gray-2 disabled:opacity-50 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                    >
                        {saving ? "Guardando..." : "Guardar como borrador"}
                    </button>
                </div>

                {/* Publish option */}
                <div className={`rounded-md border-2 p-6 ${canPublish ? "border-primary" : "border-stroke opacity-60 dark:border-strokedark"}`}>
                    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${canPublish ? "bg-primary bg-opacity-10" : "bg-gray-2 dark:bg-meta-4"}`}>
                        <svg className={`h-5 w-5 ${canPublish ? "text-primary" : "text-gray-5"}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h4 className="mb-1 font-semibold text-black dark:text-white">
                        Publicar rúbrica
                    </h4>
                    <p className="mb-4 text-sm text-gray-5">
                        La rúbrica será visible y podrá asociarse a evaluaciones. Una rúbrica publicada no puede eliminarse, solo archivarse.
                    </p>
                    <button
                        onClick={() => persistRubric(true)}
                        disabled={saving || !canPublish}
                        className="w-full rounded bg-primary py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving ? "Publicando..." : "Publicar rúbrica"}
                    </button>
                    {!canPublish && (
                        <p className="mt-2 text-center text-xs text-danger">
                            {criteria.length === 0
                                ? "Agrega al menos un criterio."
                                : !isWeightValid
                                ? "Los pesos deben sumar 100 %."
                                : "El título es obligatorio."}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );

    // ── Main render ──────────────────────────────────────────────────────────

    return (
        <div>
            {/* Page header */}
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-black dark:text-white">
                    Crear rúbrica de evaluación
                </h2>
                <p className="text-sm text-gray-5">
                    Diseña los criterios y asigna los pesos porcentuales para tu rúbrica.
                </p>
            </div>

            {/* Stepper */}
            {renderStepper()}

            {/* Content + Sidebar */}
            <div className="flex gap-6">
                {/* Main */}
                <div className="flex-1 min-w-0">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}
                </div>

                {/* Sidebar */}
                <div className="w-72 shrink-0">{renderSidebar()}</div>
            </div>

            {/* Bottom action bar */}
            <div className="mt-6 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="rounded border border-stroke px-6 py-2 text-sm text-gray-5 hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4"
                >
                    Cancelar
                </button>

                <div className="flex gap-3">
                    {step > 1 && (
                        <button
                            onClick={handleBack}
                            className="rounded border border-stroke px-6 py-2 text-sm text-black hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                        >
                            Atrás
                        </button>
                    )}

                    {step < 4 ? (
                        <>
                            {step === 1 && (
                                <button
                                    onClick={() => persistRubric(false)}
                                    disabled={saving || !title.trim()}
                                    className="flex items-center gap-2 rounded border border-stroke px-6 py-2 text-sm text-black hover:bg-gray-2 disabled:opacity-50 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                    Guardar como borrador
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 rounded bg-primary px-6 py-2 text-sm text-white hover:bg-opacity-90"
                            >
                                Revisar y continuar
                                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </>
                    ) : null}
                </div>
            </div>

            {/* Error banner */}
            {step === 1 && criteria.length > 0 && !isWeightValid && (
                <div className="mt-4 flex items-center gap-2 rounded-md border border-danger bg-danger bg-opacity-5 px-4 py-3">
                    <svg className="h-4 w-4 shrink-0 text-danger" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-danger">
                        <span className="font-semibold">No se puede publicar:</span> la rúbrica debe tener al menos un criterio y la suma de los pesos debe ser 100 %.
                    </p>
                </div>
            )}
        </div>
    );
};

export default CreateRubric;
