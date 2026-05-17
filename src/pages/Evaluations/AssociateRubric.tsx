import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Evaluation } from "../../models/Evaluation";
import { Rubric } from "../../models/Rubric";
import { Subject } from "../../models/Subject";
import { Criterion } from "../../models/Criterion";
import { evaluationService } from "../../services/evaluationService";
import { rubricService } from "../../services/rubricService";
import { subjectService } from "../../services/subjectService";
import { criterionService } from "../../services/criterionService";
import { gradeService } from "../../services/gradeService";

const STEPS = ["Seleccionar evaluación", "Seleccionar rúbrica y asignatura", "Confirmar asociación"];

const AssociateRubric: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Data
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [publishedRubrics, setPublishedRubrics] = useState<Rubric[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [criteriaCountMap, setCriteriaCountMap] = useState<Record<string, number>>({});

    // Selection
    const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);
    const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

    // E2
    const [gradesExist, setGradesExist] = useState(false);

    // Filters
    const [rubricSearch, setRubricSearch] = useState("");
    const [subjectFilter, setSubjectFilter] = useState("");

    // ── Load on mount ────────────────────────────────────────────────────────

    useEffect(() => {
        setLoading(true);
        Promise.all([
            evaluationService.getEvaluations(),
            rubricService.getPublishedRubrics(),
            subjectService.getSubjects(),
            criterionService.getCriteria(),
        ]).then(([evals, rubrics, subs, criteria]) => {
            setEvaluations(evals);
            setPublishedRubrics(rubrics);
            setSubjects(subs);

            const countMap: Record<string, number> = {};
            for (const c of criteria as Criterion[]) {
                countMap[c.rubric_id] = (countMap[c.rubric_id] ?? 0) + 1;
            }
            setCriteriaCountMap(countMap);
        }).finally(() => setLoading(false));
    }, []);

    // ── Select evaluation ────────────────────────────────────────────────────

    const handleSelectEval = async (ev: Evaluation) => {
        setSelectedEval(ev);
        setSelectedRubric(null);
        setGradesExist(false);

        const preSubject = subjects.find((s) => s.id === ev.subject_id) ?? null;
        setSelectedSubject(preSubject);

        if (ev.rubric_id) {
            const grades = await gradeService.getGrades({ rubric_id: ev.rubric_id });
            setGradesExist(grades.length > 0);
        }
    };

    const handleGoToStep2 = async () => {
        if (!selectedEval) return;
        if (!selectedEval.rubric_id) {
            setStep(1);
            return;
        }
        setStep(1);
    };

    // ── Filtered rubrics ─────────────────────────────────────────────────────

    const filteredRubrics = useMemo(() => {
        return publishedRubrics
            .filter((r) =>
                rubricSearch === "" ||
                r.title.toLowerCase().includes(rubricSearch.toLowerCase()) ||
                r.description.toLowerCase().includes(rubricSearch.toLowerCase())
            )
            .filter((r) => subjectFilter === "" || r.subject_id === subjectFilter);
    }, [publishedRubrics, rubricSearch, subjectFilter]);

    // ── Confirm ──────────────────────────────────────────────────────────────

    const handleConfirm = async () => {
        if (!selectedEval || !selectedRubric) return;
        setSaving(true);
        try {
            const rubricOk = await evaluationService.associateRubricToEvaluation(
                selectedEval.id,
                selectedRubric.id
            );
            if (!rubricOk) throw new Error("rubric");

            if (selectedSubject) {
                await evaluationService.updateEvaluation(selectedEval.id, {
                    name: selectedEval.name,
                    description: selectedEval.description,
                    group_id: selectedEval.group_id,
                    weight: selectedEval.weight,
                    subject_id: selectedSubject.id,
                });
            }

            await Swal.fire("Asociación confirmada", "La rúbrica y asignatura han sido vinculadas correctamente.", "success");
            // Reset wizard
            setStep(0);
            setSelectedEval(null);
            setSelectedRubric(null);
            setSelectedSubject(null);
            setGradesExist(false);
            setRubricSearch("");
            setSubjectFilter("");
            // Reload evaluations to reflect updated rubric_id
            evaluationService.getEvaluations().then(setEvaluations);
        } catch {
            Swal.fire("Error", "No se pudo completar la asociación.", "error");
        } finally {
            setSaving(false);
        }
    };

    // ── Helpers ──────────────────────────────────────────────────────────────

    const subjectLabel = (id: string | undefined) => {
        if (!id) return null;
        const s = subjects.find((x) => x.id === id);
        return s ? `${s.name} (${s.code})` : null;
    };

    const currentRubricLabel = selectedEval?.rubric_id
        ? publishedRubrics.find((r) => r.id === selectedEval.rubric_id)?.title ?? "—"
        : null;

    // ── Stepper ──────────────────────────────────────────────────────────────

    const renderStepper = () => (
        <div className="flex items-center mb-6">
            {STEPS.map((label, i) => {
                const active = step === i;
                const done = step > i;
                return (
                    <React.Fragment key={i}>
                        <div className="flex items-center gap-2 shrink-0">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                                active ? "bg-primary text-white"
                                : done ? "bg-success text-white"
                                : "border-2 border-stroke text-gray-5 dark:border-strokedark"
                            }`}>
                                {done ? (
                                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : i + 1}
                            </div>
                            <span className={`hidden text-sm md:block ${active ? "font-semibold text-primary" : done ? "text-success" : "text-gray-5"}`}>
                                {label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`mx-3 h-px flex-1 ${done ? "bg-success" : "bg-stroke dark:bg-strokedark"}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );

    // ── Step 0: Select evaluation ─────────────────────────────────────────────

    const renderStep0 = () => (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
                <h3 className="font-semibold text-black dark:text-white">Seleccionar evaluación</h3>
                <p className="text-xs text-gray-5 mt-0.5">Elige la evaluación a la que deseas vincular una rúbrica.</p>
            </div>
            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <p className="text-sm text-gray-5">Cargando...</p>
                </div>
            ) : (
                <div className="p-4 space-y-3 max-h-[480px] overflow-y-auto">
                    {evaluations.map((ev) => (
                        <div
                            key={ev.id}
                            onClick={() => handleSelectEval(ev)}
                            className={`cursor-pointer rounded-md border p-4 transition ${
                                selectedEval?.id === ev.id
                                    ? "border-primary bg-primary bg-opacity-5"
                                    : "border-stroke hover:border-primary dark:border-strokedark"
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-black dark:text-white">{ev.name}</p>
                                    <p className="text-sm text-gray-5 mt-0.5">{ev.description}</p>
                                    <p className="text-xs text-gray-4 mt-2">
                                        {subjectLabel(ev.subject_id) ?? "Sin asignatura"}
                                    </p>
                                </div>
                                <div className="ml-4 flex flex-col items-end gap-1 shrink-0">
                                    <span className="rounded-full bg-primary bg-opacity-10 px-3 py-0.5 text-sm font-semibold text-primary">
                                        {ev.weight} %
                                    </span>
                                    {ev.rubric_id && (
                                        <span className="rounded-full bg-success bg-opacity-10 px-2 py-0.5 text-xs text-success">
                                            Rúbrica asociada
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // ── Step 1: Select rubric + subject ───────────────────────────────────────

    const renderStep1 = () => (
        <div className="flex gap-5">
            {/* Left column */}
            <div className="flex-1 min-w-0 space-y-4">

                {/* Evaluation info card */}
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-5">
                    <h4 className="mb-3 font-semibold text-black dark:text-white">Evaluación seleccionada</h4>
                    <div className="flex gap-4">
                        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div>
                                <p className="text-xs text-gray-5">Nombre:</p>
                                <p className="font-medium text-black dark:text-white">{selectedEval?.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-5">Ponderación:</p>
                                <p className="font-semibold text-primary">{selectedEval?.weight} %</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs text-gray-5">Descripción:</p>
                                <p className="text-black dark:text-white">{selectedEval?.description}</p>
                            </div>
                        </div>
                        <div className="w-56 shrink-0 rounded-md border border-primary bg-primary bg-opacity-5 p-3">
                            <div className="flex items-start gap-2">
                                <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="font-semibold text-primary text-xs">Información</p>
                                    <p className="mt-1 text-xs text-primary">
                                        Asocia una rúbrica publicada a esta evaluación. También puedes ajustar la asignatura si es necesario.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rubric selection */}
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
                        <h4 className="font-semibold text-black dark:text-white">Seleccionar rúbrica publicada</h4>
                        <p className="text-xs text-gray-5 mt-0.5">
                            Solo se muestran rúbricas con estado publicado (es_publica = true).
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3 border-b border-stroke px-4 py-3 dark:border-strokedark">
                        <div className="relative flex-1 min-w-40">
                            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Buscar rúbrica..."
                                value={rubricSearch}
                                onChange={(e) => setRubricSearch(e.target.value)}
                                className="w-full rounded-md border border-stroke bg-transparent py-2 pl-9 pr-3 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                            />
                        </div>
                        <select
                            value={subjectFilter}
                            onChange={(e) => setSubjectFilter(e.target.value)}
                            className="rounded-md border border-stroke bg-transparent py-2 pl-3 pr-8 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                        >
                            <option value="">Todas las asignaturas</option>
                            {subjects.map((s) => (
                                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                            ))}
                        </select>
                        <select className="rounded-md border border-stroke bg-transparent py-2 pl-3 pr-8 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white">
                            <option>Mis rúbricas</option>
                            <option>Todas</option>
                        </select>
                        <button className="flex items-center gap-1.5 rounded-md border border-stroke px-3 py-2 text-sm text-black hover:bg-gray-2 dark:border-strokedark dark:text-white">
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V15a1 1 0 01-.553.894l-4 2A1 1 0 017 17v-6.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                            </svg>
                            Filtros
                        </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {filteredRubrics.length === 0 ? (
                            <p className="py-8 text-center text-sm text-gray-5">
                                No se encontraron rúbricas publicadas.
                            </p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-stroke bg-gray-2 dark:border-strokedark dark:bg-meta-4">
                                        <th className="w-10 px-4 py-3"></th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-5">Rúbrica</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-5">Asignatura</th>
                                        <th className="w-20 px-4 py-3 text-center text-xs font-medium text-gray-5">Criterios</th>
                                        <th className="w-36 px-4 py-3 text-left text-xs font-medium text-gray-5">Fecha de publicación</th>
                                        <th className="w-32 px-4 py-3 text-center text-xs font-medium text-gray-5">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRubrics.map((r) => {
                                        const sLabel = subjectLabel(r.subject_id);
                                        const criteriaCount = criteriaCountMap[r.id] ?? 0;
                                        return (
                                            <tr
                                                key={r.id}
                                                onClick={() => setSelectedRubric(r)}
                                                className={`cursor-pointer border-b border-stroke last:border-0 transition dark:border-strokedark ${
                                                    selectedRubric?.id === r.id
                                                        ? "bg-primary bg-opacity-5"
                                                        : "hover:bg-gray-2 dark:hover:bg-meta-4"
                                                }`}
                                            >
                                                <td className="px-4 py-4 text-center">
                                                    <input
                                                        type="radio"
                                                        checked={selectedRubric?.id === r.id}
                                                        onChange={() => setSelectedRubric(r)}
                                                        className="accent-primary"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="font-semibold text-black dark:text-white">
                                                        {r.title}
                                                        <span className="ml-2 inline-flex items-center rounded-full bg-success bg-opacity-10 px-2 py-0.5 text-xs font-medium text-success">
                                                            Publicada
                                                        </span>
                                                    </p>
                                                    {r.description && (
                                                        <p className="mt-0.5 text-xs text-gray-5 line-clamp-1">{r.description}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-5">
                                                    {sLabel ?? "—"}
                                                </td>
                                                <td className="px-4 py-4 text-center font-semibold text-black dark:text-white">
                                                    {criteriaCount}
                                                </td>
                                                <td className="px-4 py-4 text-xs text-gray-5">
                                                    {new Date(r.updated_at).toLocaleDateString("es-CO", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                    })}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); }}
                                                            className="rounded p-1 text-gray-5 hover:text-primary"
                                                            title="Vista previa"
                                                        >
                                                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedRubric(r); }}
                                                            className="rounded border border-primary px-2 py-1 text-xs text-primary hover:bg-primary hover:text-white"
                                                        >
                                                            Vista previa
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Subject section */}
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-5">
                    <h4 className="mb-1 font-semibold text-black dark:text-white">Asignatura asociada</h4>
                    <p className="mb-3 text-xs text-gray-5">
                        Selecciona la asignatura a la que se asociará la rúbrica con esta evaluación.
                    </p>
                    <select
                        value={selectedSubject?.id ?? ""}
                        onChange={(e) => {
                            const s = subjects.find((x) => x.id === e.target.value) ?? null;
                            setSelectedSubject(s);
                        }}
                        className="w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                    >
                        <option value="">— Sin asignatura —</option>
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name} ({s.code})
                            </option>
                        ))}
                    </select>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Solo puedes asociar la evaluación a asignaturas que impartes.
                    </p>
                </div>

                {/* Error cards */}
                <div className="flex flex-wrap gap-4">
                    {publishedRubrics.length === 0 && (
                        <div className="flex flex-1 items-start gap-3 rounded-md border border-danger bg-danger bg-opacity-5 p-4">
                            <svg className="mt-0.5 h-4 w-4 shrink-0 text-danger" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                                <p className="font-semibold text-danger text-sm">No hay rúbricas publicadas</p>
                                <p className="mt-0.5 text-xs text-danger">
                                    No existen rúbricas publicadas disponibles. Crea y publica una rúbrica desde Mis rúbricas (CU-07).
                                </p>
                            </div>
                            <button
                                onClick={() => navigate("/rubrics")}
                                className="shrink-0 rounded border border-danger px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger hover:text-white"
                            >
                                Ir a Mis rúbricas
                            </button>
                        </div>
                    )}

                    {selectedEval?.rubric_id && gradesExist && (
                        <div className="flex flex-1 items-start gap-3 rounded-md border border-danger bg-danger bg-opacity-5 p-4">
                            <svg className="mt-0.5 h-4 w-4 shrink-0 text-danger" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                                <p className="font-semibold text-danger text-sm">No se puede cambiar la rúbrica</p>
                                <p className="mt-0.5 text-xs text-danger">
                                    Ya existen notas registradas para esta evaluación con la rúbrica actual. No es posible cambiar la rúbrica asociada.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate("/evaluations/grade")}
                                className="shrink-0 rounded border border-danger px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger hover:text-white"
                            >
                                Ver calificaciones
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right sidebar */}
            <div className="w-72 shrink-0 space-y-4">
                {/* Summary */}
                <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <h4 className="mb-4 font-semibold text-black dark:text-white">Resumen de la asociación</h4>
                    <dl className="space-y-3 text-sm">
                        <div>
                            <dt className="text-xs text-gray-5">Evaluación:</dt>
                            <dd className="font-medium text-black dark:text-white">{selectedEval?.name}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-5">Rúbrica actual:</dt>
                            <dd className={`font-medium ${currentRubricLabel ? "text-black dark:text-white" : "text-gray-5"}`}>
                                {currentRubricLabel ?? "— (Sin rúbrica asociada)"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-5">Asignatura actual:</dt>
                            <dd className={`font-medium ${selectedEval?.subject_id ? "text-black dark:text-white" : "text-gray-5"}`}>
                                {subjectLabel(selectedEval?.subject_id) ?? "— (Sin asignatura asociada)"}
                            </dd>
                        </div>
                    </dl>

                    {(selectedRubric || selectedSubject) && (
                        <>
                            <div className="my-4 border-t border-stroke dark:border-strokedark" />
                            <p className="mb-2 text-xs font-semibold text-black dark:text-white">Nueva asociación</p>
                            <dl className="space-y-2 text-sm">
                                {selectedRubric && (
                                    <div>
                                        <dt className="text-xs text-gray-5">Rúbrica seleccionada:</dt>
                                        <dd className="font-medium text-primary">{selectedRubric.title}</dd>
                                    </div>
                                )}
                                {selectedSubject && (
                                    <div>
                                        <dt className="text-xs text-gray-5">Asignatura seleccionada:</dt>
                                        <dd className="font-medium text-primary">
                                            {selectedSubject.name} ({selectedSubject.code})
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </>
                    )}
                </div>

                {/* Importante */}
                <div className="rounded-sm border border-warning bg-warning bg-opacity-5 p-4 shadow-default">
                    <div className="flex items-start gap-2">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-warning" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="font-semibold text-warning text-xs">Importante</p>
                            <p className="mt-1 text-xs text-warning">Al confirmar, se actualizarán los campos:</p>
                            <ul className="mt-1 space-y-0.5 text-xs text-warning">
                                <li>• Evaluacion.rubrica_id</li>
                                <li>• Evaluacion.asignatura_id</li>
                                <li>• Evaluacion.updated_at</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Reglas */}
                <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <p className="mb-2 font-semibold text-black dark:text-white text-sm">Reglas</p>
                    <ul className="space-y-1.5 text-xs text-gray-5">
                        <li className="flex items-center gap-1.5">
                            <svg className="h-3.5 w-3.5 shrink-0 text-success" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Solo se permiten rúbricas publicadas.
                        </li>
                        <li className="flex items-center gap-1.5">
                            <svg className="h-3.5 w-3.5 shrink-0 text-success" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            La evaluación debe pertenecer a una asignatura que impartes.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );

    // ── Step 2: Confirm ───────────────────────────────────────────────────────

    const renderStep2 = () => (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
                <h3 className="font-semibold text-black dark:text-white">Confirmar asociación</h3>
                <p className="text-xs text-gray-5 mt-0.5">Revisa los datos antes de confirmar el vínculo.</p>
            </div>
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                        <p className="mb-3 font-semibold text-black dark:text-white text-sm">Evaluación</p>
                        <dl className="space-y-2 text-sm">
                            <div><dt className="text-xs text-gray-5">Nombre:</dt><dd className="font-medium text-black dark:text-white">{selectedEval?.name}</dd></div>
                            <div><dt className="text-xs text-gray-5">Descripción:</dt><dd className="text-black dark:text-white">{selectedEval?.description}</dd></div>
                            <div><dt className="text-xs text-gray-5">Ponderación:</dt><dd className="font-semibold text-primary">{selectedEval?.weight} %</dd></div>
                        </dl>
                    </div>
                    <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                        <p className="mb-3 font-semibold text-black dark:text-white text-sm">Rúbrica</p>
                        <dl className="space-y-2 text-sm">
                            <div><dt className="text-xs text-gray-5">Título:</dt><dd className="font-medium text-black dark:text-white">{selectedRubric?.title}</dd></div>
                            <div><dt className="text-xs text-gray-5">Descripción:</dt><dd className="text-black dark:text-white">{selectedRubric?.description}</dd></div>
                            <div><dt className="text-xs text-gray-5">Criterios:</dt><dd className="font-semibold text-black dark:text-white">{criteriaCountMap[selectedRubric?.id ?? ""] ?? 0}</dd></div>
                        </dl>
                    </div>
                </div>
                {selectedSubject && (
                    <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                        <p className="mb-2 font-semibold text-black dark:text-white text-sm">Asignatura</p>
                        <p className="text-sm text-black dark:text-white">{selectedSubject.name} ({selectedSubject.code})</p>
                    </div>
                )}
                <div className="flex items-start gap-3 rounded-md border border-warning bg-warning bg-opacity-5 p-4">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-warning" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-warning">
                        Una vez asociada, no podrás cambiar la rúbrica si ya existen calificaciones registradas para esta evaluación.
                    </p>
                </div>
            </div>
        </div>
    );

    // ── Main render ───────────────────────────────────────────────────────────

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-black dark:text-white">
                    Asociar rúbrica a evaluación y asignatura
                </h2>
                <p className="text-sm text-gray-5">Vincula una rúbrica publicada a una evaluación de una asignatura.</p>
            </div>

            {renderStepper()}

            {step === 0 && renderStep0()}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}

            {/* Bottom bar */}
            <div className="mt-6 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="rounded border border-stroke px-6 py-2 text-sm text-gray-5 hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4"
                >
                    Cancelar
                </button>

                <div className="flex gap-3">
                    {step > 0 && (
                        <button
                            onClick={() => setStep((s) => s - 1)}
                            className="rounded border border-stroke px-6 py-2 text-sm text-black hover:bg-gray-2 dark:border-strokedark dark:text-white"
                        >
                            Atrás
                        </button>
                    )}

                    {step === 0 && (
                        <button
                            onClick={handleGoToStep2}
                            disabled={!selectedEval}
                            className="rounded bg-primary px-6 py-2 text-sm text-white hover:bg-opacity-90 disabled:opacity-50"
                        >
                            Siguiente →
                        </button>
                    )}

                    {step === 1 && (
                        <button
                            onClick={() => setStep(2)}
                            disabled={!selectedRubric || (gradesExist && !!selectedEval?.rubric_id)}
                            className="flex items-center gap-2 rounded bg-primary px-6 py-2 text-sm text-white hover:bg-opacity-90 disabled:opacity-50"
                        >
                            Siguiente →
                        </button>
                    )}

                    {step === 2 && (
                        <button
                            onClick={handleConfirm}
                            disabled={saving || !selectedRubric}
                            className="flex items-center gap-2 rounded bg-success px-6 py-2 text-sm text-white hover:bg-opacity-90 disabled:opacity-50"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {saving ? "Confirmando..." : "Confirmar asociación"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssociateRubric;
