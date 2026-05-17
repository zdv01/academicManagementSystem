import axios from "axios";
import { Enrollments } from "../models/Enrollments";
import { ApiResponse } from "../models/dto/apiResponse";

const API_URL = import.meta.env.VITE_API_URL + "/academic/enrollments" || "";

class EnrollmentsService {
    async getEnrollments(): Promise<Enrollments[]> {
        try {
            const response = await axios.get<ApiResponse<Enrollments[]>>(API_URL);
            return response.data.data;
        } catch (error) {
            console.error("Error al obtener inscripciones:", error);
            return [];
        }
    }
}

export const enrollmentsService = new EnrollmentsService();
