import axios from "axios";
import { User } from "../models/User";
import { ApiResponseUsers } from "../models/apiResponseUsers";
const API_URL = import.meta.env.VITE_API_URL + "/users" || "";

class UserService {
    async getUsers(): Promise<User[]> {
        try {
            const response = await axios.get<ApiResponseUsers<any[]>>(API_URL);

            return response.data.data; //de ese json extraemos data[] que contiene a los usuarios
        } catch (error) {
            console.error("Error al obtener usuarios:", error);
            return [];
        }
    }

    // async getUserById(code: string): Promise<User | null> {
    //     try {
    //         const response = await axios.get<ApiResponseUsers<any[]>>(`${API_URL}/${code}`);
    //         return response.data.data;
    //     } catch (error) {
    //         console.error("Usuario no encontrado:", error);
    //         return null;
    //     }
    // }

    async createUser(user: Omit<User, "id">): Promise<User | null> {
        try {
            const response = await axios.post<User>(API_URL, user);
            return response.data;
        } catch (error) {
            console.error("Error al crear usuario:", error);
            return null;
        }
    }

    async updateUser(id: number, user: Partial<User>): Promise<User | null> {
        try {
            const response = await axios.put<User>(`${API_URL}/${id}`, user);
            return response.data;
        } catch (error) {
            console.error("Error al actualizar usuario:", error);
            return null;
        }
    }

    async deleteUser(id: number): Promise<boolean> {
        try {
            await axios.delete(`${API_URL}/${id}`);
            return true;
        } catch (error) {
            console.error("Error al eliminar usuario:", error);
            return false;
        }
    }
}

// Exportamos una instancia de la clase para reutilizarla
export const userService = new UserService();
