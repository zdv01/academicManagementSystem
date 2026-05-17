import axios from "axios";
import { Grade } from "../models/Grade";
import { GradeDetail } from "../models/GradeDetail";
import { ApiResponse } from "../models/dto/apiResponse";

const BASE = import.meta.env.VITE_API_URL + "/evaluation" || "";

class GradeService {
    async getGrades(params?: {
        enrollment_id?: string;
        rubric_id?: string;
    }): Promise<Grade[]> {
        try {
            const query = new URLSearchParams();
            if (params?.enrollment_id) query.set("enrollment_id", params.enrollment_id);
            if (params?.rubric_id) query.set("rubric_id", params.rubric_id);
            const url = `${BASE}/grades${query.toString() ? "?" + query : ""}`;
            const response = await axios.get<ApiResponse<Grade[]>>(url);
            return response.data.data;
        } catch (error) {
            console.error("Error al obtener calificaciones:", error);
            return [];
        }
    }

    async updateGrade(
        id: string,
        data: {
            status: string;
            observations: string | null;
            final_score: number;
            enrollment_id: string;
            rubric_id: string;
        }
    ): Promise<Grade | null> {
        try {
            const response = await axios.put<ApiResponse<Grade>>(
                `${BASE}/grades/${id}`,
                data
            );
            return response.data.data;
        } catch (error) {
            console.error("Error al actualizar calificación:", error);
            return null;
        }
    }

    async updateGradeDetail(
        id: string,
        data: {
            scale_id: string;
            score: number;
            comment: string;
            student_id: string;
        }
    ): Promise<GradeDetail | null> {
        try {
            const response = await axios.put<ApiResponse<GradeDetail>>(
                `${BASE}/grade-details/${id}`,
                data
            );
            return response.data.data;
        } catch (error) {
            console.error("Error al actualizar detalle de calificación:", error);
            return null;
        }
    }
}

export const gradeService = new GradeService();
