import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Rubric } from "../../models/Rubric";
import { Criterion } from "../../models/Criterion";
import { Scale } from "../../models/Scale";
import { rubricService } from "../../services/rubricService";
import { criterionService } from "../../services/criterionService";
import { scaleService } from "../../services/scaleService";

interface ScaleDraft {
    id?: string;
    tempId: string;
    name: string;
    description: string;
    value: number | string;
    isSaved: boolean;
    isDirty: boolean;
}

const MIN_SCALES = 2;
const MAX_SCALES = 5;

const DefineScales: React.FC = () => {
    const { rubricId } = useParams<{ rubricId: string }>();
    const navigate = useNavigate();

    const [rubric, setRubric] = useState<Rubric | null>(null);
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [scaleMap, setScaleMap] = useState<Record<string, ScaleDraft[]>>({});
    const [deletedIds, setDeletedIds] = useState<string[]>([]);
    const [selectedCriterionId, setSelectedCriterionId] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showReuseModal, setShowReuseModal] = useState(false);
    const [allScales, setAllScales] = useState<Scale[]>([]);
    const [dragScaleIndex, setDragScaleIndex] = useState<number | null>(null);

    useEffect(() => {
        if (rubricId) loadData();
    }, [rubricId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [rubricData, allCriteria, scales] = await Promise.all([
                rubricService.getRubricById(rubricId!),
                criterionService.getCriteria(),
                scaleService.getScales(),
            ]);

            setRubric(rubricData);
            setAllScales(scales);

            const rubricCriteria = allCriteria.filter(
                (c) => c.rubric_id === rubricId
            );
            setCriteria(rubricCriteria);

            const map: Record<string, ScaleDraft[]> = {};
            for (const c of rubricCriteria) {
                const existing = scales.filter((s) => s.criterion_id === c.id);
                map[c.id] = existing.map((s) => ({
                    id: s.id,
                    tempId: s.id,
                    name: s.name,
                    description: s.description,
                    value: s.value,
                    isSaved: true,
                    isDirty: false,
                }));
            }
            setScaleMap(map);

            if (rubricCriteria.length > 0) {
                setSelectedCriterionId(rubricCriteria[0].id);
            }
        } catch {
            Swal.fire("Error", "No se pudo cargar la rúbrica.", "error");
        } finally {
            setLoading(false);
        }
    };

    // ── Computed values ──────────────────────────────────────────────────────

    const selectedCriterion = criteria.find((c) => c.id === selectedCriterionId);
    const currentScales = scaleMap[selectedCriterionId] ?? [];

    const criteriaWithEnoughScales = criteria.filter(
        (c) => (scaleMap[c.id] ?? []).length >= MIN_SCALES
    );
    const progress =
        criteria.length > 0
            ? Math.round((criteriaWithEnoughScales.length / criteria.length) * 100)
            : 0;

    const criteriaWithFewScales = criteria.filter(
        (c) => (scaleMap[c.id] ?? []).length < MIN_SCALES
    );

    const currentValues = currentScales.map((s) => Number(s.value));
    const hasDuplicateValues = new Set(currentValues).size !== currentValues.length;

    // ── Scale management ─────────────────────────────────────────────────────

    const updateScale = (
        tempId: string,
        field: keyof ScaleDraft,
        value: string | number
    ) => {
        setScaleMap((prev) => ({
            ...prev,
            [selectedCriterionId]: prev[selectedCriterionId].map((s) =>
                s.tempId === tempId
                    ? { ...s, [field]: value, isDirty: true }
                    : s
            ),
        }));
    };

    const addScale = () => {
        if (currentScales.length >= MAX_SCALES) return;
        setScaleMap((prev) => ({
            ...prev,
            [selectedCriterionId]: [
                ...(prev[selectedCriterionId] ?? []),
                {
                    tempId: crypto.randomUUID(),
                    name: "",
                    description: "",
                    value: "",
                    isSaved: false,
                    isDirty: false,
                },
            ],
        }));
    };

    const removeScale = (tempId: string) => {
        const scale = currentScales.find((s) => s.tempId === tempId);
        if (scale?.id) {
            setDeletedIds((prev) => [...prev, scale.id!]);
        }
        setScaleMap((prev) => ({
            ...prev,
            [selectedCriterionId]: prev[selectedCriterionId].filter(
                (s) => s.tempId !== tempId
            ),
        }));
    };

    // ── Drag & drop ──────────────────────────────────────────────────────────

    const handleDragStart = (index: number) => setDragScaleIndex(index);

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (dragScaleIndex === null || dragScaleIndex === index) return;
        const next = [...currentScales];
        const [moved] = next.splice(dragScaleIndex, 1);
        next.splice(index, 0, moved);
        setScaleMap((prev) => ({ ...prev, [selectedCriterionId]: next }));
        setDragScaleIndex(index);
    };

    // ── Reutilizar ───────────────────────────────────────────────────────────

    const cloneScale = async (scale: Scale) => {
        const valueExists = currentScales.some(
            (s) => Number(s.value) === scale.value
        );
        if (valueExists) {
            Swal.fire(
                "Valor duplicado",
                `Ya existe un nivel con valor ${scale.value} en este criterio.`,
                "warning"
            );
            return;
        }
        setScaleMap((prev) => ({
            ...prev,
            [selectedCriterionId]: [
                ...(prev[selectedCriterionId] ?? []),
                {
                    tempId: crypto.randomUUID(),
                    name: scale.name,
                    description: scale.description,
                    value: scale.value,
                    isSaved: false,
                    isDirty: false,
                },
            ],
        }));
        setShowReuseModal(false);
    };

    // ── Save logic ───────────────────────────────────────────────────────────

    const saveChanges = async (): Promise<boolean> => {
        setSaving(true);
        let hasError = false;
        try {
            // 1. Delete removed saved scales
            for (const id of deletedIds) {
                await scaleService.deleteScale(id);
            }
            setDeletedIds([]);

            // 2. For each criterion, process its scales
            for (const criterionId of Object.keys(scaleMap)) {
                for (const s of scaleMap[criterionId]) {
                    if (!s.name.trim() || s.value === "" || s.value === null) continue;

                    if (!s.isSaved) {
                        // POST new
                        const created = await scaleService.createScale({
                            name: s.name,
                            description: s.description,
                            value: Number(s.value),
                            criterion_id: criterionId,
                        });
                        if (!created) hasError = true;
                    } else if (s.isDirty && s.id) {
                        // PUT updated
                        const updated = await scaleService.updateScale(s.id, {
                            name: s.name,
                            description: s.description,
                            value: Number(s.value),
                            criterion_id: criterionId,
                        });
                        if (!updated) hasError = true;
                    }
                }
            }

            if (hasError) {
                Swal.fire(
                    "Advertencia",
                    "Algunos cambios no pudieron guardarse (posible valor duplicado).",
                    "warning"
                );
                return false;
            }

            // Reload to get fresh IDs
            await loadData();
            return true;
        } catch {
            Swal.fire("Error", "No se pudieron guardar los cambios.", "error");
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        const ok = await saveChanges();
        if (ok) {
            Swal.fire("Guardado", "Escalas guardadas correctamente.", "success");
        }
    };

    const handleContinue = async () => {
        if (criteriaWithFewScales.length > 0) {
            const names = criteriaWithFewScales.map((c) => `"${c.name}"`).join(", ");
            Swal.fire(
                "No se puede publicar",
                `${
                    criteriaWithFewScales.length === 1
                        ? `El criterio ${names} tiene`
                        : `Los criterios ${names} tienen`
                } menos de ${MIN_SCALES} niveles de escala definidos.`,
                "error"
            );
            return;
        }

        const saved = await saveChanges();
        if (!saved) return;

        const published = await rubricService.publishRubric(rubricId!);
        if (published) {
            await Swal.fire(
                "Publicada",
                "La rúbrica fue publicada correctamente.",
                "success"
            );
            navigate("/rubrics");
        } else {
            Swal.fire(
                "Error al publicar",
                "Los cambios se guardaron pero no se pudo publicar la rúbrica.",
                "error"
            );
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex h-60 items-center justify-center">
                <p className="text-gray-5">Cargando rúbrica...</p>
            </div>
        );
    }

    if (!rubric) {
        return (
            <div className="flex h-60 items-center justify-center">
                <p className="text-danger">Rúbrica no encontrada.</p>
            </div>
        );
    }

    // Scales from other criteria in this rubric (for reutilizar)
    const otherCriteriaIds = criteria
        .filter((c) => c.id !== selectedCriterionId)
        .map((c) => c.id);
    const reusableScales = allScales.filter((s) =>
        otherCriteriaIds.includes(s.criterion_id)
    );

    return (
        <div>
            {/* Page header */}
            <div className="mb-4">
                <h2 className="text-2xl font-semibold text-black dark:text-white">
                    Definir criterios y escalas
                </h2>
                <p className="text-sm text-gray-5">
                    Define los niveles de desempeño (escalas) para cada criterio de la rúbrica.
                </p>
            </div>

            {/* Rubric info bar */}
            <div className="mb-5 flex flex-wrap items-center gap-4 rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary bg-opacity-10">
                        <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs text-gray-5">Rúbrica</p>
                        <p className="font-semibold text-black dark:text-white">{rubric.title}</p>
                        <span className="mt-0.5 inline-flex rounded-full bg-warning bg-opacity-10 px-2 py-0.5 text-xs font-medium text-warning">
                            Borrador (no publicada)
                        </span>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-8">
                    <div className="text-center">
                        <p className="text-xs text-gray-5">Criterios</p>
                        <p className="font-semibold text-black dark:text-white">{criteria.length}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-5">Suma de pesos</p>
                        <p className="font-semibold text-success">
                            {criteria.reduce((s, c) => s + c.weight, 0)} %
                        </p>
                    </div>
                </div>
            </div>

            {/* Info banner + Reutilizar button */}
            <div className="mb-4 flex items-center justify-between rounded-sm border border-primary border-opacity-30 bg-primary bg-opacity-5 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-primary">
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Selecciona un criterio para definir sus niveles de desempeño. Cada criterio debe tener entre {MIN_SCALES} y {MAX_SCALES} niveles de escala.
                </div>
                <button
                    onClick={() => setShowReuseModal(true)}
                    disabled={!selectedCriterionId || reusableScales.length === 0}
                    className="flex shrink-0 items-center gap-1.5 rounded border border-stroke px-3 py-1.5 text-sm text-black hover:bg-gray-2 disabled:opacity-40 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Reutilizar escala existente
                </button>
            </div>

            {/* Main 3-column layout */}
            <div className="flex gap-5">
                {/* Left: criteria list */}
                <div className="w-72 shrink-0">
                    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                        <div className="border-b border-stroke px-4 py-3 dark:border-strokedark">
                            <h4 className="font-semibold text-black dark:text-white">
                                Criterios de la rúbrica
                            </h4>
                        </div>
                        <div className="p-2 space-y-1.5">
                            {criteria.map((c, i) => {
                                const scales = scaleMap[c.id] ?? [];
                                const count = scales.length;
                                const isSelected = c.id === selectedCriterionId;
                                const isReady = count >= MIN_SCALES;

                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => setSelectedCriterionId(c.id)}
                                        className={`w-full rounded-md p-3 text-left transition ${
                                            isSelected
                                                ? "border-2 border-primary bg-primary bg-opacity-5"
                                                : "border border-stroke hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-medium text-black dark:text-white text-sm">
                                                {i + 1}. {c.name}
                                            </p>
                                            <span className="shrink-0 text-xs font-semibold text-primary">
                                                {c.weight} %
                                            </span>
                                        </div>
                                        {c.description && (
                                            <p className="mt-0.5 text-xs text-gray-5 line-clamp-2">
                                                {c.description}
                                            </p>
                                        )}
                                        <div className="mt-2 flex items-center gap-1">
                                            {isReady ? (
                                                <svg className="h-3.5 w-3.5 text-success" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg className="h-3.5 w-3.5 text-warning" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            <span
                                                className={`text-xs ${
                                                    isReady ? "text-success" : count === 0 ? "text-warning" : "text-warning"
                                                }`}
                                            >
                                                {count === 0
                                                    ? "0 niveles definidos"
                                                    : `${count} nivel${count !== 1 ? "es" : ""} definido${count !== 1 ? "s" : ""}`}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="border-t border-stroke p-3 dark:border-strokedark">
                            <button className="flex w-full items-center justify-center gap-1.5 py-1 text-sm text-gray-5 hover:text-black dark:hover:text-white">
                                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                                Vista general de la rúbrica
                            </button>
                        </div>
                    </div>
                </div>

                {/* Center: scale editor */}
                <div className="flex-1 min-w-0">
                    {selectedCriterion ? (
                        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                            {/* Header */}
                            <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-black dark:text-white">
                                            Definir escalas para:{" "}
                                            <span className="text-primary">
                                                {selectedCriterion.name}
                                            </span>
                                        </h3>
                                        {selectedCriterion.description && (
                                            <p className="mt-0.5 text-sm text-gray-5">
                                                {selectedCriterion.description}
                                            </p>
                                        )}
                                    </div>
                                    <span className="shrink-0 rounded-full bg-primary bg-opacity-10 px-3 py-1 text-sm font-semibold text-primary">
                                        Peso del criterio: {selectedCriterion.weight} %
                                    </span>
                                </div>
                            </div>

                            <div className="p-6">
                                {/* Scales section header */}
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-black dark:text-white">
                                            Niveles de desempeño
                                        </h4>
                                        <p className="text-xs text-gray-5 mt-0.5">
                                            Agrega entre {MIN_SCALES} y {MAX_SCALES} niveles de escala.
                                        </p>
                                    </div>
                                    <button
                                        onClick={addScale}
                                        disabled={currentScales.length >= MAX_SCALES}
                                        className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-sm text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                        Agregar nivel
                                    </button>
                                </div>

                                {currentScales.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-stroke py-10 dark:border-strokedark">
                                        <p className="text-sm text-gray-5">Sin niveles definidos.</p>
                                        <p className="mt-1 text-xs text-gray-5">
                                            Haz clic en "Agregar nivel" para comenzar.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-stroke dark:border-strokedark">
                                                        <th className="w-6 pb-3" />
                                                        <th className="w-10 pb-3 text-left text-xs font-medium text-gray-5">
                                                            Nivel
                                                        </th>
                                                        <th className="w-36 pb-3 text-left text-xs font-medium text-gray-5">
                                                            Nombre (etiqueta)
                                                        </th>
                                                        <th className="pb-3 text-left text-xs font-medium text-gray-5">
                                                            Descripción
                                                        </th>
                                                        <th className="w-24 pb-3 text-left text-xs font-medium text-gray-5">
                                                            Valor
                                                        </th>
                                                        <th className="w-20 pb-3 text-center text-xs font-medium text-gray-5">
                                                            Acciones
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentScales.map((s, i) => (
                                                        <tr
                                                            key={s.tempId}
                                                            draggable
                                                            onDragStart={() => handleDragStart(i)}
                                                            onDragOver={(e) => handleDragOver(e, i)}
                                                            onDragEnd={() => setDragScaleIndex(null)}
                                                            className={`border-b border-stroke last:border-0 dark:border-strokedark ${
                                                                dragScaleIndex === i ? "opacity-50" : ""
                                                            }`}
                                                        >
                                                            <td className="py-3 pr-2 cursor-grab text-gray-5">
                                                                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                                                                </svg>
                                                            </td>
                                                            <td className="py-3 pr-3 text-gray-5">{i + 1}</td>
                                                            <td className="py-3 pr-3">
                                                                <input
                                                                    type="text"
                                                                    value={s.name}
                                                                    onChange={(e) =>
                                                                        updateScale(s.tempId, "name", e.target.value)
                                                                    }
                                                                    placeholder="Ej. Excelente"
                                                                    className="w-full rounded border border-stroke bg-transparent px-2 py-1.5 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white dark:focus:border-primary"
                                                                />
                                                            </td>
                                                            <td className="py-3 pr-3">
                                                                <textarea
                                                                    rows={2}
                                                                    value={s.description}
                                                                    onChange={(e) =>
                                                                        updateScale(s.tempId, "description", e.target.value)
                                                                    }
                                                                    placeholder="Describe este nivel de desempeño..."
                                                                    className="w-full rounded border border-stroke bg-transparent px-2 py-1.5 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white dark:focus:border-primary"
                                                                />
                                                            </td>
                                                            <td className="py-3 pr-3">
                                                                <input
                                                                    type="number"
                                                                    value={s.value}
                                                                    onChange={(e) =>
                                                                        updateScale(
                                                                            s.tempId,
                                                                            "value",
                                                                            e.target.value === ""
                                                                                ? ""
                                                                                : parseFloat(e.target.value)
                                                                        )
                                                                    }
                                                                    placeholder="100"
                                                                    className="w-20 rounded border border-stroke bg-transparent px-2 py-1.5 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white dark:focus:border-primary"
                                                                />
                                                            </td>
                                                            <td className="py-3 text-center">
                                                                <button
                                                                    onClick={() => removeScale(s.tempId)}
                                                                    className="text-danger hover:text-opacity-70"
                                                                    title="Eliminar nivel"
                                                                >
                                                                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Hints + validation */}
                                        <div className="mt-4 flex items-start justify-between gap-4">
                                            <div className="rounded-md bg-primary bg-opacity-5 px-3 py-2 text-xs text-primary">
                                                <p>El valor debe ser único dentro del mismo criterio.</p>
                                                <p>Puedes arrastrar los niveles para cambiar su orden.</p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-sm font-medium text-black dark:text-white">
                                                    Validación del criterio
                                                </p>
                                                <p
                                                    className={`mt-0.5 text-xs ${
                                                        currentScales.length >= MIN_SCALES
                                                            ? "text-success"
                                                            : "text-warning"
                                                    }`}
                                                >
                                                    {currentScales.length} nivel{currentScales.length !== 1 ? "es" : ""} definido{currentScales.length !== 1 ? "s" : ""}
                                                    {" "}(mínimo requerido: {MIN_SCALES})
                                                </p>
                                                {hasDuplicateValues && (
                                                    <p className="mt-0.5 text-xs text-danger">
                                                        ⚠ Hay valores duplicados en este criterio.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-60 items-center justify-center rounded-sm border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
                            <p className="text-sm text-gray-5">
                                Selecciona un criterio de la lista.
                            </p>
                        </div>
                    )}
                </div>

                {/* Right sidebar */}
                <div className="w-64 shrink-0 space-y-4">
                    {/* Summary */}
                    <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <h4 className="mb-3 font-semibold text-black dark:text-white">
                            Resumen de la rúbrica
                        </h4>
                        <dl className="space-y-2 text-sm">
                            <div>
                                <dt className="text-xs text-gray-5">Estado:</dt>
                                <dd className="mt-0.5">
                                    <span className="rounded-full bg-warning bg-opacity-10 px-2 py-0.5 text-xs font-medium text-warning">
                                        Borrador (no publicada)
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-5">Criterios:</dt>
                                <dd className="font-medium text-black dark:text-white">
                                    {criteria.length}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-5">Suma de pesos:</dt>
                                <dd className="font-semibold text-success">
                                    {criteria.reduce((s, c) => s + c.weight, 0)} %
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Reuse hint */}
                    <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <div className="flex items-start gap-2">
                            <svg className="mt-0.5 h-4 w-4 shrink-0 text-warning" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="font-semibold text-black dark:text-white">
                                    Reutilizar escala existente
                                </p>
                                <p className="mt-1 text-xs text-gray-5">
                                    Puedes clonar los niveles de una escala que ya hayas definido en otro criterio.
                                </p>
                                <button
                                    onClick={() => setShowReuseModal(true)}
                                    disabled={reusableScales.length === 0}
                                    className="mt-2 text-xs font-medium text-primary hover:underline disabled:opacity-40"
                                >
                                    Ver escalas existentes →
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Rules */}
                    <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <h4 className="mb-3 font-semibold text-black dark:text-white">Reglas</h4>
                        <ul className="space-y-2">
                            {[
                                `Cada criterio debe tener entre ${MIN_SCALES} y ${MAX_SCALES} niveles de escala.`,
                                "El valor de cada nivel debe ser único dentro del mismo criterio.",
                                `Para publicar la rúbrica, todos los criterios deben tener al menos ${MIN_SCALES} niveles definidos.`,
                                "Los valores pueden ser numéricos enteros o decimales (ej. 0, 25, 50, 75, 100).",
                            ].map((rule) => (
                                <li key={rule} className="flex items-start gap-2 text-xs text-gray-5">
                                    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    {rule}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Progress */}
                    <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <h4 className="mb-2 font-semibold text-black dark:text-white">
                            Progreso de definición
                        </h4>
                        <p className="text-xs text-gray-5">
                            {criteriaWithEnoughScales.length} de {criteria.length} criterios con escalas definidas
                        </p>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stroke dark:bg-strokedark">
                            <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="mt-1 text-right text-xs font-semibold text-primary">
                            {progress} %
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-6 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="rounded border border-stroke px-6 py-2 text-sm text-gray-5 hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4"
                >
                    Cancelar
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 rounded border border-stroke px-6 py-2 text-sm text-black hover:bg-gray-2 disabled:opacity-50 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        {saving ? "Guardando..." : "Guardar cambios"}
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={saving}
                        className="flex items-center gap-2 rounded bg-primary px-6 py-2 text-sm text-white hover:bg-opacity-90 disabled:opacity-50"
                    >
                        {saving ? "Procesando..." : "Continuar a revisión"}
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Error banner */}
            {criteriaWithFewScales.length > 0 && (
                <div className="mt-4 flex items-center gap-2 rounded-md border border-danger bg-danger bg-opacity-5 px-4 py-3">
                    <svg className="h-4 w-4 shrink-0 text-danger" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-danger">
                        <span className="font-semibold">No se puede publicar:</span>{" "}
                        {criteriaWithFewScales.length === 1
                            ? `el criterio "${criteriaWithFewScales[0].name}" tiene menos de ${MIN_SCALES} niveles de escala definidos.`
                            : `${criteriaWithFewScales.length} criterios tienen menos de ${MIN_SCALES} niveles de escala definidos.`}
                    </p>
                </div>
            )}

            {/* Reutilizar modal */}
            {showReuseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-md rounded-sm border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark">
                        <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-strokedark">
                            <h4 className="font-semibold text-black dark:text-white">
                                Seleccionar escala existente
                            </h4>
                            <button
                                onClick={() => setShowReuseModal(false)}
                                className="text-gray-5 hover:text-black dark:hover:text-white"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <div className="max-h-80 overflow-y-auto p-4">
                            {reusableScales.length === 0 ? (
                                <p className="text-center text-sm text-gray-5">
                                    No hay escalas en otros criterios.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {reusableScales.map((s) => {
                                        const crit = criteria.find(
                                            (c) => c.id === s.criterion_id
                                        );
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() => cloneScale(s)}
                                                className="w-full rounded-md border border-stroke p-3 text-left hover:border-primary hover:bg-primary hover:bg-opacity-5 dark:border-strokedark"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium text-black dark:text-white text-sm">
                                                        {s.name}
                                                    </p>
                                                    <span className="rounded-full bg-primary bg-opacity-10 px-2 py-0.5 text-xs font-semibold text-primary">
                                                        {s.value}
                                                    </span>
                                                </div>
                                                {s.description && (
                                                    <p className="mt-0.5 text-xs text-gray-5 line-clamp-1">
                                                        {s.description}
                                                    </p>
                                                )}
                                                {crit && (
                                                    <p className="mt-1 text-xs text-gray-4">
                                                        De: {crit.name}
                                                    </p>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="border-t border-stroke px-6 py-3 dark:border-strokedark">
                            <button
                                onClick={() => setShowReuseModal(false)}
                                className="w-full rounded border border-stroke py-2 text-sm text-gray-5 hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DefineScales;
