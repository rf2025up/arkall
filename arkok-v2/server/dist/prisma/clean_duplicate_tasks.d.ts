/**
 * 🧹 数据清洗脚本：清理重复的任务记录
 *
 * 逻辑：
 * 1. 按学生+任务标题+类型+日期分组
 * 2. 保留最新的记录，删除旧的重复记录
 * 3. 输出清洗统计报告
 */
declare function cleanDuplicateTasks(): Promise<void>;
/**
 * 🔍 数据库健康检查
 */
declare function databaseHealthCheck(): Promise<void>;
export { cleanDuplicateTasks, databaseHealthCheck };
//# sourceMappingURL=clean_duplicate_tasks.d.ts.map