import { Server as SocketIOServer } from 'socket.io';
export declare function setupSocketHandlers(io: SocketIOServer): void;
export declare function broadcastToSchool(io: SocketIOServer, schoolId: string, event: string, data: any): void;
export declare function broadcastToClass(io: SocketIOServer, className: string, event: string, data: any): void;
export declare function broadcastToStudent(io: SocketIOServer, studentId: string, event: string, data: any): void;
export declare const SOCKET_EVENTS: {
    readonly SCORE_UPDATE: "score_update";
    readonly BATCH_SCORE_UPDATE: "batch_score_update";
    readonly PLAN_PUBLISHED: "plan_published";
    readonly PLAN_UPDATED: "plan_updated";
    readonly PK_STARTED: "pk_started";
    readonly PK_FINISHED: "pk_finished";
    readonly PK_UPDATED: "pk_updated";
    readonly STUDENT_JOINED: "student_joined";
    readonly STUDENT_LEFT: "student_left";
    readonly STUDENT_UPDATED: "student_updated";
    readonly SYSTEM_NOTIFICATION: "system_notification";
    readonly HEALTH_CHECK: "health_check";
};
//# sourceMappingURL=socketHandlers.d.ts.map