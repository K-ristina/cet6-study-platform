import { ExamPaper, ExamSection, QuestionItem } from '../types';
import { getAssetUrl } from '../utils/assets';

interface PaperMeta {
  year: number;
  month: number;
  setNumber: number;
}

const PAPER_CONFIGS: PaperMeta[] = [
  // 2026
  { year: 2026, month: 6, setNumber: 1 },
  { year: 2026, month: 6, setNumber: 2 },
  { year: 2026, month: 6, setNumber: 3 },
  // 2025
  { year: 2025, month: 12, setNumber: 1 },
  { year: 2025, month: 12, setNumber: 2 },
  { year: 2025, month: 12, setNumber: 3 },
  { year: 2025, month: 6, setNumber: 1 },
  { year: 2025, month: 6, setNumber: 2 },
  { year: 2025, month: 6, setNumber: 3 },
  // 2024
  { year: 2024, month: 12, setNumber: 1 },
  { year: 2024, month: 12, setNumber: 2 },
  { year: 2024, month: 12, setNumber: 3 },
  { year: 2024, month: 6, setNumber: 1 },
  { year: 2024, month: 6, setNumber: 2 },
  { year: 2024, month: 6, setNumber: 3 },
  // 2023
  { year: 2023, month: 12, setNumber: 1 },
  { year: 2023, month: 12, setNumber: 2 },
  { year: 2023, month: 12, setNumber: 3 },
  { year: 2023, month: 6, setNumber: 1 },
  { year: 2023, month: 6, setNumber: 2 },
  { year: 2023, month: 6, setNumber: 3 },
  { year: 2023, month: 3, setNumber: 1 },
  { year: 2023, month: 3, setNumber: 2 },
  { year: 2023, month: 3, setNumber: 3 },
  // 2022
  { year: 2022, month: 12, setNumber: 1 },
  { year: 2022, month: 12, setNumber: 2 },
  { year: 2022, month: 12, setNumber: 3 },
  { year: 2022, month: 9, setNumber: 1 },
  { year: 2022, month: 9, setNumber: 2 },
  { year: 2022, month: 9, setNumber: 3 },
  { year: 2022, month: 6, setNumber: 1 },
  { year: 2022, month: 6, setNumber: 2 },
  { year: 2022, month: 6, setNumber: 3 },
  // 2021
  { year: 2021, month: 12, setNumber: 1 },
  { year: 2021, month: 12, setNumber: 2 },
  { year: 2021, month: 12, setNumber: 3 },
  { year: 2021, month: 6, setNumber: 1 },
  { year: 2021, month: 6, setNumber: 2 },
  { year: 2021, month: 6, setNumber: 3 },
  // 2020
  { year: 2020, month: 12, setNumber: 1 },
  { year: 2020, month: 12, setNumber: 2 },
  { year: 2020, month: 12, setNumber: 3 },
  { year: 2020, month: 9, setNumber: 1 },
  { year: 2020, month: 9, setNumber: 2 },
  { year: 2020, month: 9, setNumber: 3 },
  { year: 2020, month: 7, setNumber: 1 },
  // 2019
  { year: 2019, month: 12, setNumber: 1 },
  { year: 2019, month: 12, setNumber: 2 },
  { year: 2019, month: 12, setNumber: 3 },
  { year: 2019, month: 6, setNumber: 1 },
  { year: 2019, month: 6, setNumber: 2 },
  { year: 2019, month: 6, setNumber: 3 },
  // 2018
  { year: 2018, month: 12, setNumber: 1 },
  { year: 2018, month: 12, setNumber: 2 },
  { year: 2018, month: 12, setNumber: 3 },
  { year: 2018, month: 6, setNumber: 1 },
  { year: 2018, month: 6, setNumber: 2 },
  { year: 2018, month: 6, setNumber: 3 },
  // 2017
  { year: 2017, month: 12, setNumber: 1 },
  { year: 2017, month: 12, setNumber: 2 },
  { year: 2017, month: 12, setNumber: 3 },
  { year: 2017, month: 6, setNumber: 1 },
  { year: 2017, month: 6, setNumber: 2 },
  { year: 2017, month: 6, setNumber: 3 },
  // 2016
  { year: 2016, month: 12, setNumber: 1 },
  { year: 2016, month: 12, setNumber: 2 },
  { year: 2016, month: 12, setNumber: 3 },
  { year: 2016, month: 6, setNumber: 1 },
  { year: 2016, month: 6, setNumber: 2 },
  { year: 2016, month: 6, setNumber: 3 },
  // 2015
  { year: 2015, month: 12, setNumber: 1 },
  { year: 2015, month: 12, setNumber: 2 },
  { year: 2015, month: 12, setNumber: 3 },
  { year: 2015, month: 6, setNumber: 1 },
  { year: 2015, month: 6, setNumber: 2 },
  { year: 2015, month: 6, setNumber: 3 },
];

