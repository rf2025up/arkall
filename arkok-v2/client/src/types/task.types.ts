export interface TaskLibraryItem {
  id: string;
  category: string;
  name: string;
  description?: string;
  defaultExp: number;
  type: string;
  difficulty?: number;
  isActive: boolean;
}

export interface TaskLibrary {
  [category: string]: { name: string; exp: number }[];
}

export interface Task {
  id: number;
  name: string;
  type: 'QC' | 'TASK' | 'SPECIAL';
  status: 'PENDING' | 'PASSED' | 'COMPLETED';
  exp: number;
  attempts: number;
  isSpecial?: boolean;
  isAuto?: boolean;
  taskId?: string;
}