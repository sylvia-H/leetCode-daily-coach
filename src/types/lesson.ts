export type Track = "foundation" | "interviewReady" | "interviewMastery";
export type SessionType = "concept" | "practice" | "review" | "challenge" | "rest";

export interface Problem {
  id: number;
  title: string;
  url: string;
  difficulty: "Easy" | "Medium" | "Hard";
  whyThisPattern: string;
  hint?: string;
}

export interface PathLabels {
  prev?: string;
  current: string;
  next?: string;
}

export interface LessonConcept {
  id: string;
  title: string;
  moduleColor: number;
  digest: string;
  tsTip: string;
  pyTip: string;
  takeaway: string;
  exitCriteria: string[];
  patternLabel: string;
  complexityLabel: string;
  estimatedMinutes: number;
  articlePath: string;
}

export interface Lesson {
  sessionIndex: number;
  type: SessionType;
  track: Track;
  concept: LessonConcept;
  problems: Problem[];
  path: PathLabels;
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  footer?: { text: string };
  author?: { name: string };
  url?: string;
}