function createCET6Sections(paperId: string): ExamSection[] {
  // 1. Writing
  const writingSection: ExamSection = {
    id: `sec-writing-${paperId}`,
    type: 'writing',
    title: 'Part I: Writing',
    subTitle: '短文写作 (30分钟，满分15.0分)',
    timeGuideMinutes: 30,
    instructions: 'Directions: For this part, you are allowed 30 minutes to write an essay.',
    questions: [
      {
        id: `${paperId}-writing-1`,
        number: 0,
        type: 'writing',
        sectionTitle: 'Part I: Writing',
        points: 15.0,
        correctAnswer: '',
        analysis: '',
      }
    ]
  };

  // 2. Listening (1 - 25)
  const listeningQuestions: QuestionItem[] = Array.from({ length: 25 }, (_, i) => ({
    id: `${paperId}-l-${i + 1}`,
    number: i + 1,
    type: 'listening',
    sectionTitle: 'Part II: Listening Comprehension',
    points: i < 15 ? 1.0 : 2.0,
    options: [
      { label: 'A', text: 'Option A' },
      { label: 'B', text: 'Option B' },
      { label: 'C', text: 'Option C' },
      { label: 'D', text: 'Option D' },
    ],
    correctAnswer: '',
    analysis: '',
  }));

  const listeningSection: ExamSection = {
    id: `sec-listening-${paperId}`,
    type: 'listening',
    title: 'Part II: Listening Comprehension',
    subTitle: '听力理解 (30分钟，共25题，满分35.0分)',
    timeGuideMinutes: 30,
    instructions: 'Directions: In this section, you will hear several conversations and passages.',
    questions: listeningQuestions,
  };

  // 3. Reading Cloze (26 - 35)
  const clozeQuestions: QuestionItem[] = Array.from({ length: 10 }, (_, i) => ({
    id: `${paperId}-r-cloze-${i + 26}`,
    number: i + 26,
    type: 'reading_cloze',
    sectionTitle: 'Section A: 选词填空',
    points: 0.5,
    correctAnswer: '',
    analysis: '',
  }));

  const clozeSection: ExamSection = {
    id: `sec-reading-a-${paperId}`,
    type: 'reading_cloze',
    title: 'Part III: Reading - Section A',
    subTitle: '选词填空 (共10题，满分5.0分)',
    timeGuideMinutes: 10,
    instructions: 'Directions: In this section, there is a passage with ten blanks. Choose one word for each blank from a list of choices given in a word bank.',
    questions: clozeQuestions,
  };

  // 4. Reading Match (36 - 45)
  const matchQuestions: QuestionItem[] = Array.from({ length: 10 }, (_, i) => ({
    id: `${paperId}-r-match-${i + 36}`,
    number: i + 36,
    type: 'reading_match',
    sectionTitle: 'Section B: 长篇匹配',
    points: 1.0,
    correctAnswer: '',
    analysis: '',
  }));

  const matchSection: ExamSection = {
    id: `sec-reading-b-${paperId}`,
    type: 'reading_match',
    title: 'Part III: Reading - Section B',
    subTitle: '长篇匹配 (共10题，满分10.0分)',
    timeGuideMinutes: 15,
    instructions: 'Directions: In this section, you are going to read a passage with ten statements.',
    questions: matchQuestions,
  };

  // 5. Reading Careful (46 - 55)
  const carefulQuestions: QuestionItem[] = Array.from({ length: 10 }, (_, i) => ({
    id: `${paperId}-r-careful-${i + 46}`,
    number: i + 46,
    type: 'reading_careful',
    sectionTitle: 'Section C: 仔细阅读',
    points: 2.0,
    options: [
      { label: 'A', text: 'Option A' },
      { label: 'B', text: 'Option B' },
      { label: 'C', text: 'Option C' },
      { label: 'D', text: 'Option D' },
    ],
    correctAnswer: '',
    analysis: '',
  }));

  const carefulSection: ExamSection = {
    id: `sec-reading-c-${paperId}`,
    type: 'reading_careful',
    title: 'Part III: Reading - Section C',
    subTitle: '仔细阅读 (共10题，满分20.0分)',
    timeGuideMinutes: 20,
    instructions: 'Directions: There are 2 passages in this section. Each passage is followed by some questions.',
    questions: carefulQuestions,
  };

  // 6. Translation
  const translationSection: ExamSection = {
    id: `sec-translation-${paperId}`,
    type: 'translation',
    title: 'Part IV: Translation',
    subTitle: '汉译英 (30分钟，满分15.0分)',
    timeGuideMinutes: 30,
    instructions: 'Directions: For this part, you are allowed 30 minutes to translate a passage from Chinese into English.',
    questions: [
      {
        id: `${paperId}-translation-1`,
        number: 0,
        type: 'translation',
        sectionTitle: 'Part IV: Translation',
        points: 15.0,
        correctAnswer: '',
        analysis: '',
      }
    ]
  };

  return [writingSection, listeningSection, clozeSection, matchSection, carefulSection, translationSection];
}

export const DEFAULT_PAPERS: ExamPaper[] = PAPER_CONFIGS.map((meta) => {
  const monthStr = meta.month.toString().padStart(2, '0');
  const paperId = `cet6_${meta.year}_${monthStr}_set${meta.setNumber}`;
  const title = `${meta.year}年${meta.month}月 大学英语六级考试真题 (第${meta.setNumber}套)`;
  const badge = `${meta.year}年全真试卷`;

  return {
    id: paperId,
    title,
    year: meta.year,
    month: meta.month,
    setNumber: meta.setNumber,
    badge,
    totalTimeMinutes: 130,
    totalScore: 710,
    audioTitle: `${meta.year}年${meta.month}月 大学英语六级考试 (第${meta.setNumber}套) 原版听力录音`,
    audioUrl: getAssetUrl(`/audio/${paperId}.mp3`),
    answerPdfUrl: getAssetUrl(`/answers/${paperId}_ans.pdf`),
    sections: createCET6Sections(paperId),
  };
});

