import axios from "axios";
import { Groups } from "../models/Groups";
import { ApiResponse } from "../models/dto/apiResponse";

const API_URL = import.meta.env.VITE_API_URL + "/academic/groups" || "";

class GroupsService {
    async getGroups(): Promise<Groups[]> {
        try {
            const response = await axios.get<ApiResponse<Groups[]>>(API_URL);
            return response.data.data;
        } catch (error) {
            console.error("Error al obtener grupos:", error);
            return [];
        }
    }

    async getGroupById(id: string): Promise<Groups | null> {
        try {
            const response = await axios.get<ApiResponse<Groups>>(`${API_URL}/${id}`);
            return response.data.data;
        } catch (error) {
            console.error("Error al obtener grupo:", error);
            return null;
        }
    }
}

export const groupsService = new GroupsService();