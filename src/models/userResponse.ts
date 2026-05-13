export interface UserResponse {
    id: string;
    code: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;

    profile: {
        first_name: string;
        last_name: string;
        identification: string;
    };
}