import axios from "axios";
import { ApiResponse } from "../models/dto/apiResponse";
import { RegisterFinalGradeRequest } from "../models/dto/registerFinalGradeRequest";
import { ConsolidatedGrade } from "../models/dto/consolidatedGrade";

const BASE_URL = import.meta.env.VITE_API_URL + "/evaluation/final-grades" || "";

class FinalGradeService {
    /**
     * Obtener notas consolidadas de un grupo
     * Calcula suma ponderada de todas las evaluaciones para cada estudiante
     */
    async getConsolidatedGradesByGroup(groupId: string): Promise<ConsolidatedGrade[]> {
        try {
            const response = await axios.get<ApiResponse<ConsolidatedGrade[]>>(
                `${BASE_URL}/group/${groupId}/consolidated`
            );
            return response.data.data;
        } catch (error) {
            console.error("Error al obtener notas consolidadas:", error);
            return [];
        }
    }

    /**
     * Obtener una nota consolidada específica de un estudiante
     */
    async getConsolidatedGrade(enrollmentId: string): Promise<ConsolidatedGrade | null> {
        try {
            const response = await axios.get<ApiResponse<ConsolidatedGrade>>(
                `${BASE_URL}/enrollment/${enrollmentId}/consolidated`
            );
            return response.data.data;
        } catch (error) {
            console.error("Error al obtener nota consolidada:", error);
            return null;
        }
    }

    /**
     * Registrar oficialmente la nota final de un estudiante
     * Bloquea la edición posteriorm una vez registrada
     */
    async registerFinalGrade(data: RegisterFinalGradeRequest): Promise<boolean> {
        try {
            await axios.post(`${BASE_URL}/register`, data);
            return true;
        } catch (error) {
            console.error("Error al registrar nota final:", error);
            return false;
        }
    }

    /**
     * Registrar notas finales de múltiples estudiantes (batch)
     */
    async registerFinalGradesBatch(
        groupId: string,
        enrollments: RegisterFinalGradeRequest[]
    ): Promise<boolean> {
        try {
            await axios.post(`${BASE_URL}/group/${groupId}/register-batch`, {
                enrollments,
            });
            return true;
        } catch (error) {
            console.error("Error al registrar notas finales en lote:", error);
            return false;
        }
    }

    /**
     * Validar que todas las evaluaciones del grupo están calificadas
     */
    async validateGroupReadiness(groupId: string): Promise<{
        isReady: boolean;
        incompleteStudents: string[];
        message: string;
    }> {
        try {
            const response = await axios.get<
                ApiResponse<{
                    isReady: boolean;
                    incompleteStudents: string[];
                    message: string;
                }>
            >(`${BASE_URL}/group/${groupId}/validate`);
            return response.data.data;
        } catch (error) {
            console.error("Error al validar grupo:", error);
            return {
                isReady: false,
                incompleteStudents: [],
                message: "Error en la validación",
            };
        }
    }

    /**
     * Descargar reporte de notas del grupo en PDF
     */
    async downloadGroupGradeReport(groupId: string): Promise<Blob> {
        try {
            const response = await axios.get(
                `${BASE_URL}/group/${groupId}/report/pdf`,
                { responseType: "blob" }
            );
            return response.data;
        } catch (error) {
            console.error("Error al descargar reporte:", error);
            throw error;
        }
    }

    /**
     * Obtener reporte de notas (datos para visualizar)
     */
    async getGroupGradeReport(groupId: string): Promise<ConsolidatedGrade[]> {
        try {
            const response = await axios.get<ApiResponse<ConsolidatedGrade[]>>(
                `${BASE_URL}/group/${groupId}/report`
            );
            return response.data.data;
        } catch (error) {
            console.error("Error al obtener reporte:", error);
            return [];
        }
    }

    /**
     * Bloquear nota final (solo administrador)
     */
    async lockFinalGrade(enrollmentId: string): Promise<boolean> {
        try {
            await axios.patch(`${BASE_URL}/enrollment/${enrollmentId}/lock`);
            return true;
        } catch (error) {
            console.error("Error al bloquear nota final:", error);
            return false;
        }
    }

    /**
     * Desbloquear nota final (solo administrador)
     */
    async unlockFinalGrade(enrollmentId: string): Promise<boolean> {
        try {
            await axios.patch(`${BASE_URL}/enrollment/${enrollmentId}/unlock`);
            return true;
        } catch (error) {
            console.error("Error al desbloquear nota final:", error);
            return false;
        }
    }
}

export const finalGradeService = new FinalGradeService();
