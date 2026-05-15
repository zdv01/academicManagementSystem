export interface UpdateUserRequest {
    email: string;
    code: string;
    role: string;

    first_name: string;
    last_name: string;

    identification: string;

    phone?: string;
    specialty?: string;
}