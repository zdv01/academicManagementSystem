import axios from "axios";

import { Career } from "../models/Career";

import { ApiCareer } from "../dto/apiCareer";
import { ApiResponse } from "../dto/apiResponse";

import { CreateCareerRequest } from "../dto/createCareerRequest";
import { UpdateCareerRequest } from "../dto/updateCareerRequest";

const API_URL = import.meta.env.VITE_API_URL + "/academic/careers" || "";

class CareerService {

    async getCareers(): Promise<Career[]> {
        try {

            const response = await axios.get<ApiResponse<Career[]>>(
                API_URL
            );

            return response.data.data;

        } catch (error) {

            console.error("Error al obtener careers:", error);

            return [];
        }
    }

    async getCareerById(id: string): Promise<Career | null> {
        try {

            const response = await axios.get<ApiResponse<Career>>(
                `${API_URL}/${id}`
            );

            return response.data.data;

        } catch (error) {

            console.error("Career no encontrada:", error);

            return null;
        }
    }

    async createCareer(
        career: CreateCareerRequest
    ): Promise<ApiCareer | null> {

        try {

            const response = await axios.post<{ data: Career }>(
                `${API_URL}`,
                career
            );

            return response.data.data;

        } catch (error) {

            console.error("Error al crear career:", error);

            return null;
        }
    }

    async updateCareer(
        id: string,
        career: UpdateCareerRequest
    ): Promise<ApiCareer | null> {

        try {

            const response = await axios.put<{ data: Career }>(
                `${API_URL}/${id}`,
                career
            );

            return response.data.data;

        } catch (error) {

            console.error("Error al actualizar career:", error);

            return null;
        }
    }

    async searchCareers(name: string): Promise<Career[]> {

        try {

            const response = await axios.get<ApiResponse<Career[]>>(
                `${API_URL}/search?name=${encodeURIComponent(name)}`
            );

            return response.data.data;

        } catch (error) {

            console.error("Error al buscar careers:", error);

            return [];
        }
    }

    async deleteCareer(id: string): Promise<boolean> {

        try {

            await axios.delete(`${API_URL}/${id}`);

            return true;

        } catch (error) {

            console.error("Error al eliminar career:", error);

            return false;
        }
    }
}

export const careerService = new CareerService();