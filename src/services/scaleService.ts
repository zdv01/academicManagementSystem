import axios from "axios";
import { Scale } from "../models/Scale";
import { ApiResponse } from "../models/dto/apiResponse";
import { CreateScaleRequest } from "../models/dto/createScaleRequest";

const API_URL = import.meta.env.VITE_API_URL + "/evaluation/scales" || "";

class ScaleService {
    async getScales(): Promise<Scale[]> {
        try {
            const response = await axios.get<ApiResponse<Scale[]>>(API_URL);
            return response.data.data;
        } catch (error) {
            console.error("Error al obtener escalas:", error);
            return [];
        }
    }

    async createScale(data: CreateScaleRequest): Promise<Scale | null> {
        try {
            const response = await axios.post<ApiResponse<Scale>>(API_URL, data);
            return response.data.data;
        } catch (error) {
            console.error("Error al crear escala:", error);
            return null;
        }
    }

    async updateScale(
        id: string,
        data: CreateScaleRequest
    ): Promise<Scale | null> {
        try {
            const response = await axios.put<ApiResponse<Scale>>(
                `${API_URL}/${id}`,
                data
            );
            return response.data.data;
        } catch (error) {
            console.error("Error al actualizar escala:", error);
            return null;
        }
    }

    async deleteScale(id: string): Promise<boolean> {
        try {
            await axios.delete(`${API_URL}/${id}`);
            return true;
        } catch (error) {
            console.error("Error al eliminar escala:", error);
            return false;
        }
    }
}

export const scaleService = new ScaleService();
