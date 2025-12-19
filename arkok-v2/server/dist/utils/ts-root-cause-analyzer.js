"use strict";
/**
 * TypeScript 错误根本原因分析工具
 *
 * 根据 "Root Cause First" 原则，分析 TypeScript 错误的根本原因
 * 帮助开发者区分逻辑错误和类型定义缺失
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeTSError = analyzeTSError;
exports.analyzeCompileErrors = analyzeCompileErrors;
exports.generateFixReport = generateFixReport;
exports.validateFixApproach = validateFixApproach;
/**
 * TypeScript 错误模式库
 */
const ERROR_PATTERNS = [
    // 类型不匹配错误
    {
        regex: /error TS[0-9]+: .*? is not assignable to type .*?/,
        analyzer: (error) => ({
            errorType: 'type_definition_missing',
            severity: 'high',
            description: '类型不匹配，可能是类型定义缺失或需要模块扩展',
            suggestedAction: '检查是否存在接口定义缺失，或需要扩展现有类型',
            correctApproach: '使用 Module Augmentation 扩展标准接口，或创建明确的类型定义',
            incorrectApproach: '使用类型断言 (as) 或修改业务逻辑来迁就类型错误'
        })
    },
    // Property does not exist 错误
    {
        regex: /error TS[0-9]+: Property '.*?' does not exist on type '.*?'/,
        analyzer: (error) => ({
            errorType: 'type_definition_missing',
            severity: 'high',
            description: '属性不存在，可能是接口定义不完整或需要模块扩展',
            suggestedAction: '检查相关接口定义，使用 Module Augmentation 扩展类型',
            correctApproach: '扩展标准接口或更新类型定义以包含缺失属性',
            incorrectApproach: '使用 (obj as any) 跳过类型检查'
        })
    },
    // AuthRequest 相关错误
    {
        regex: /AuthRequest.*Request.*incompatible/,
        analyzer: (error) => ({
            errorType: 'module_augmentation_needed',
            severity: 'critical',
            description: 'AuthRequest 与标准 Request 类型不兼容',
            suggestedAction: '使用 Module Augmentation 扩展标准 Express Request 接口',
            correctApproach: '在 src/types/express/index.d.ts 中扩展 Express.Request 接口',
            incorrectApproach: '将 AuthRequest 替换为 Request 后强行断言'
        })
    },
    // 隐式 any 错误
    {
        regex: /error TS7006: Parameter '.*?' implicitly has an 'any' type/,
        analyzer: (error) => ({
            errorType: 'type_definition_missing',
            severity: 'medium',
            description: '参数类型隐式为 any，需要明确类型定义',
            suggestedAction: '为参数添加明确的类型定义',
            correctApproach: '定义接口或使用明确的类型注解',
            incorrectApproach: '显式使用 any 类型或关闭严格模式'
        })
    },
    // 未知错误处理
    {
        regex: /error TS18046: '.*?' is of type 'unknown'/,
        analyzer: (error) => ({
            errorType: 'logic_error',
            severity: 'medium',
            description: 'unknown 类型错误，需要类型守卫',
            suggestedAction: '使用 instanceof Error 进行类型守卫',
            correctApproach: '在访问 error 属性前使用 instanceof 检查',
            incorrectApproach: '使用类型断言 (error as Error) 或忽略错误'
        })
    },
    // JWT 相关类型错误
    {
        regex: /error TS2769: No overload matches this call.*jwt\.sign/,
        analyzer: (error) => ({
            errorType: 'logic_error',
            severity: 'critical',
            description: 'JWT 签名参数类型不匹配',
            suggestedAction: '检查 JWT 签名参数的类型和顺序',
            correctApproach: '确保 secret 是字符串，options 是 SignOptions 类型',
            incorrectApproach: '使用类型断言或修改业务逻辑'
        })
    },
    // Prisma 相关类型错误
    {
        regex: /error TS2353: Object literal may only specify known properties/,
        analyzer: (error) => ({
            errorType: 'type_definition_missing',
            severity: 'high',
            description: '对象属性不匹配，可能是 Prisma 模型或接口定义问题',
            suggestedAction: '检查 Prisma 模型定义和接口类型',
            correctApproach: '更新对象属性以匹配类型定义，或扩展类型定义',
            incorrectApproach: '使用 as any 跳过类型检查'
        })
    }
];
/**
 * 分析 TypeScript 错误的根本原因
 * @param errorMessage - TypeScript 错误消息
 * @returns 错误分析结果
 */
