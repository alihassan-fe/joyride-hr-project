export type CandidateRecommendation = "Call Immediatley" | "Remove" | "Shortlist";

export type Candidate = {
  id: number;
  name: string;
  email: string;
  phone: string;
  cv_link: string | null;
  dispatch: number | null;
  operations_manager: number | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  notes: string | null;
  recommendation: CandidateRecommendation | null;
  created_at: string;
};
