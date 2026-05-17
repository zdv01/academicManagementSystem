import axios from "axios";
import { Criterion } from "../models/Criterion";
import { ApiResponse } from "../models/dto/apiResponse";
import { CreateCriterionRequest } from "../models/dto/createCriterionRequest";

const API_URL = import.meta.env.VITE_API_URL + "/evaluation/criteria" || "";

class CriterionService {
    async getCriteria(): Promise<Criterion[]> {
        try {
            const response = await axios.get<ApiResponse<Criterion[]>>(API_URL);
            return response.data.data;
        } catch (error) {
            console.error("Error al obtener criterios:", error);
            return [];
        }
    }

    async createCriterion(data: CreateCriterionRequest): Promise<Criterion | null> {
        try {
            const response = await axios.post<ApiResponse<Criterion>>(API_URL, data);
            return response.data.data;
        } catch (error) {
            console.error("Error al crear criterio:", error);
            return null;
        }
    }

    async deleteCriterion(id: string): Promise<boolean> {
        try {
            await axios.delete(`${API_URL}/${id}`);
            return true;
        } catch (error) {
            console.error("Error al eliminar criterio:", error);
            return false;
        }
    }
}

export const criterionService = new CriterionService();
