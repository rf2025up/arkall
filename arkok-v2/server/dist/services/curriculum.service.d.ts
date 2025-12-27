export interface CurriculumItem {
    version: string;
    subject: string;
    grade: string;
    semester: string;
    unit: string;
    lesson: string;
    title: string;
}
export declare class CurriculumService {
    /**
     * 智能匹配课文数据 (含教学设计)
     */
    static getLessonData(params: {
        subject: string;
        unit: string | number;
        lesson?: string | number;
        version?: string;
        grade?: string;
        semester?: string;
    }): CurriculumItem | null;
    /**
     * 获取完整学期大纲图谱
     */
    static getSyllabus(params: {
        subject: string;
        version?: string;
        grade?: string;
        semester?: string;
    }): CurriculumItem[];
    /**
     * 获取课程数量统计
     */
    static getStats(): {
        subject: string;
        grade: string;
        semester: string;
        count: number;
    }[];
    /**
     * 保持兼容性的老接口
     */
    static getTitle(params: any): string | null;
    /**
     * 将中文年级名映射为数字索引 (例如："一年级" -> "1")
     */
    private static getNormGrade;
}
export default CurriculumService;
//# sourceMappingURL=curriculum.service.d.ts.map