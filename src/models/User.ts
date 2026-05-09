//modelo para visualizacion de usuarios en tablas
export interface User {
    code: string;
    fullName: string;
    email: string;
    role: "ADMIN" | "STUDENT" | "TEACHER" | string;
    specialty?: string;
    career?: string;
    isActive: string;
    createdAt: string;
}