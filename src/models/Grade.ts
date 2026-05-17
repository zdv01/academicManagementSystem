import { GradeDetail } from "./GradeDetail";

export interface Grade {
    id: string;
    enrollment_id: string;
    rubric_id: string;
    status: "DRAFT" | "SUBMITTED";
    final_score: number;
    observations: string | null;
    is_locked: boolean;
    details: GradeDetail[];
    created_at: string;
    updated_at: string;
}
