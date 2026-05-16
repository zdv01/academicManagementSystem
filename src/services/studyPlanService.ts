import axios from "axios";

import { StudyPlan } from "../models/StudyPlan";
import { Subject } from "../models/Subject";

import { ApiResponse } from "../models/dto/apiResponse";

import { CreateStudyPlanRequest } from "../models/dto/createStudyPlanRequest";
import { UpdateStudyPlanRequest } from "../models/dto/updateStudyPlanRequest";

import { DeleteEntityResponse } from "../models/dto/deleteEntityResponse";

const API_URL = import.meta.env.VITE_API_URL + "/academic/study-plans" || "";

class StudyPlanService {

    async getStudyPlans(): Promise<StudyPlan[]> {

        try {

            const response = await axios.get<ApiResponse<StudyPlan[]>>(API_URL);

            return response.data.data;

        } catch (error) {

            console.error("Error al obtener planes de estudio:", error);

            return [];
        }
    }

    async getStudyPlanById(id: string): Promise<StudyPlan | null> {

        try {

            const response = await axios.get<ApiResponse<StudyPlan>>(
                `${API_URL}/${id}`
            );

            return response.data.data;

        } catch (error) {

            console.error("Error al obtener plan de estudio:", error);

            return null;
        }
    }

    async createStudyPlan(
        studyPlan: CreateStudyPlanRequest
    ): Promise<StudyPlan | null> {

        try {

            const response = await axios.post<ApiResponse<StudyPlan>>(
                API_URL,
                studyPlan
            );

            return response.data.data;

        } catch (error) {

            console.error("Error al crear plan de estudio:", error);

            return null;
        }
    }


    async updateStudyPlan(
        id: string,
        studyPlan: UpdateStudyPlanRequest
    ): Promise<StudyPlan | null> {

        try {

            const response = await axios.put<ApiResponse<StudyPlan>>(
                `${API_URL}/${id}`,
                studyPlan
            );

            return response.data.data;

        } catch (error) {

            console.error("Error al actualizar plan de estudio:", error);

            return null;
        }
    }


    async deleteStudyPlan(
        id: string
    ): Promise<DeleteEntityResponse | null> {

        try {

            const response = await axios.delete<
                ApiResponse<DeleteEntityResponse>
            >(`${API_URL}/${id}`);

            return response.data.data;

        } catch (error) {

            console.error("Error al eliminar plan de estudio:", error);

            return null;
        }
    }

    async searchStudyPlans(
        name: string
    ): Promise<StudyPlan[]> {

        try {

            const response = await axios.get<ApiResponse<StudyPlan[]>>(
                `${API_URL}/search?name=${name}`
            );

            return response.data.data;

        } catch (error) {

            console.error("Error al buscar planes de estudio:", error);

            return [];
        }
    }

    async linkSubjectToStudyPlan(
        studyPlanId: string,
        subjectId: string
    ): Promise<StudyPlan | null> {

        try {

            const response = await axios.post<ApiResponse<StudyPlan>>(
                `${API_URL}/${studyPlanId}/subjects/${subjectId}`
            );

            return response.data.data;

        } catch (error) {

            console.error(
                "Error al vincular asignatura al plan:",
                error
            );

            return null;
        }
    }

    async unlinkSubjectFromStudyPlan(
        studyPlanId: string,
        subjectId: string
    ): Promise<StudyPlan | null> {

        try {

            const response = await axios.delete<ApiResponse<StudyPlan>>(
                `${API_URL}/${studyPlanId}/subjects/${subjectId}`
            );

            return response.data.data;

        } catch (error) {

            console.error(
                "Error al desvincular asignatura del plan:",
                error
            );

            return null;
        }
    }

    async getStudyPlanSubjects(
        studyPlanId: string
    ): Promise<Subject[]> {

        try {

            const response = await axios.get<ApiResponse<Subject[]>>(
                `${API_URL}/${studyPlanId}/subjects`
            );

            return response.data.data;

        } catch (error) {

            console.error(
                "Error al obtener asignaturas del plan:",
                error
            );

            return [];
        }
    }
}

export const studyPlanService = new StudyPlanService();