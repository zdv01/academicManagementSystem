export interface ConsolidatedGrade {
    enrollment_id: string;
    student_name: string;
    student_id: string;
    identification: string;
    status: string;
    weighted_final_grade: number;
    is_locked: boolean;
    evaluation_details: {
        evaluation_name: string;
        evaluation_weight: number;
        grade_value: number;
        calculated_contribution: number;
    }[];
    observations: string | null;
}
