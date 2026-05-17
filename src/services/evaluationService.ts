import axios from "axios";
import { Evaluation } from "../models/Evaluation";
import { ApiResponse } from "../models/dto/apiResponse";

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

    async getEvaluationsWithRubric(): Promise<Evaluation[]> {
        const all = await this.getEvaluations();
        return all.filter((e) => e.rubric_id !== null);
    }

    async associateRubricToEvaluation(
        evaluationId: string,
        rubricId: string
    ): Promise<boolean> {
        try {
            await axios.patch(
                `${API_URL}/${evaluationId}/associate-rubric/${rubricId}`
            );
            return true;
        } catch (error) {
            console.error("Error al asociar rúbrica:", error);
            return false;
        }
    }

    async updateEvaluation(
        id: string,
        data: {
            name: string;
            description: string;
            group_id: string;
            weight: number;
            subject_id: string;
        }
    ): Promise<Evaluation | null> {
        try {
            const response = await axios.put<ApiResponse<Evaluation>>(
                `${API_URL}/${id}`,
                data
            );
            return response.data.data;
        } catch (error) {
            console.error("Error al actualizar evaluación:", error);
            return null;
        }
    }
}

export const evaluationService = new EvaluationService();