export interface CreateUserRequest {
    email: string;
    code: string;
    role: string;
    first_name: string;
    last_name: string;
    identification: string;
}