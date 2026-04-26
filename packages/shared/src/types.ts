export type ScreeningStatus = "pending" | "processing" | "completed" | "failed";

export type Recommendation = "strong_match" | "possible_match" | "weak_match";

export interface MatchBreakdown {
  overallScore: number;
  skillMatchScore: number;
  experienceMatchScore: number;
  locationMatchScore: number;
  educationMatchScore: number;
  missingSkills: string[];
  matchedSkills: string[];
  strengths: string[];
  risks: string[];
  recruiterSummary: string;
  recommendation: Recommendation;
}

export interface ExtractedJob {
  title: string;
  company?: string;
  location?: string;
  experienceMin?: number;
  experienceMax?: number;
  skills: string[];
  requirements: string[];
  responsibilities: string[];
}

export interface ExtractedCandidate {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  experienceYears?: number;
  skills: string[];
  education: string[];
  workHistory: string[];
}
