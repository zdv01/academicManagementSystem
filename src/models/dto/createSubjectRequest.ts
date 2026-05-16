export interface CreateSubjectRequest {
    name: string;

    code: string;

    description: string | null;

    credits: number;

    is_active: boolean;
}