export interface TaskLibraryItem {
  id: string;

  // 🏷️ 运营标签分类（过关页使用）
  category: string; // 9个标准标签：基础作业、语文、数学、英语、阅读、自主性、特色教学、学校、家庭

  // 📚 教育体系分类（备课页使用）
  educationalDomain: string; // '核心教学法' | '综合成长' | '基础作业'
  educationalSubcategory: string; // 具体维度/类别

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