export interface EditableUser {
    id: string;
    email: string;
    code: string;
    role: string;

    firstName: string;
    lastName: string;
    identification: string;
    phone?: string;
    specialty?: string;
}