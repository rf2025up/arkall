import { PrismaClient } from '@prisma/client';
export interface RewardConfig {
    id: string;
    schoolId: string;
    module: string;
    category?: string;
    action: string;
    expReward: number;
    pointsReward: number;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateRewardConfigRequest {
    schoolId: string;
    module: string;
    category?: string;
    action: string;
    expReward: number;
    pointsReward: number;
    description?: string;
    isActive?: boolean;
}
export interface UpdateRewardConfigRequest {
    id: string;
    schoolId: string;
    expReward?: number;
    pointsReward?: number;
    description?: string;
    isActive?: boolean;
}
export declare class RewardService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * 获取学校的所有奖励配置
     */
    getRewardConfigs(schoolId: string): Promise<RewardConfig[]>;
    /**
     * 获取默认奖励配置（初始化使用）
     */
    getDefaultConfigs(): Omit<CreateRewardConfigRequest, 'schoolId'>[];
    /**
     * 初始化学校的默认奖励配置
     */
    initializeDefaultConfigs(schoolId: string): Promise<RewardConfig[]>;
    /**
     * 创建或更新奖励配置
     */
    upsertRewardConfig(data: CreateRewardConfigRequest): Promise<RewardConfig>;
    /**
     * 更新奖励配置
     */
    updateRewardConfig(data: UpdateRewardConfigRequest): Promise<RewardConfig>;
    /**
     * 批量更新奖励配置
     */
    batchUpdateRewardConfigs(schoolId: string, updates: Array<{
        id: string;
        expReward?: number;
        pointsReward?: number;
        isActive?: boolean;
    }>): Promise<RewardConfig[]>;
    /**
     * 删除奖励配置
     */
    deleteRewardConfig(id: string, schoolId: string): Promise<void>;
    /**
     * 根据模块和动作获取奖励配置
     */
    getRewardConfig(schoolId: string, module: string, action: string): Promise<RewardConfig | null>;
    /**
     * 根据任务信息获取经验值
     * @param schoolId 学校ID
     * @param category 任务分类（核心教学法、综合成长）
     * @param subcategory 子分类（如"基础学习方法论"）
     * @param title 任务标题
     * @returns 经验值，如果未找到配置则返回null
     */
    getExpForTask(schoolId: string, category: string, subcategory: string, title: string): Promise<number | null>;
}
export default RewardService;
//# sourceMappingURL=reward.service.d.ts.map