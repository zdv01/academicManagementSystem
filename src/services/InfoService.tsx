import axios from "axios";
import { Info } from "../models/Info";

const API_URL = import.meta.env.VITE_API_URL || "";

class InfoService {
    async getInfo(): Promise<Info[]> {
        try {
            const response = await axios.get<Info[]>(API_URL);
            console.log("la dataaaaa por ul", response.data);
            return response.data;

        } catch (error) {
            console.error("Error al obtener info:", error);
            return [];
        }
    }

    async getInfoById(id: number): Promise<Info | null> {
        try {
            const response = await axios.get<Info>(`${API_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error("Usuario no encontrado:", error);
            return null;
        }
    }

    async createInfo(user: Omit<Info, "id">): Promise<Info | null> {
        try {
            const response = await axios.post<Info>(API_URL, user);
            return response.data;
        } catch (error) {
            console.error("Error al crear info:", error);
            return null;
        }
    }

    async updateInfo(id: number, user: Partial<Info>): Promise<Info | null> {
        try {
            const response = await axios.put<Info>(`${API_URL}/${id}`, user);
            return response.data;
        } catch (error) {
            console.error("Error al actualizar info:", error);
            return null;
        }
    }

    async deleteInfo(id: number): Promise<boolean> {
        try {
            await axios.delete(`${API_URL}/${id}`);
            return true;
        } catch (error) {
            console.error("Error al eliminar info:", error);
            return false;
        }
    }
}

// Exportamos una instancia de la clase para reutilizarla
export const infoService = new InfoService();