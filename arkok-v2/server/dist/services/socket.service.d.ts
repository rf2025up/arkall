import { Server as SocketIOServer, Socket } from 'socket.io';
import { AuthService, AuthUser } from './auth.service';
export interface AuthenticatedSocket extends Socket<any, any, any, any> {
    user?: AuthUser;
    schoolId?: string;
    isAuthenticated?: boolean;
}
export interface SocketConnectionData {
    token?: string;
    schoolId?: string;
    userId?: string;
}
/**
 * Socket.io 认证和房间管理服务
 */
export declare class SocketService {
    private io;
    private authService;
    constructor(io: SocketIOServer, authService: AuthService);
    /**
     * 初始化 Socket.io 认证中间件
     */
    initializeAuthentication(): void;
    /**
     * Socket 认证中间件
     */
    private authenticateSocket;
    /**
     * 初始化连接处理器
     */
    initializeConnectionHandlers(): void;
    /**
     * 处理新的 Socket 连接
     */
    private handleConnection;
    /**
     * 设置 Socket 事件处理器
     */
    private setupSocketEventHandlers;
    /**
     * 加入学校房间
     */
    private joinSchoolRoom;
    /**
     * 离开学校房间
     */
    private leaveSchoolRoom;
    /**
     * 处理断开连接
     */
    private handleDisconnection;
    /**
     * 向指定学校广播消息
     */
    broadcastToSchool(schoolId: string, event: string, data: any): void;
    sendToUser(userId: string, event: string, data: any): void;
    broadcastToRole(schoolId: string, role: string, event: string, data: any): void;
    /**
     * 获取学校房间信息
     */
    getSchoolRoomInfo(schoolId: string): any;
    /**
     * 获取所有活跃的连接统计
     */
    getConnectionStats(): any;
    /**
     * 强制断开指定学校的所有连接
     */
    disconnectSchool(schoolId: string, reason?: string): number;
    /**
     * 向所有认证用户广播系统消息
     */
    broadcastSystemMessage(message: string, type?: 'info' | 'warning' | 'error'): void;
}
export default SocketService;
//# sourceMappingURL=socket.service.d.ts.map