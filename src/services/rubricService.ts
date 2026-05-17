import axios from "axios";
import { Rubric } from "../models/Rubric";
import { ApiResponse } from "../models/dto/apiResponse";
import { CreateRubricRequest } from "../models/dto/createRubricRequest";

const API_URL = import.meta.env.VITE_API_URL + "/evaluation/rubrics" || "";

class RubricService {
    async getRubrics(): Promise<Rubric[]> {
        try {
            const response = await axios.get<ApiResponse<Rubric[]>>(API_URL);
            return response.data.data;
        } catch (error) {
            console.error("Error al obtener rúbricas:", error);
            return [];
        }
    }

    async getPublishedRubrics(): Promise<Rubric[]> {
        try {
            const response = await axios.get<ApiResponse<Rubric[]>>(API_URL);
            return response.data.data.filter((r) => r.is_public === true);
        } catch (error) {
            console.error("Error al obtener rúbricas:", error);
            return [];
        }
    }

    async getRubricById(id: string): Promise<Rubric | null> {
        try {
            const response = await axios.get<ApiResponse<Rubric>>(
                `${API_URL}/${id}`
            );
            return response.data.data;
        } catch (error) {
            console.error("Error al obtener rúbrica:", error);
            return null;
        }
    }

    async createRubric(data: CreateRubricRequest): Promise<Rubric | null> {
        try {
            const response = await axios.post<ApiResponse<Rubric>>(API_URL, data);
            return response.data.data;
        } catch (error) {
            console.error("Error al crear rúbrica:", error);
            return null;
        }
    }

    async publishRubric(id: string): Promise<boolean> {
        try {
            await axios.patch(`${API_URL}/${id}/publish`);
            return true;
        } catch (error) {
            console.error("Error al publicar rúbrica:", error);
            return false;
        }
    }
}

export const rubricService = new RubricService();