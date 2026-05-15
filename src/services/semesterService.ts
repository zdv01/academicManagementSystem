import axios from "axios";

import { Semester } from "../models/Semester";

import { ApiSemester } from "../models/dto/apiSemester";

import { ApiResponse } from "../models/dto/apiResponse";

import { CreateSemesterRequest } from "../models/dto/createSemesterRequest";

import { UpdateSemesterRequest } from "../models/dto/updateSemesterRequest";

const API_URL =
    import.meta.env.VITE_API_URL +
    "/academic/semesters" || "";

class SemesterService {

    async getSemesters(): Promise<Semester[]> {

        try {

            const response =
                await axios.get<
                    ApiResponse<Semester[]>
                >(API_URL);

            return response.data.data;

        } catch (error) {

            console.error(
                "Error al obtener semesters:",
                error
            );

            return [];
        }
    }

    async getSemesterById(
        id: string
    ): Promise<Semester | null> {

        try {

            const response =
                await axios.get<
                    ApiResponse<Semester>
                >(`${API_URL}/${id}`);

            return response.data.data;

        } catch (error) {

            console.error(
                "Semester no encontrado:",
                error
            );

            return null;
        }
    }

    async createSemester(
        semester: CreateSemesterRequest
    ): Promise<ApiSemester | null> {

        try {

            const response =
                await axios.post<
                    { data: Semester }
                >(
                    `${API_URL}`,
                    semester
                );

            return response.data.data;

        } catch (error) {

            console.error(
                "Error al crear semester:",
                error
            );

            return null;
        }
    }

    async updateSemester(
        id: string,
        semester: UpdateSemesterRequest
    ): Promise<ApiSemester | null> {

        try {

            const response =
                await axios.put<
                    { data: Semester }
                >(
                    `${API_URL}/${id}`,
                    semester
                );

            return response.data.data;

        } catch (error) {

            console.error(
                "Error al actualizar semester:",
                error
            );

            return null;
        }
    }

    async searchSemesters(
        name: string
    ): Promise<Semester[]> {

        try {

            const response =
                await axios.get<
                    ApiResponse<Semester[]>
                >(
                    `${API_URL}/search?name=${encodeURIComponent(name)}`
                );

            return response.data.data;

        } catch (error) {

            console.error(
                "Error al buscar semesters:",
                error
            );

            return [];
        }
    }

    async deleteSemester(
        id: string
    ): Promise<boolean> {

        try {

            await axios.delete(
                `${API_URL}/${id}`
            );

            return true;

        } catch (error) {

            console.error(
                "Error al eliminar semester:",
                error
            );

            return false;
        }
    }
}

export const semesterService =
    new SemesterService();