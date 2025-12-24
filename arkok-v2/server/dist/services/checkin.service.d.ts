export interface CheckinResult {
    studentId: string;
    success: boolean;
    message?: string;
}
export declare class CheckinService {
    /**
     * 批量签到
     */
    batchCheckin(params: {
        studentIds: string[];
        schoolId: string;
        checkedBy: string;
    }): Promise<{
        success: CheckinResult[];
        failed: CheckinResult[];
        date: string;
    }>;
    /**
     * 获取学生本月签到天数
     */
    getMonthlyCheckinCount(studentId: string): Promise<number>;
    /**
     * 获取学生今日是否已签到
     */
    isTodayCheckedIn(studentId: string): Promise<boolean>;
}
declare const _default: CheckinService;
export default _default;
//# sourceMappingURL=checkin.service.d.ts.map