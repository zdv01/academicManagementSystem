import axios from 'axios';
import { User } from '../models/User';
import { ApiResponse } from '../models/dto/apiResponse';
import { CreateUserRequest } from '../models/dto/createUserRequest';
import { UpdateUserRequest } from '../models/dto/updateUserRequest';
import { ApiUser } from '../models/dto/apiUser';
const API_URL = import.meta.env.VITE_API_URL + '/users' || '';

class UserService {
    async getUsers(): Promise<User[]> {
        try {
            const response = await axios.get<ApiResponse<any[]>>(API_URL);

            return response.data.data; //de ese json extraemos data[] que contiene a los usuarios
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            return [];
        }
    }

    // async getUserById(code: string): Promise<User | null> {
    //     try {
    //         const response = await axios.get<ApiResponse<any[]>>(`${API_URL}/${code}`);
    //         return response.data.data;
    //     } catch (error) {
    //         console.error("Usuario no encontrado:", error);
    //         return null;
    //     }
    // }

    async createUser(user: CreateUserRequest): Promise<ApiUser | null> {
        try {
            // Accedemos a .data.data para obtener el objeto del usuario
            const response = await axios.post<{ data: any }>(`${API_URL}/`, user);
            return response.data.data;
        } catch (error) {
            console.error('Error al crear usuario:', error);
            return null;
        }
    }

    // Cambiado a id: string porque tu API usa UUID
    async updateUser(id: string, user: UpdateUserRequest): Promise<ApiUser | null> {
        try {
            const response = await axios.put<{ data: any }>(`${API_URL}/${id}`, user);
            return response.data.data;
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            return null;
        }
    }

    async deactivateUser(id: string): Promise<boolean> {
        try {
            await axios.patch(`${API_URL}/${id}/deactivate`);
            return true;
        } catch (error) {
            console.error('Error al desactivar usuario:', error);
            return false;
        }
    }

    async registerStudent(user: CreateUserRequest): Promise<ApiUser | null> {
    try {

        const response = await axios.post<{ data: any }>(
            `${API_URL}/public/register-student`,
            user
        );

        return response.data.data;

    } catch (error) {

        console.error('Error al crear estudiante:', error);

        return null;
    }
}

async registerTeacher(user: CreateUserRequest): Promise<ApiUser | null> {
        try {

            const response = await axios.post<{ data: any }>(
                `${API_URL}/public/register-teacher`,
                user
            );

            return response.data.data;

        } catch (error) {

            console.error('Error al crear profesor:', error);

            return null;
        }
    }
}

// Exportamos una instancia de la clase para reutilizarla
export const userService = new UserService();
