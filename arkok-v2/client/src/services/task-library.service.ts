// 任务库服务
import apiService from './api.service';

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

export class TaskLibraryService {
  private static instance: TaskLibraryService;

  static getInstance(): TaskLibraryService {
    if (!TaskLibraryService.instance) {
      TaskLibraryService.instance = new TaskLibraryService();
    }
    return TaskLibraryService.instance;
  }

  async fetchTaskLibrary(token?: string): Promise<TaskLibrary> {
    if (!token) {
      throw new Error('未找到认证token');
    }

    try {
      const response = await apiService.get('/lms/task-library');

      if (response.success && response.data) {
        const tasks = response.data as TaskLibraryItem[];
        return this.convertApiToTaskLibrary(tasks);
      } else {
        throw new Error(response.message || '获取任务库失败');
      }
    } catch (error) {
      console.error('获取任务库失败:', error);
      throw error;
    }
  }

  private convertApiToTaskLibrary(apiData: TaskLibraryItem[]): TaskLibrary {
    return apiData.reduce((acc, task) => {
      if (!acc[task.category]) {
        acc[task.category] = [];
      }
      acc[task.category].push({
        name: task.name,
        exp: task.defaultExp
      });
      return acc;
    }, {} as TaskLibrary);
  }
}

export default TaskLibraryService.getInstance();