export interface UpdateStudyPlanRequest {
    career_id: string;

    name: string;

    year: number;

    suggested_semester: number;

    is_published: boolean;
}