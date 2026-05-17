import axios from "axios";

import { Teacher } from "../models/Teacher";

import { ApiResponse } from
"../models/dto/apiResponse";

const API_URL =
    import.meta.env.VITE_API_URL +
    "/academic/teachers" || "";

class TeacherService {

    async searchTeachers(
        identification: string
    ): Promise<Teacher[]> {

        try {

            const response =
                await axios.get<
                    ApiResponse<Teacher[]>
                >(
                    `${API_URL}/search?identification=${encodeURIComponent(
                        identification
                    )}`
                );

            return response.data.data;

        } catch (error) {

            console.error(
                "Error al buscar docentes:",
                error
            );

            return [];
        }
    }
}

export const teacherService =
    new TeacherService();