function analyzeTSError(errorMessage) {
    for (const pattern of ERROR_PATTERNS) {
        if (pattern.regex.test(errorMessage)) {
            return pattern.analyzer(errorMessage);
        }
    }
    // 默认分析结果
    return {
        errorType: 'other',
        severity: 'medium',
        description: '未识别的 TypeScript 错误类型',
        suggestedAction: '需要手动分析错误原因',
        correctApproach: '查阅 TypeScript 文档或寻求技术指导',
        incorrectApproach: '盲目使用类型断言或关闭类型检查'
    };
}
/**
 * 批量分析 TypeScript 编译错误
 * @param compileOutput - TypeScript 编译输出
 * @returns 分析结果列表
 */
function analyzeCompileErrors(compileOutput) {
    const errorLines = compileOutput
        .split('\n')
        .filter(line => line.includes('error TS') && line.includes('.ts'));
    const analyses = [];
    for (const line of errorLines) {
        const analysis = analyzeTSError(line);
        analyses.push(analysis);
    }
    return analyses;
}
/**
 * 生成修复建议报告
 * @param analyses - 错误分析结果列表
 * @returns 格式化的修复建议报告
 */
function generateFixReport(analyses) {
    const criticalErrors = analyses.filter(a => a.severity === 'critical');
    const highErrors = analyses.filter(a => a.severity === 'high');
    const mediumErrors = analyses.filter(a => a.severity === 'medium');
    let report = '\n🔍 TypeScript 错误根本原因分析报告\n';
    report += '=====================================\n\n';
    if (criticalErrors.length > 0) {
        report += '🚨 严重错误 (Critical):\n';
        criticalErrors.forEach((analysis, index) => {
            report += `${index + 1}. ${analysis.description}\n`;
            report += `   建议行动: ${analysis.suggestedAction}\n`;
            report += `   ✅ 正确做法: ${analysis.correctApproach}\n`;
            report += `   ❌ 错误做法: ${analysis.incorrectApproach}\n\n`;
        });
    }
    if (highErrors.length > 0) {
        report += '⚠️  高优先级错误 (High):\n';
        highErrors.forEach((analysis, index) => {
            report += `${index + 1}. ${analysis.description}\n`;
            report += `   建议行动: ${analysis.suggestedAction}\n\n`;
        });
    }
    if (mediumErrors.length > 0) {
        report += '📝 中优先级错误 (Medium):\n';
        mediumErrors.forEach((analysis, index) => {
            report += `${index + 1}. ${analysis.description}\n`;
            report += `   建议行动: ${analysis.suggestedAction}\n\n`;
        });
    }
    // 类型统计
    const typeDefinitionErrors = analyses.filter(a => a.errorType === 'type_definition_missing').length;
    const logicErrors = analyses.filter(a => a.errorType === 'logic_error').length;
    const moduleAugmentationErrors = analyses.filter(a => a.errorType === 'module_augmentation_needed').length;
    report += '📊 错误类型统计:\n';
    report += `- 类型定义缺失: ${typeDefinitionErrors}\n`;
    report += `- 逻辑错误: ${logicErrors}\n`;
    report += `- 需要模块扩展: ${moduleAugmentationErrors}\n`;
    report += `- 其他类型: ${analyses.length - typeDefinitionErrors - logicErrors - moduleAugmentationErrors}\n\n`;
    // 根本原因分析
    report += '🎯 根本原因分析:\n';
    if (typeDefinitionErrors > logicErrors) {
        report += '主要问题是类型定义缺失，建议优先完善接口定义。\n';
    }
    else {
        report += '主要问题是逻辑错误，需要审查业务逻辑实现。\n';
    }
    return report;
}
/**
 * 检查修复方案是否符合 "Root Cause First" 原则
 * @param originalError - 原始错误
 * @param fixApproach - 修复方案描述
 * @returns 是否符合根本原因修复原则
 */
function validateFixApproach(originalError, fixApproach) {
    const analysis = analyzeTSError(originalError);
    // 检查是否使用了禁止的修复方法
    const forbiddenPatterns = [
        /as any/,
        /@ts-ignore/,
        /strict:\s*false/,
        /noImplicitAny:\s*false/
    ];
    for (const pattern of forbiddenPatterns) {
        if (pattern.test(fixApproach)) {
            return false;
        }
    }
    // 检查是否采用了推荐的方法
    const recommendedPatterns = [
        /interface\s+\w+/,
        /type\s+\w+\s*=/,
        /declare global/,
        /namespace Express/,
        /instanceof Error/
    ];
    for (const pattern of recommendedPatterns) {
        if (pattern.test(fixApproach)) {
            return true;
        }
    }
    return analysis.errorType !== 'type_definition_missing' ||
        (fixApproach.includes('interface') || fixApproach.includes('type'));
}
//# sourceMappingURL=ts-root-cause-analyzer.js.map