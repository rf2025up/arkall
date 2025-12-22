import { Server as SocketIOServer, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { AuthService, AuthUser } from './auth.service';

const JWT_SECRET = process.env.JWT_SECRET || 'arkok-v2-super-secret-jwt-key-2024';

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
export class SocketService {
  constructor(
    private io: SocketIOServer,
    private authService: AuthService
  ) { }

  /**
   * 初始化 Socket.io 认证中间件
   */
  public initializeAuthentication(): void {
    this.io.use(this.authenticateSocket.bind(this));
  }

  /**
   * Socket 认证中间件
   */
  private async authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void): Promise<void> {
    try {
      const token = (socket as any).handshake.auth.token || (socket as any).handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        console.log(`🔌 Socket ${(socket as any).id} 连接失败: 缺少认证令牌`);
        return next(new Error('认证令牌缺失'));
      }

      // 验证 JWT 令牌
      const user = this.authService.verifyToken(token);

      if (!user) {
        console.log(`🔌 Socket ${(socket as any).id} 连接失败: 无效的认证令牌`);
        return next(new Error('无效的认证令牌'));
      }

      // 将用户信息附加到 socket
      socket.user = user;
      socket.schoolId = user.schoolId;
      socket.isAuthenticated = true;

      console.log(`🔌 Socket ${(socket as any).id} 认证成功: ${user.username}(${user.role}) - School: ${user.schoolId}`);

      next();
    } catch (error) {
      console.error(`❌ Socket ${(socket as any).id} 认证错误:`, error);
      next(new Error('认证过程中发生错误'));
    }
  }

  /**
   * 初始化连接处理器
   */
  public initializeConnectionHandlers(): void {
    this.io.on('connection', this.handleConnection.bind(this));
  }

  /**
   * 处理新的 Socket 连接
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    if (!socket.isAuthenticated || !socket.user || !socket.schoolId) {
      console.log(`🔌 未认证的连接被拒绝: ${(socket as any).id}`);
      (socket as any).disconnect();
      return;
    }

    console.log(`🔌 用户 ${socket.user.username} 已连接: ${(socket as any).id}`);
    console.log(`📊 当前活跃连接数: ${this.io.engine.clientsCount}`);

    // 自动加入学校房间
    this.joinSchoolRoom(socket, socket.schoolId);

    // 设置事件监听器
    this.setupSocketEventHandlers(socket);

    // 发送连接成功消息
    (socket as any).emit('CONNECTION_SUCCESS', {
      message: '连接成功',
      user: {
        userId: socket.user.userId,
        username: socket.user.username,
        role: socket.user.role,
        schoolId: socket.user.schoolId,
        schoolName: socket.user.schoolName
      },
      socketId: (socket as any).id,
      timestamp: new Date().toISOString()
    });

    // 广播用户上线（可选，取决于隐私需求）
    this.broadcastToSchool(socket.schoolId, 'USER_ONLINE', {
      userId: socket.user.userId,
      username: socket.user.username,
      role: socket.user.role,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 设置 Socket 事件处理器
   */
  private setupSocketEventHandlers(socket: AuthenticatedSocket): void {
    // 加入学校房间
    (socket as any).on('JOIN_SCHOOL', (data: any) => {
      if (socket.schoolId && data.schoolId === socket.schoolId) {
        this.joinSchoolRoom(socket, data.schoolId);
      } else {
        (socket as any).emit('ERROR', { message: '无权加入指定学校房间' });
      }
    });

    // 离开学校房间
    (socket as any).on('LEAVE_SCHOOL', (data: any) => {
      if (socket.schoolId && data.schoolId === socket.schoolId) {
        this.leaveSchoolRoom(socket, data.schoolId);
      }
    });

    // 获取房间信息
    (socket as any).on('GET_ROOM_INFO', () => {
      if (socket.schoolId) {
        const roomInfo = this.getSchoolRoomInfo(socket.schoolId);
        (socket as any).emit('ROOM_INFO', roomInfo);
      }
    });

    // 心跳检测
    (socket as any).on('PING', () => {
      (socket as any).emit('PONG', {
        timestamp: new Date().toISOString(),
        socketId: (socket as any).id
      });
    });

    // 处理断开连接
    (socket as any).on('disconnect', (reason: string) => {
      this.handleDisconnection(socket, reason);
    });

    // 处理错误
    (socket as any).on('error', (error: any) => {
      console.error(`❌ Socket ${(socket as any).id} 错误:`, error);
    });
  }

  /**
   * 加入学校房间
   */
  private joinSchoolRoom(socket: AuthenticatedSocket, schoolId: string): void {
    const roomName = `school_${schoolId}`;
    (socket as any).join(roomName);

    console.log(`🏠 用户 ${socket.user?.username} 加入学校房间: ${roomName}`);

    (socket as any).emit('JOINED_SCHOOL', {
      schoolId,
      roomName,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 离开学校房间
   */
  private leaveSchoolRoom(socket: AuthenticatedSocket, schoolId: string): void {
    const roomName = `school_${schoolId}`;
    (socket as any).leave(roomName);

    console.log(`🚪 用户 ${socket.user?.username} 离开学校房间: ${roomName}`);

    (socket as any).emit('LEFT_SCHOOL', {
      schoolId,
      roomName,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 处理断开连接
   */
  private handleDisconnection(socket: AuthenticatedSocket, reason: string): void {
    console.log(`🔌 用户 ${socket.user?.username} 断开连接: ${(socket as any).id} - 原因: ${reason}`);
    console.log(`📊 剩余活跃连接数: ${this.io.engine.clientsCount}`);

    // 广播用户下线（可选）
    if (socket.user && socket.schoolId) {
      this.broadcastToSchool(socket.schoolId, 'USER_OFFLINE', {
        userId: socket.user.userId,
        username: socket.user.username,
        role: socket.user.role,
        reason,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 向指定学校广播消息
   */
  public broadcastToSchool(schoolId: string, event: string, data: any): void {
    const roomName = `school_${schoolId}`;
    this.io.to(roomName).emit(event, data);
    console.log(`📡 向学校 ${schoolId} 广播事件: ${event}`);
  }

  public sendToUser(userId: string, event: string, data: any): void {
    // 查找属于该用户的所有 socket 连接
    const sockets = Array.from(this.io.sockets.sockets.values())
      .filter((socket: AuthenticatedSocket) => socket.user?.userId === userId);

    sockets.forEach(socket => {
      (socket as any).emit(event, data);
    });

    console.log(`📤 向用户 ${userId} 发送事件: ${event} (${sockets.length} 个连接)`);
  }

  public broadcastToRole(schoolId: string, role: string, event: string, data: any): void {
    const roomName = `school_${schoolId}`;
    const sockets = Array.from(this.io.sockets.adapter.rooms.get(roomName) || [])
      .map(socketId => this.io.sockets.sockets.get(socketId))
      .filter((socket: AuthenticatedSocket | undefined) =>
        socket?.user?.role === role && socket?.schoolId === schoolId
      ) as AuthenticatedSocket[];

    sockets.forEach(socket => {
      (socket as any).emit(event, data);
    });

    console.log(`📡 向学校 ${schoolId} 的 ${role} 角色广播事件: ${event} (${sockets.length} 个用户)`);
  }

  /**
   * 获取学校房间信息
   */
  public getSchoolRoomInfo(schoolId: string): any {
    const roomName = `school_${schoolId}`;
    const room = this.io.sockets.adapter.rooms.get(roomName);

    if (!room) {
      return {
        schoolId,
        roomName,
        connectedUsers: 0,
        users: []
      };
    }

    const sockets = Array.from(room)
      .map(socketId => this.io.sockets.sockets.get(socketId))
      .filter((socket: AuthenticatedSocket | undefined): socket is AuthenticatedSocket =>
        socket !== undefined && socket.isAuthenticated && socket.schoolId === schoolId
      );

    const users = sockets.map(socket => ({
      socketId: (socket as any).id,
      userId: socket.user?.userId,
      username: socket.user?.username,
      role: socket.user?.role,
      connectedAt: (socket as any).handshake.time
    }));

    return {
      schoolId,
      roomName,
      connectedUsers: users.length,
      users
    };
  }

  /**
   * 获取所有活跃的连接统计
   */
  public getConnectionStats(): any {
    const totalConnections = this.io.engine.clientsCount;
    const authenticatedSockets = Array.from(this.io.sockets.sockets.values())
      .filter((socket: AuthenticatedSocket) => socket.isAuthenticated);

    const schools = new Set<string>();
    authenticatedSockets.forEach((socket: AuthenticatedSocket) => {
      if (socket.schoolId) {
        schools.add(socket.schoolId);
      }
    });

    return {
      totalConnections,
      authenticatedConnections: authenticatedSockets.length,
      activeSchools: schools.size,
      schoolIds: Array.from(schools)
    };
  }

  /**
   * 强制断开指定学校的所有连接
   */
  public disconnectSchool(schoolId: string, reason: string = '管理员操作'): number {
    const roomName = `school_${schoolId}`;
    const sockets = Array.from(this.io.sockets.adapter.rooms.get(roomName) || [])
      .map(socketId => this.io.sockets.sockets.get(socketId))
      .filter((socket: AuthenticatedSocket | undefined) =>
        socket?.schoolId === schoolId
      ) as AuthenticatedSocket[];

    sockets.forEach((socket: any) => {
      socket.emit('FORCE_DISCONNECT', {
        reason,
        timestamp: new Date().toISOString()
      });
      socket.disconnect(true);
    });

    console.log(`🚫 强制断开学校 ${schoolId} 的 ${sockets.length} 个连接`);
    return sockets.length;
  }

  /**
   * 向所有认证用户广播系统消息
   */
  public broadcastSystemMessage(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    this.io.emit('SYSTEM_MESSAGE', {
      message,
      type,
      timestamp: new Date().toISOString()
    });

    console.log(`📢 系统消息广播: [${type.toUpperCase()}] ${message}`);
  }
}

export default SocketService;