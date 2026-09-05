// CET-6 Platform Core Type Definitions

export type ExamSectionType = 'writing' | 'listening' | 'reading_cloze' | 'reading_match' | 'reading_careful' | 'translation';

export interface QuestionItem {
  id: string; // e.g. "q1", "q2"
  number: number; // 1 to 55
  type: ExamSectionType;
  sectionTitle: string;
  points: number; // Raw points (e.g. 7.1 or 14.2)
  options?: { label: string; text: string }[];
  correctAnswer: string;
  analysis: string;
  transcriptSnippet?: string; // For listening questions
}

export interface ExamSection {
  id: string;
  type: ExamSectionType;
  title: string;
  subTitle: string;
  timeGuideMinutes: number;
  instructions: string;
  content?: string; // Text content (passages, reading texts, writing prompts)
  audioStartSeconds?: number; // Starting timestamp in MP3
  questions: QuestionItem[];
}

export interface LyricLine {
  time: number; // seconds
  text: string;
  translation?: string;
  section?: string;
}

export interface ExamPaper {
  id: string;
  title: string;
  year: number;
  month: number;
  setNumber: number;
  badge: string;
  totalTimeMinutes: number;
  totalScore: 710;
  audioUrl?: string;
  audioTitle?: string;
  lyrics?: LyricLine[];
  answerPdfUrl?: string;
  sections: ExamSection[];
}

export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface CanvasStroke {
  id: string;
  tool: 'pen' | 'highlighter' | 'eraser';
  color: string;
  size: number;
  opacity: number;
  points: StrokePoint[];
}

export interface PageAnnotation {
  id: string;
  paperId: string;
  pageIndex: number;
  strokes: CanvasStroke[];
  updatedAt: number;
}

export interface UserExamRecord {
  id: string;
  paperId: string;
  startedAt: number;
  finishedAt?: number;
  durationSeconds: number;
  userAnswers: Record<string, string>; // questionId -> answer
  rawScores: {
    listening: number;
    reading: number;
    writingAndTranslation: number;
    total: number;
  };
  cet6Scores: {
    listening: number;
    reading: number;
    writingAndTranslation: number;
    total: number;
  };
  accuracyRate: number;
}

export interface TaskPlan {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0-6 (0=Sunday)
  taskTitle: string;
  category: 'listening' | 'reading' | 'writing' | 'translation' | 'mock' | 'review';
  targetType: 'paper_section' | 'material_recall' | 'mock_exam';
  targetPaperId?: string;
  targetSectionId?: string;
  estimatedMinutes: number;
  isCompleted: boolean;
  completedAt?: number;
  isBuffer?: boolean; // In Sunday buffer pool
}

export interface StudyMaterial {
  id: string;
  type: 'writing' | 'translation';
  title: string;
  categoryTags: string[]; // e.g. ['#高分倒装句', '#开头引入', '#科技AI']
  englishText: string;
  chineseText: string;
  source?: string;
  clozeKeywords: string[]; // words to hide during active recall
  aiVariations?: string[]; // AI generated variations
  mastered: boolean;
  lastPracticedAt?: number;
}

export interface ErrorLogItem {
  id: string;
  paperId: string;
  paperTitle: string;
  questionNumber: number;
  sectionType: ExamSectionType;
  sectionTitle: string;
  questionContent?: string;
  userWrongAnswer: string;
  correctAnswer: string;
  rootCauseTags: ('生词障碍' | '长难句断句' | '干扰项偷换概念' | '听力连读弱读' | '审题偏差' | '词义混淆')[];
  analysisNote: string;
  reviewCount: number;
  cleared: boolean; // Cleared during redo
  addedAt: number;
}

export interface WordPhonetic {
  text?: string;
  audio?: string;
}

export interface WordDefinition {
  definition: string;
  example?: string;
  exampleTranslation?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export interface WordMeaning {
  partOfSpeech: string;
  partOfSpeechTips?: string;
  definitions: WordDefinition[];
  synonyms?: string[];
  antonyms?: string[];
}

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics: WordPhonetic[];
  meanings: WordMeaning[];
  sourceUrls?: string[];
  sourceName?: string;
  stars?: number;
}

export interface WordBookItem {
  id: string;
  word: string;
  phonetic?: string;
  simpleDef: string;
  fullEntry?: DictionaryEntry;
  sourceContext?: string;
  mastered: boolean;
  addedAt: number;
}
