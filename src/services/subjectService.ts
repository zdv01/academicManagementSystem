import axios from "axios";

import { Subject } from "../models/Subject";

import { ApiResponse } from "../models/dto/apiResponse";

import { CreateSubjectRequest } from "../models/dto/createSubjectRequest";
import { UpdateSubjectRequest } from "../models/dto/updateSubjectRequest";

import { DeleteEntityResponse } from "../models/dto/deleteEntityResponse";

const API_URL = import.meta.env.VITE_API_URL + "/academic/subjects" || "";

class SubjectService {

    async getSubjects(): Promise<Subject[]> {

        try {

            const response = await axios.get<ApiResponse<Subject[]>>(
                API_URL
            );

            return response.data.data;

        } catch (error) {

            console.error("Error al obtener asignaturas:", error);

            return [];
        }
    }

    async getSubjectById(id: string): Promise<Subject | null> {

        try {

            const response = await axios.get<ApiResponse<Subject>>(
                `${API_URL}/${id}`
            );

            return response.data.data;

        } catch (error) {

            console.error("Error al obtener asignatura:", error);

            return null;
        }
    }

    async createSubject(
        subject: CreateSubjectRequest
    ): Promise<Subject | null> {

        try {

            const response = await axios.post<ApiResponse<Subject>>(
                API_URL,
                subject
            );

            return response.data.data;

        } catch (error) {

            console.error("Error al crear asignatura:", error);

            return null;
        }
    }

    async updateSubject(
        id: string,
        subject: UpdateSubjectRequest
    ): Promise<Subject | null> {

        try {

            const response = await axios.put<ApiResponse<Subject>>(
                `${API_URL}/${id}`,
                subject
            );

            return response.data.data;

        } catch (error) {

            console.error("Error al actualizar asignatura:", error);

            return null;
        }
    }

    async deleteSubject(
        id: string
    ): Promise<DeleteEntityResponse | null> {

        try {

            const response = await axios.delete<
                ApiResponse<DeleteEntityResponse>
            >(`${API_URL}/${id}`);

            return response.data.data;

        } catch (error) {

            console.error("Error al eliminar asignatura:", error);

            return null;
        }
    }

    async searchSubjects(
        name: string
    ): Promise<Subject[]> {

        try {

            const response = await axios.get<ApiResponse<Subject[]>>(
                `${API_URL}/search?name=${name}`
            );

            return response.data.data;

        } catch (error) {

            console.error("Error al buscar asignaturas:", error);

            return [];
        }
    }
}

export const subjectService = new SubjectService();