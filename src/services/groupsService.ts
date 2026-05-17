import axios from "axios";

import { Group } from "../models/Group";

import { ApiResponse } from "../models/dto/apiResponse";

import { CreateGroupRequest } from
"../models/dto/createGroupRequest";

import { UpdateGroupRequest } from
"../models/dto/updateGroupRequest";

import { DeleteEntityResponse } from
"../models/dto/deleteEntityResponse";

import { FinalScoreResponse } from
"../models/dto/finalScoreResponse";

const API_URL =
    import.meta.env.VITE_API_URL +
    "/academic/groups" || "";

class GroupService {

    async getGroups(): Promise<Group[]> {

        try {

            const response = await axios.get<
                ApiResponse<Group[]>
            >(API_URL);

            return response.data.data;

        } catch (error) {

            console.error(
                "Error al obtener grupos:",
                error
            );

            return [];
        }
    }

    async getGroupById(
        id: string
    ): Promise<Group | null> {

        try {

            const response = await axios.get<
                ApiResponse<Group>
            >(`${API_URL}/${id}`);

            return response.data.data;

        } catch (error) {

            console.error(
                "Error al obtener grupo:",
                error
            );

            return null;
        }
    }

    async createGroup(
        group: CreateGroupRequest
    ): Promise<Group | null> {

        try {

            const response = await axios.post<
                ApiResponse<Group>
            >(
                API_URL,
                group
            );

            return response.data.data;

        } catch (error) {

            console.error(
                "Error al crear grupo:",
                error
            );

            return null;
        }
    }

    async updateGroup(
        id: string,
        group: UpdateGroupRequest
    ): Promise<Group | null> {

        try {

            const response = await axios.put<
                ApiResponse<Group>
            >(
                `${API_URL}/${id}`,
                group
            );

            return response.data.data;

        } catch (error) {

            console.error(
                "Error al actualizar grupo:",
                error
            );

            return null;
        }
    }

    async deleteGroup(
        id: string
    ): Promise<DeleteEntityResponse | null> {

        try {

            const response = await axios.delete<
                ApiResponse<DeleteEntityResponse>
            >(`${API_URL}/${id}`);

            return response.data.data;

        } catch (error) {

            console.error(
                "Error al eliminar grupo:",
                error
            );

            return null;
        }
    }

    async searchGroups(
        name: string
    ): Promise<Group[]> {

        try {

            const response = await axios.get<
                ApiResponse<Group[]>
            >(
                `${API_URL}/search?name=${name}`
            );

            return response.data.data;

        } catch (error) {

            console.error(
                "Error al buscar grupos:",
                error
            );

            return [];
        }
    }

    async assignTeacher(
        groupId: string,
        teacherId: string
    ): Promise<Group | null> {

        try {

            const response = await axios.patch<
                ApiResponse<Group>
            >(
                `${API_URL}/${groupId}/assign-teacher/${teacherId}`
            );

            return response.data.data;

        } catch (error) {

            console.error(
                "Error al asignar profesor:",
                error
            );

            return null;
        }
    }

    async registerFinalScores(
        groupId: string
    ): Promise<FinalScoreResponse[]> {

        try {

            const response = await axios.post<
                ApiResponse<FinalScoreResponse[]>
            >(
                `${API_URL}/${groupId}/register-final-scores`
            );

            return response.data.data;

        } catch (error) {

            console.error(
                "Error al registrar notas finales:",
                error
            );

            return [];
        }
    }
}

export const groupService =
    new GroupService();