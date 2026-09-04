import Dexie, { Table } from 'dexie';
import { PageAnnotation, UserExamRecord, TaskPlan, StudyMaterial, ErrorLogItem, WordBookItem } from '../types';

export class CET6Database extends Dexie {
  annotations!: Table<PageAnnotation, string>;
  examRecords!: Table<UserExamRecord, string>;
  taskPlans!: Table<TaskPlan, string>;
  materials!: Table<StudyMaterial, string>;
  errorLogs!: Table<ErrorLogItem, string>;
  wordBook!: Table<WordBookItem, string>;

  constructor() {
    super('CET6StudyPlatformDB');
    this.version(1).stores({
      annotations: 'id, paperId, [paperId+pageIndex]',
      examRecords: 'id, paperId, startedAt',
      taskPlans: 'id, date, isCompleted, isBuffer',
      materials: 'id, type, mastered, *categoryTags',
      errorLogs: 'id, paperId, sectionType, cleared, addedAt',
    });
    this.version(2).stores({
      wordBook: 'id, word, mastered, addedAt',
    });
  }
}

export const db = new CET6Database();
