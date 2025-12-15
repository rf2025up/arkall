/**
 * TypeScript 错误根本原因分析工具
 *
 * 根据 "Root Cause First" 原则，分析 TypeScript 错误的根本原因
 * 帮助开发者区分逻辑错误和类型定义缺失
 */
export interface TSErrorAnalysis {
    errorType: 'logic_error' | 'type_definition_missing' | 'module_augmentation_needed' | 'import_issue' | 'other';
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    suggestedAction: string;
    correctApproach: string;
    incorrectApproach: string;
}
export interface TSErrorPattern {
    regex: RegExp;
    analyzer: (error: string) => TSErrorAnalysis;
}
/**
 * 分析 TypeScript 错误的根本原因
 * @param errorMessage - TypeScript 错误消息
 * @returns 错误分析结果
 */
export declare function analyzeTSError(errorMessage: string): TSErrorAnalysis;
/**
 * 批量分析 TypeScript 编译错误
 * @param compileOutput - TypeScript 编译输出
 * @returns 分析结果列表
 */
export declare function analyzeCompileErrors(compileOutput: string): TSErrorAnalysis[];
/**
 * 生成修复建议报告
 * @param analyses - 错误分析结果列表
 * @returns 格式化的修复建议报告
 */
export declare function generateFixReport(analyses: TSErrorAnalysis[]): string;
/**
 * 检查修复方案是否符合 "Root Cause First" 原则
 * @param originalError - 原始错误
 * @param fixApproach - 修复方案描述
 * @returns 是否符合根本原因修复原则
 */
export declare function validateFixApproach(originalError: string, fixApproach: string): boolean;
//# sourceMappingURL=ts-root-cause-analyzer.d.ts.map