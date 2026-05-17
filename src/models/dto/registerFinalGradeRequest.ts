export interface RegisterFinalGradeRequest {
    enrollment_id: string;
    group_id: string;
    final_grade: number;
    observations?: string;
    is_locked: boolean;
}
