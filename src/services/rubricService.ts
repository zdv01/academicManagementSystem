import axios from "axios";
import { Rubric } from "../models/Rubric";
import { ApiResponse } from "../dto/apiResponse";

const API_URL = import.meta.env.VITE_API_URL + "/evaluation/rubrics" || "";

class RubricService {
    async getPublishedRubrics(): Promise<Rubric[]> {
        try {
            const response = await axios.get<ApiResponse<Rubric[]>>(API_URL);
            // Filtra solo las rúbricas publicadas (is_public = true)
            const allRubrics = response.data.data;
            return allRubrics.filter((r) => r.is_public === true);
        } catch (error) {
            console.error("Error al obtener rúbricas:", error);
            return [];
        }
    }
}

export const rubricService = new RubricService();