export interface Evaluation {
    id: string;
    name: string;
    description: string;
    subject_id: string;
    group_id: string;
    rubric_id: string | null;
    weight: number;
    created_at: string;
    updated_at: string;
}