import React, { useEffect, useState } from "react";
import { Evaluation } from "../../models/Evaluation";
import { Rubric } from "../../models/Rubric";
import { evaluationService } from "../../services/evaluationService";
import { rubricService } from "../../services/rubricService";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface Criterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  rubric_id: string;
}

const AssociateRubric: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Paso actual del wizard
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  
  // Estado del formulario
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
  const [rubricCriteria, setRubricCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evaluationsList, rubricsList] = await Promise.all([
        evaluationService.getEvaluations(),
        rubricService.getPublishedRubrics(),
      ]);
      setEvaluations(evaluationsList);
      setRubrics(rubricsList);
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
    setLoading(false);
  };

  // Cargar criterios cuando se selecciona una rúbrica
  const handleRubricSelect = async (rubric: Rubric) => {
    setSelectedRubric(rubric);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/evaluation/criteria`
      );
      const allCriteria = response.data.data;
      const filteredCriteria = allCriteria.filter(
        (c: Criterion) => c.rubric_id === rubric.id
      );
      setRubricCriteria(filteredCriteria);
    } catch (error) {
      console.error("Error cargando criterios:", error);
      setRubricCriteria([]);
    }
  };

  const canProceed = () => {
    if (step === 1) return selectedEvaluation !== null;
    if (step === 2) return selectedRubric !== null;
    return true;
  };

  // Manejar siguiente paso
  const handleNext = () => {
    if (canProceed()) {
      setStep(step + 1);
    } else {
      Swal.fire("Error", "Debes seleccionar una opción para continuar", "error");
    }
  };

  // Manejar paso anterior
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Confirmar asociación
  const handleConfirm = async () => {
    if (!selectedEvaluation || !selectedRubric) {
      Swal.fire("Error", "Faltan datos", "error");
      return;
    }

    setLoading(true);
    const success = await evaluationService.associateRubricToEvaluation(
      selectedEvaluation.id,
      selectedRubric.id
    );
    setLoading(false);

    if (success) {
      Swal.fire(
        "Éxito",
        "Rúbrica asociada correctamente",
        "success"
      ).then(() => {
        navigate("/");
      });
    } else {
      Swal.fire("Error", "No se pudo asociar la rúbrica", "error");
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
        <h3 className="font-medium text-black dark:text-white">
          Asociar Rúbrica a Evaluación
        </h3>
        <p className="text-sm text-gray-5">Paso {step} de 3</p>
      </div>

      <div className="p-6.5">
        {/* PASO 1: Seleccionar Evaluación */}
        {step === 1 && (
          <div>
            <h4 className="mb-4 font-semibold text-black dark:text-white">
              Selecciona una evaluación
            </h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {evaluations.map((evaluation) => (
                <div
                  key={evaluation.id}
                  onClick={() => setSelectedEvaluation(evaluation)}
                  className={`cursor-pointer p-4 border rounded-md transition ${
                    selectedEvaluation?.id === evaluation.id
                      ? "border-primary bg-primary bg-opacity-10"
                      : "border-stroke hover:border-primary dark:border-strokedark"
                  }`}
                >
                  <p className="font-semibold text-black dark:text-white">
                    {evaluation.name}
                  </p>
                  <p className="text-sm text-gray-5">{evaluation.description}</p>
                  <p className="text-xs text-gray-4 mt-2">
                    Peso: {evaluation.weight}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASO 2: Seleccionar Rúbrica */}
        {step === 2 && (
          <div>
            <h4 className="mb-4 font-semibold text-black dark:text-white">
              Selecciona una rúbrica publicada
            </h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {rubrics.map((rubric) => (
                <div
                  key={rubric.id}
                  onClick={() => handleRubricSelect(rubric)}
                  className={`cursor-pointer p-4 border rounded-md transition ${
                    selectedRubric?.id === rubric.id
                      ? "border-primary bg-primary bg-opacity-10"
                      : "border-stroke hover:border-primary dark:border-strokedark"
                  }`}
                >
                  <p className="font-semibold text-black dark:text-white">
                    {rubric.title}
                  </p>
                  <p className="text-sm text-gray-5">{rubric.description}</p>
                  <p className="text-xs text-gray-4 mt-2">
                    Publicada: {new Date(rubric.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASO 3: Confirmar */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Información de la Evaluación */}
            <div>
              <h4 className="mb-3 font-semibold text-black dark:text-white">
                Evaluación Seleccionada
              </h4>
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-2 rounded-md dark:bg-meta-4">
                <div>
                  <p className="text-sm text-gray-5">Nombre:</p>
                  <p className="font-semibold text-black dark:text-white">
                    {selectedEvaluation?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-5">Ponderación:</p>
                  <p className="font-semibold text-black dark:text-white">
                    {selectedEvaluation?.weight}%
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-5">Descripción:</p>
                  <p className="text-sm text-black dark:text-white">
                    {selectedEvaluation?.description}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-5">Creada:</p>
                  <p className="text-sm text-black dark:text-white">
                    {new Date(selectedEvaluation?.created_at || "").toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Información de la Rúbrica */}
            <div>
              <h4 className="mb-3 font-semibold text-black dark:text-white">
                Rúbrica Seleccionada
              </h4>
              <div className="p-4 bg-gray-2 rounded-md dark:bg-meta-4 space-y-4">
                <div>
                  <p className="text-sm text-gray-5">Título:</p>
                  <p className="font-semibold text-black dark:text-white">
                    {selectedRubric?.title}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-5">Descripción:</p>
                  <p className="text-sm text-black dark:text-white">
                    {selectedRubric?.description}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-5 mb-2">Criterios ({rubricCriteria.length}):</p>
                  <div className="space-y-2">
                    {rubricCriteria.map((criterion) => (
                      <div key={criterion.id} className="text-sm border-l-2 border-primary pl-3">
                        <p className="font-medium text-black dark:text-white">
                          {criterion.name} ({criterion.weight}%)
                        </p>
                        <p className="text-gray-5">{criterion.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-5">Publicada:</p>
                  <p className="text-sm text-black dark:text-white">
                    {new Date(selectedRubric?.created_at || "").toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Advertencia */}
            <div className="p-4 bg-yellow-2 rounded-md border border-yellow">
              <p className="text-sm text-yellow-3">
                ⚠️ Una vez asociada, no podrás cambiar la rúbrica si ya hay calificaciones.
              </p>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-4 mt-8 justify-between">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="px-6 py-2 border border-stroke rounded-md text-gray-5 hover:bg-gray-2 disabled:opacity-50 dark:border-strokedark"
          >
            Atrás
          </button>

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 disabled:opacity-50"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-6 py-2 bg-success text-white rounded-md hover:bg-opacity-90 disabled:opacity-50"
            >
              {loading ? "Asociando..." : "Confirmar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssociateRubric;