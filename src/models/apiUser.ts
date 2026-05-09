export interface ApiUser {
    id: string;
    code: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
    profile?: {
        first_name: string;
        last_name: string;
        specialty?: string;
    };
}