import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Evaluation } from "../../models/Evaluation";
import { Enrollments } from "../../models/Enrollments";
import { Criterion } from "../../models/Criterion";
import { Scale } from "../../models/Scale";
import { Grade } from "../../models/Grade";
import { Rubric } from "../../models/Rubric";
import { evaluationService } from "../../services/evaluationService";
import { enrollmentsService } from "../../services/enrollmentsService";
import { criterionService } from "../../services/criterionService";
import { scaleService } from "../../services/scaleService";
import { gradeService } from "../../services/gradeService";
import { rubricService } from "../../services/rubricService";
import { userService } from "../../services/userService";

interface StudentProfile {
    profileId: string;
    name: string;
    identification: string;
}

interface CriterionScore {
    detailId?: string;
    scaleId: string;
    scaleName: string;
    scaleValue: number;
    scaleDescription: string;
    score: number;
    comment: string;
}

const STEPS = [
    "Seleccionar evaluación",
    "Seleccionar estudiante",
    "Evaluar criterios",
    "Revisar y enviar",
];

const GradeStudent: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    // Step 0
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);

    // Step 1
    const [enrollments, setEnrollments] = useState<Enrollments[]>([]);
    const [studentMap, setStudentMap] = useState<Record<string, StudentProfile>>({});
    const [grades, setGrades] = useState<Grade[]>([]);
    const [rubric, setRubric] = useState<Rubric | null>(null);
    const [selectedEnrollmentIdx, setSelectedEnrollmentIdx] = useState(0);

    // Step 2
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [scalesByCriterion, setScalesByCriterion] = useState<Record<string, Scale[]>>({});
    const [scores, setScores] = useState<Record<string, CriterionScore>>({});
    const [observations, setObservations] = useState("");
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    // ── Load evaluations ─────────────────────────────────────────────────────

    useEffect(() => {
        evaluationService.getEvaluationsWithRubric().then(setEvaluations);
    }, []);

    // ── Load data when evaluation is selected ────────────────────────────────

    const loadEvaluationData = async (ev: Evaluation) => {
        setLoading(true);
        try {
            const [allEnrollments, users, rubricData, allCriteria, allScales, gradeList] =
                await Promise.all([
                    enrollmentsService.getEnrollments(),
                    userService.getUsers(),
                    rubricService.getRubricById(ev.rubric_id!),
                    criterionService.getCriteria(),
                    scaleService.getScales(),
                    gradeService.getGrades({ rubric_id: ev.rubric_id! }),
                ]);

            // Filter enrollments for this group
            const groupEnrollments = allEnrollments.filter(
                (e) => e.group_id === ev.group_id
            );
            setEnrollments(groupEnrollments);

            // Build student profile map (profileId → name)
            const map: Record<string, StudentProfile> = {};
            for (const u of users as any[]) {
                if (u.profile && u.role === "STUDENT") {
                    map[u.profile.id] = {
                        profileId: u.profile.id,
                        name: `${u.profile.first_name} ${u.profile.last_name}`,
                        identification: u.profile.identification ?? u.code ?? "",
                    };
                }
            }
            setStudentMap(map);
            setRubric(rubricData);
            setGrades(gradeList);

            // Filter criteria and scales for this rubric
            const rubricCriteria = allCriteria.filter(
                (c) => c.rubric_id === ev.rubric_id
            );
            setCriteria(rubricCriteria);

            const criterionIds = rubricCriteria.map((c) => c.id);
            const sbyCriterion: Record<string, Scale[]> = {};
            for (const cid of criterionIds) {
                sbyCriterion[cid] = allScales.filter((s) => s.criterion_id === cid);
            }
            setScalesByCriterion(sbyCriterion);
        } catch {
            Swal.fire("Error", "No se pudo cargar la evaluación.", "error");
        } finally {
            setLoading(false);
        }
    };

    // ── Load scores for current student ─────────────────────────────────────

    const loadStudentScores = (enrollment: Enrollments) => {
        const grade = grades.find((g) => g.enrollment_id === enrollment.id);
        if (!grade) {
            setScores({});
            setObservations("");
            return;
        }
        setObservations(grade.observations ?? "");

        // Map existing grade details to criteria
        const newScores: Record<string, CriterionScore> = {};
        for (const detail of grade.details) {
            // Find which criterion this scale belongs to
            for (const [criterionId, scales] of Object.entries(scalesByCriterion)) {
                const matchScale = scales.find((s) => s.id === detail.scale_id);
                if (matchScale) {
                    newScores[criterionId] = {
                        detailId: detail.id,
                        scaleId: detail.scale_id,
                        scaleName: matchScale.name,
                        scaleValue: matchScale.value,
                        scaleDescription: matchScale.description,
                        score: detail.score,
                        comment: detail.comment ?? "",
                    };
                    break;
                }
            }
        }
        setScores(newScores);
    };

    const currentEnrollment = enrollments[selectedEnrollmentIdx] ?? null;
    const currentGrade = grades.find(
        (g) => g.enrollment_id === currentEnrollment?.id
    ) ?? null;
    const currentStudent = currentEnrollment
        ? studentMap[currentEnrollment.student_id]
        : null;

    const criteriaWithScales = criteria.filter(
        (c) => (scalesByCriterion[c.id] ?? []).length > 0
    );
    const completedCount = criteriaWithScales.filter((c) => !!scores[c.id]).length;
    const pendingCount = criteriaWithScales.length - completedCount;
    const allComplete = pendingCount === 0 && criteriaWithScales.length > 0;

    const finalScore = Object.values(scores).reduce((sum, s) => sum + s.score, 0);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const selectEvaluation = async (ev: Evaluation) => {
        setSelectedEval(ev);
        setSelectedEnrollmentIdx(0);
        setScores({});
        await loadEvaluationData(ev);
    };

    const selectStudent = (idx: number) => {
        setSelectedEnrollmentIdx(idx);
        setScores({});
        setStep(2);
    };

    useEffect(() => {
        if (step === 2 && currentEnrollment) {
            loadStudentScores(currentEnrollment);
        }
    }, [selectedEnrollmentIdx, step, grades]);

    const selectScale = (criterionId: string, scale: Scale, criterion: Criterion) => {
        const score =
            Math.round((scale.value * criterion.weight) / 100 * 100) / 100;
        setScores((prev) => ({
            ...prev,
            [criterionId]: {
                ...(prev[criterionId] ?? {}),
                scaleId: scale.id,
                scaleName: scale.name,
                scaleValue: scale.value,
                scaleDescription: scale.description,
                score,
                comment: prev[criterionId]?.comment ?? "",
            },
        }));
        setOpenDropdown(null);
    };

    const setComment = (criterionId: string, comment: string) => {
        setScores((prev) => ({
            ...prev,
            [criterionId]: { ...prev[criterionId], comment },
        }));
    };

    const navigateStudent = (dir: "prev" | "next") => {
        const newIdx =
            dir === "prev" ? selectedEnrollmentIdx - 1 : selectedEnrollmentIdx + 1;
        if (newIdx < 0 || newIdx >= enrollments.length) return;
        setSelectedEnrollmentIdx(newIdx);
        setScores({});
    };

    // ── Save logic ───────────────────────────────────────────────────────────

    const persistGrade = async (submit: boolean) => {
        if (!currentGrade || !currentEnrollment || !selectedEval) return false;

        if (submit && !allComplete) {
            Swal.fire(
                "No se puede enviar",
                "Debes seleccionar un nivel de desempeño (escala) para todos los criterios.",
                "error"
            );
            return false;
        }

        setSaving(true);
        try {
            // Update each detail that has a scale selected and a detailId
            for (const [, cs] of Object.entries(scores)) {
                if (!cs.detailId) continue;
                await gradeService.updateGradeDetail(cs.detailId, {
                    scale_id: cs.scaleId,
                    score: cs.score,
                    comment: cs.comment,
                    student_id: currentEnrollment.student_id,
                });
            }

            // Update grade header
            await gradeService.updateGrade(currentGrade.id, {
                status: submit ? "SUBMITTED" : "DRAFT",
                observations,
                final_score: finalScore,
                enrollment_id: currentEnrollment.id,
                rubric_id: selectedEval.rubric_id!,
            });

            // Refresh grades list
            const refreshed = await gradeService.getGrades({
                rubric_id: selectedEval.rubric_id!,
            });
            setGrades(refreshed);

            return true;
        } catch {
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleSaveDraft = async () => {
        const ok = await persistGrade(false);
        if (ok) Swal.fire("Guardado", "Borrador guardado correctamente.", "success");
        else if (currentGrade) Swal.fire("Error", "No se pudo guardar.", "error");
    };

    const handleSubmit = async () => {
        if (!allComplete) return;
        const ok = await persistGrade(true);
        if (ok) {
            await Swal.fire("Enviada", "Calificación enviada correctamente.", "success");
            setStep(3);
        } else {
            Swal.fire("Error", "No se pudo enviar la calificación.", "error");
        }
    };

    // ── Render helpers ───────────────────────────────────────────────────────

    const renderStepper = () => (
        <div className="flex items-center mb-6">
            {STEPS.map((label, i) => {
                const active = step === i;
                const done = step > i;
                return (
                    <React.Fragment key={i}>
                        <div className="flex items-center gap-2 shrink-0">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
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
                                    i + 1
                                )}
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

    const renderEvalInfoBar = () =>
        selectedEval && (
            <div className="mb-4 flex flex-wrap items-center gap-4 rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary bg-opacity-10">
                        <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs text-gray-5">Evaluación</p>
                        <p className="font-semibold text-black dark:text-white">
                            {selectedEval.name}
                        </p>
                    </div>
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-6 text-sm">
                    <div>
                        <p className="text-xs text-gray-5">Grupo</p>
                        <p className="font-medium text-black dark:text-white">
                            {selectedEval.group_id.slice(0, 8)}…
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-5">Ponderación</p>
                        <p className="font-semibold text-primary">{selectedEval.weight} %</p>
                    </div>
                </div>
            </div>
        );

    const renderRubricBanner = () =>
        rubric && (
            <div className="mb-4 flex items-center gap-3 rounded-sm border border-success bg-success bg-opacity-5 px-4 py-3">
                <svg className="h-4 w-4 shrink-0 text-success" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-success">Rúbrica asociada:</span>
                <span className="font-semibold text-success">{rubric.title}</span>
                <span className="rounded-full bg-success px-2 py-0.5 text-xs font-medium text-white">
                    Publicada
                </span>
            </div>
        );

    // ── Step 0: Select evaluation ─────────────────────────────────────────────

    const renderStep0 = () => (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
                <h3 className="font-semibold text-black dark:text-white">
                    Seleccionar evaluación
                </h3>
                <p className="text-xs text-gray-5 mt-0.5">
                    Solo se muestran evaluaciones con rúbrica asociada.
                </p>
            </div>
            <div className="p-4 space-y-3 max-h-[480px] overflow-y-auto">
                {evaluations.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-5">
                        No hay evaluaciones con rúbrica asociada.
                    </p>
                ) : (
                    evaluations.map((ev) => (
                        <div
                            key={ev.id}
                            onClick={() => setSelectedEval(ev)}
                            className={`cursor-pointer rounded-md border p-4 transition ${
                                selectedEval?.id === ev.id
                                    ? "border-primary bg-primary bg-opacity-5"
                                    : "border-stroke hover:border-primary dark:border-strokedark"
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-semibold text-black dark:text-white">
                                        {ev.name}
                                    </p>
                                    <p className="text-sm text-gray-5 mt-0.5">{ev.description}</p>
                                </div>
                                <span className="shrink-0 rounded-full bg-primary bg-opacity-10 px-3 py-0.5 text-sm font-semibold text-primary">
                                    {ev.weight} %
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    // ── Step 1: Select student ────────────────────────────────────────────────

    const renderStep1 = () => (
        <div>
            {renderEvalInfoBar()}
            {renderRubricBanner()}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
                    <h3 className="font-semibold text-black dark:text-white">
                        Estudiantes del grupo
                    </h3>
                    <p className="text-xs text-gray-5 mt-0.5">
                        Haz clic en un estudiante para calificarlo.
                    </p>
                </div>
                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <p className="text-sm text-gray-5">Cargando...</p>
                    </div>
                ) : enrollments.length === 0 ? (
                    <p className="p-8 text-center text-sm text-gray-5">
                        No hay estudiantes inscritos en este grupo.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-stroke bg-gray-2 dark:border-strokedark dark:bg-meta-4">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-5">Estudiante</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-5">Identificación</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-5">Estado inscripción</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-5">Calificación</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-5">Nota</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-5">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrollments.map((enr, idx) => {
                                    const student = studentMap[enr.student_id];
                                    const grade = grades.find((g) => g.enrollment_id === enr.id);
                                    return (
                                        <tr
                                            key={enr.id}
                                            className="border-b border-stroke last:border-0 hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary bg-opacity-10 text-xs font-semibold text-primary">
                                                        {student?.name?.charAt(0) ?? "?"}
                                                    </div>
                                                    <span className="font-medium text-black dark:text-white">
                                                        {student?.name ?? enr.student_id.slice(0, 8)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-gray-5">
                                                {student?.identification ?? "—"}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${enr.status === "ACTIVE" ? "bg-success bg-opacity-10 text-success" : "bg-danger bg-opacity-10 text-danger"}`}>
                                                    {enr.status === "ACTIVE" ? "Activa" : enr.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                {grade ? (
                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${grade.status === "SUBMITTED" ? "bg-success bg-opacity-10 text-success" : "bg-warning bg-opacity-10 text-warning"}`}>
                                                        {grade.status === "SUBMITTED" ? "Enviada" : "Borrador"}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-5">Sin calificar</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-center font-semibold text-black dark:text-white">
                                                {grade ? `${grade.final_score.toFixed(2)}` : "—"}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    onClick={() => selectStudent(idx)}
                                                    className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-opacity-90"
                                                >
                                                    Calificar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    // ── Step 2: Evaluate criteria ─────────────────────────────────────────────

    const renderStep2 = () => (
        <div>
            {renderEvalInfoBar()}
            {renderRubricBanner()}

            {/* Student card */}
            <div className="mb-4 flex items-center justify-between rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary bg-opacity-10 text-lg font-bold text-primary">
                        {currentStudent?.name?.charAt(0) ?? "?"}
                    </div>
                    <div>
                        <p className="font-semibold text-black dark:text-white">
                            {currentStudent?.name ?? "Estudiante"}
                        </p>
                        <p className="text-xs text-gray-5">
                            Cédula: {currentStudent?.identification ?? "—"}
                        </p>
                        <p className="text-xs text-gray-5">
                            Inscripción: {currentEnrollment?.id?.slice(0, 8)}…
                        </p>
                    </div>
                    <span className={`ml-4 rounded-full px-3 py-1 text-xs font-medium ${currentEnrollment?.status === "ACTIVE" ? "bg-success bg-opacity-10 text-success" : "bg-stroke text-gray-5"}`}>
                        {currentEnrollment?.status === "ACTIVE" ? "Activa" : currentEnrollment?.status}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigateStudent("prev")}
                        disabled={selectedEnrollmentIdx === 0}
                        className="flex items-center gap-1 rounded border border-stroke px-3 py-1.5 text-sm text-black hover:bg-gray-2 disabled:opacity-40 dark:border-strokedark dark:text-white"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Anterior
                    </button>
                    <button
                        onClick={() => navigateStudent("next")}
                        disabled={selectedEnrollmentIdx === enrollments.length - 1}
                        className="flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-sm text-white hover:bg-opacity-90 disabled:opacity-40"
                    >
                        Siguiente
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Criteria + sidebar */}
            <div className="flex gap-5">
                {/* Main: criteria table */}
                <div className="flex-1 min-w-0 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-strokedark">
                        <div>
                            <h3 className="font-semibold text-black dark:text-white">
                                Criterios de la rúbrica
                            </h3>
                            <p className="text-xs text-gray-5 mt-0.5">
                                Selecciona el nivel de desempeño (escala) para cada criterio.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1">
                                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                                Completo
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="h-2.5 w-2.5 rounded-full bg-danger" />
                                Pendiente: {pendingCount} de {criteriaWithScales.length}
                            </span>
                        </div>
                    </div>

                    <div className="p-4">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-stroke dark:border-strokedark">
                                        <th className="w-8 pb-3 text-left text-xs font-medium text-gray-5">#</th>
                                        <th className="pb-3 text-left text-xs font-medium text-gray-5">Criterio (Peso)</th>
                                        <th className="w-52 pb-3 text-left text-xs font-medium text-gray-5">Nivel de desempeño</th>
                                        <th className="w-28 pb-3 text-left text-xs font-medium text-gray-5">Puntaje</th>
                                        <th className="pb-3 text-left text-xs font-medium text-gray-5">Comentario (opcional)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {criteria.map((c, i) => {
                                        const cs = scores[c.id];
                                        const scales = scalesByCriterion[c.id] ?? [];
                                        const isOpen = openDropdown === c.id;

                                        return (
                                            <tr key={c.id} className="border-b border-stroke last:border-0 dark:border-strokedark">
                                                <td className="py-4 pr-3 text-gray-5 align-top pt-5">{i + 1}</td>
                                                <td className="py-4 pr-4 align-top">
                                                    <p className="font-medium text-black dark:text-white">
                                                        {c.name}{" "}
                                                        <span className="font-normal text-gray-5">({c.weight} %)</span>
                                                    </p>
                                                    {c.description && (
                                                        <p className="mt-0.5 text-xs text-gray-5">{c.description}</p>
                                                    )}
                                                </td>
                                                <td className="py-4 pr-4 align-top">
                                                    <div className="relative">
                                                        <button
                                                            onClick={() =>
                                                                setOpenDropdown(isOpen ? null : c.id)
                                                            }
                                                            className={`w-full rounded-md border p-3 text-left transition ${
                                                                cs
                                                                    ? "border-primary bg-primary bg-opacity-5"
                                                                    : "border-stroke hover:border-primary dark:border-strokedark"
                                                            }`}
                                                        >
                                                            {cs ? (
                                                                <>
                                                                    <p className="font-semibold text-black dark:text-white text-xs">
                                                                        {cs.scaleName} ({cs.scaleValue})
                                                                    </p>
                                                                    <p className="text-xs text-gray-5 mt-0.5 line-clamp-2">
                                                                        {cs.scaleDescription}
                                                                    </p>
                                                                </>
                                                            ) : (
                                                                <p className="text-xs text-gray-5">
                                                                    Seleccionar nivel...
                                                                </p>
                                                            )}
                                                            <svg className={`absolute right-2 top-3 h-4 w-4 text-gray-5 transition-transform ${isOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>

                                                        {isOpen && (
                                                            <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-md border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark">
                                                                {scales.map((sc) => (
                                                                    <button
                                                                        key={sc.id}
                                                                        onClick={() => selectScale(c.id, sc, c)}
                                                                        className={`w-full p-3 text-left hover:bg-gray-2 dark:hover:bg-meta-4 ${cs?.scaleId === sc.id ? "bg-primary bg-opacity-5" : ""}`}
                                                                    >
                                                                        <p className="font-semibold text-black dark:text-white text-xs">
                                                                            {sc.name} ({sc.value})
                                                                        </p>
                                                                        {sc.description && (
                                                                            <p className="text-xs text-gray-5 mt-0.5">{sc.description}</p>
                                                                        )}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 pr-4 align-top pt-5">
                                                    {cs ? (
                                                        <div>
                                                            <p className="font-semibold text-black dark:text-white">
                                                                {cs.score.toFixed(2)}
                                                            </p>
                                                            <p className="text-xs text-gray-5">
                                                                {c.weight} % × {cs.scaleValue}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-5">—</p>
                                                    )}
                                                </td>
                                                <td className="py-4 align-top">
                                                    <textarea
                                                        rows={2}
                                                        value={cs?.comment ?? ""}
                                                        onChange={(e) => setComment(c.id, e.target.value)}
                                                        placeholder="Comentario opcional..."
                                                        className="w-full rounded border border-stroke bg-transparent px-2 py-1.5 text-xs text-black outline-none focus:border-primary dark:border-strokedark dark:text-white dark:focus:border-primary"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Total row */}
                        <div className="mt-4 flex items-center justify-between border-t border-stroke pt-4 dark:border-strokedark">
                            <p className="flex items-center gap-2 text-xs text-primary">
                                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                El puntaje de cada criterio se calcula como: valor de escala × peso del criterio.
                            </p>
                            <div className="text-right">
                                <p className="text-sm text-gray-5">Total (suma ponderada)</p>
                                <p className={`text-2xl font-bold ${allComplete ? "text-success" : "text-black dark:text-white"}`}>
                                    {finalScore.toFixed(2)} / 100
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-64 shrink-0 space-y-4">
                    <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <h4 className="mb-4 font-semibold text-black dark:text-white">
                            Resumen de la calificación
                        </h4>
                        <dl className="space-y-2 text-sm">
                            <div>
                                <dt className="text-xs text-gray-5">Rúbrica:</dt>
                                <dd className="font-medium text-black dark:text-white">{rubric?.title}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-5">Evaluación:</dt>
                                <dd className="font-medium text-black dark:text-white">{selectedEval?.name}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-5">Estudiante:</dt>
                                <dd className="font-medium text-black dark:text-white">
                                    {currentStudent?.name ?? "—"}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-5">Inscripción:</dt>
                                <dd className="text-xs text-black dark:text-white">
                                    {currentEnrollment?.id?.slice(0, 8)}…
                                </dd>
                            </div>
                        </dl>

                        {/* Final score big display */}
                        <div className="mt-4 rounded-md bg-gray-2 p-3 text-center dark:bg-meta-4">
                            <p className="text-xs text-gray-5">Nota final calculada</p>
                            <p className={`mt-1 text-3xl font-bold ${allComplete ? "text-primary" : "text-black dark:text-white"}`}>
                                {finalScore.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-5">/ 100</p>
                            <div className="mt-2 flex items-center justify-between text-xs text-gray-5">
                                <span>Ponderación:</span>
                                <span className="font-medium">{selectedEval?.weight} %</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between">
                                <span className="text-xs text-gray-5">Estado:</span>
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${currentGrade?.status === "SUBMITTED" ? "bg-success bg-opacity-10 text-success" : "bg-warning bg-opacity-10 text-warning"}`}>
                                    {currentGrade?.status === "SUBMITTED" ? "Enviada" : "Borrador"}
                                </span>
                            </div>
                        </div>

                        {/* Breakdown */}
                        {Object.keys(scores).length > 0 && (
                            <div className="mt-4">
                                <p className="mb-2 text-xs font-semibold text-black dark:text-white">
                                    Detalle del cálculo
                                </p>
                                <div className="space-y-1">
                                    {criteria.map((c) => {
                                        const cs = scores[c.id];
                                        return (
                                            <div key={c.id} className="flex items-center justify-between text-xs">
                                                <span className="text-gray-5">
                                                    {c.name} ({c.weight} %)
                                                </span>
                                                <span className="font-medium text-black dark:text-white">
                                                    {cs ? cs.score.toFixed(2) : "—"}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    <div className="mt-1 flex items-center justify-between border-t border-stroke pt-1 dark:border-strokedark">
                                        <span className="text-xs font-semibold text-black dark:text-white">Total</span>
                                        <span className="text-xs font-bold text-primary">
                                            {finalScore.toFixed(2)} / 100
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Observations */}
                    <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <label className="mb-1.5 block text-xs font-medium text-black dark:text-white">
                            Observaciones generales
                        </label>
                        <textarea
                            rows={3}
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            placeholder="Comentarios generales sobre la calificación..."
                            className="w-full rounded border border-stroke bg-transparent px-2 py-1.5 text-xs text-black outline-none focus:border-primary dark:border-strokedark dark:text-white dark:focus:border-primary"
                        />
                    </div>

                    {/* CU-12 hint */}
                    <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <div className="flex items-start gap-2">
                            <svg className="mt-0.5 h-4 w-4 shrink-0 text-warning" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="font-semibold text-black dark:text-white text-xs">Incluye CU-12</p>
                                <p className="mt-1 text-xs text-gray-5">
                                    Puedes revisar y gestionar las notas de esta evaluación en el módulo de calificaciones.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // ── Step 3: Review ────────────────────────────────────────────────────────

    const renderStep3 = () => (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
                <h3 className="font-semibold text-black dark:text-white">
                    Calificación enviada
                </h3>
            </div>
            <div className="flex flex-col items-center p-10 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success bg-opacity-10">
                    <svg className="h-8 w-8 text-success" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                </div>
                <h4 className="text-lg font-semibold text-black dark:text-white">
                    ¡Calificación enviada!
                </h4>
                <p className="mt-2 text-sm text-gray-5">
                    La calificación de{" "}
                    <span className="font-medium text-black dark:text-white">
                        {currentStudent?.name}
                    </span>{" "}
                    fue registrada con nota final{" "}
                    <span className="font-bold text-primary">{finalScore.toFixed(2)} / 100</span>.
                </p>
                <div className="mt-6 flex gap-3">
                    <button
                        onClick={() => { setStep(1); setScores({}); }}
                        className="rounded border border-stroke px-6 py-2 text-sm text-black hover:bg-gray-2 dark:border-strokedark dark:text-white"
                    >
                        Calificar otro estudiante
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="rounded bg-primary px-6 py-2 text-sm text-white hover:bg-opacity-90"
                    >
                        Finalizar
                    </button>
                </div>
            </div>
        </div>
    );

    // ── Main render ───────────────────────────────────────────────────────────

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-black dark:text-white">
                    Calificar estudiante con rúbrica
                </h2>
                <p className="text-sm text-gray-5">
                    Registra el desempeño del estudiante por criterio y calcula la nota final.
                </p>
            </div>

            {renderStepper()}

            {step === 0 && renderStep0()}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {/* Bottom bar */}
            {step < 3 && (
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
                                onClick={async () => {
                                    if (!selectedEval) return;
                                    await selectEvaluation(selectedEval);
                                    setStep(1);
                                }}
                                disabled={!selectedEval || loading}
                                className="rounded bg-primary px-6 py-2 text-sm text-white hover:bg-opacity-90 disabled:opacity-50"
                            >
                                {loading ? "Cargando..." : "Siguiente →"}
                            </button>
                        )}

                        {step === 2 && (
                            <>
                                <button
                                    onClick={handleSaveDraft}
                                    disabled={saving || !currentGrade}
                                    className="flex items-center gap-2 rounded border border-stroke px-5 py-2 text-sm text-black hover:bg-gray-2 disabled:opacity-50 dark:border-strokedark dark:text-white"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                    {saving ? "Guardando..." : "Guardar borrador"}
                                    <span className="text-xs text-gray-5 hidden md:block">
                                        — Se guarda sin notificar al estudiante.
                                    </span>
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={saving || !allComplete || !currentGrade}
                                    className="flex items-center gap-2 rounded bg-primary px-5 py-2 text-sm text-white hover:bg-opacity-90 disabled:opacity-50"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11h2v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                    </svg>
                                    {saving ? "Enviando..." : "Enviar calificación"}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Error banner — only on step 2 when trying to submit incomplete */}
            {step === 2 && !allComplete && criteria.length > 0 && (
                <div className="mt-4 flex items-center gap-2 rounded-md border border-danger bg-danger bg-opacity-5 px-4 py-3">
                    <svg className="h-4 w-4 shrink-0 text-danger" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-danger">
                        <span className="font-semibold">No se puede enviar la calificación</span>{" "}
                        — Debes seleccionar un nivel de desempeño (escala) para todos los criterios.
                    </p>
                </div>
            )}
        </div>
    );
};

export default GradeStudent;
