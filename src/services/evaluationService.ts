import axios from "axios";
import { Evaluation } from "../models/Evaluation";
import { ApiResponse } from "../dto/apiResponse";

const API_URL = import.meta.env.VITE_API_URL + "/evaluation/evaluations" || "";

class EvaluationService {
    async getEvaluations(): Promise<Evaluation[]> {
        try {
            const response = await axios.get<ApiResponse<Evaluation[]>>(API_URL);
            return response.data.data;
        } catch (error) {
            console.error("Error al obtener evaluaciones:", error);
            return [];
        }
    }

    async associateRubricToEvaluation(
        evaluationId: string,
        rubricId: string
    ): Promise<boolean> {
        try {
            await axios.patch(
                `${API_URL}/${evaluationId}/associate-rubric/${rubricId}` //Asociacion de ribricas a evaluaciones
            );
            return true;
        } catch (error) {
            console.error("Error al asociar rúbrica:", error);
            return false;
        }
    }
}

export const evaluationService = new EvaluationService();