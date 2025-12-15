"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
const JWT_SECRET = process.env.JWT_SECRET || 'arkok-v2-super-secret-jwt-key-2024';
/**
 * Socket.io 认证和房间管理服务
 */
class SocketService {
    constructor(io, authService) {
        this.io = io;
        this.authService = authService;
    }
    /**
     * 初始化 Socket.io 认证中间件
     */
    initializeAuthentication() {
        this.io.use(this.authenticateSocket.bind(this));
    }
    /**
     * Socket 认证中间件
     */
    async authenticateSocket(socket, next) {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                console.log(`🔌 Socket ${socket.id} 连接失败: 缺少认证令牌`);
                return next(new Error('认证令牌缺失'));
            }
            // 验证 JWT 令牌
            const user = this.authService.verifyToken(token);
            if (!user) {
                console.log(`🔌 Socket ${socket.id} 连接失败: 无效的认证令牌`);
                return next(new Error('无效的认证令牌'));
            }
            // 将用户信息附加到 socket
            socket.user = user;
            socket.schoolId = user.schoolId;
            socket.isAuthenticated = true;
            console.log(`🔌 Socket ${socket.id} 认证成功: ${user.username}(${user.role}) - School: ${user.schoolId}`);
            next();
        }
        catch (error) {
            console.error(`❌ Socket ${socket.id} 认证错误:`, error);
            next(new Error('认证过程中发生错误'));
        }
    }
    /**
     * 初始化连接处理器
     */
    initializeConnectionHandlers() {
        this.io.on('connection', this.handleConnection.bind(this));
    }
    /**
     * 处理新的 Socket 连接
     */
    handleConnection(socket) {
        if (!socket.isAuthenticated || !socket.user || !socket.schoolId) {
            console.log(`🔌 未认证的连接被拒绝: ${socket.id}`);
            socket.disconnect();
            return;
        }
        console.log(`🔌 用户 ${socket.user.username} 已连接: ${socket.id}`);
        console.log(`📊 当前活跃连接数: ${this.io.engine.clientsCount}`);
        // 自动加入学校房间
        this.joinSchoolRoom(socket, socket.schoolId);
        // 设置事件监听器
        this.setupSocketEventHandlers(socket);
        // 发送连接成功消息
        socket.emit('CONNECTION_SUCCESS', {
            message: '连接成功',
            user: {
                userId: socket.user.userId,
                username: socket.user.username,
                role: socket.user.role,
                schoolId: socket.user.schoolId,
                schoolName: socket.user.schoolName
            },
            socketId: socket.id,
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
    setupSocketEventHandlers(socket) {
        // 加入学校房间
        socket.on('JOIN_SCHOOL', (data) => {
            if (socket.schoolId && data.schoolId === socket.schoolId) {
                this.joinSchoolRoom(socket, data.schoolId);
            }
            else {
                socket.emit('ERROR', { message: '无权加入指定学校房间' });
            }
        });
        // 离开学校房间
        socket.on('LEAVE_SCHOOL', (data) => {
            if (socket.schoolId && data.schoolId === socket.schoolId) {
                this.leaveSchoolRoom(socket, data.schoolId);
            }
        });
        // 获取房间信息
        socket.on('GET_ROOM_INFO', () => {
            if (socket.schoolId) {
                const roomInfo = this.getSchoolRoomInfo(socket.schoolId);
                socket.emit('ROOM_INFO', roomInfo);
            }
        });
        // 心跳检测
        socket.on('PING', () => {
            socket.emit('PONG', {
                timestamp: new Date().toISOString(),
                socketId: socket.id
            });
        });
        // 处理断开连接
        socket.on('disconnect', (reason) => {
            this.handleDisconnection(socket, reason);
        });
        // 处理错误
        socket.on('error', (error) => {
            console.error(`❌ Socket ${socket.id} 错误:`, error);
        });
    }
    /**
     * 加入学校房间
     */
    joinSchoolRoom(socket, schoolId) {
        const roomName = `school_${schoolId}`;
        socket.join(roomName);
        console.log(`🏠 用户 ${socket.user?.username} 加入学校房间: ${roomName}`);
        socket.emit('JOINED_SCHOOL', {
            schoolId,
            roomName,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * 离开学校房间
     */
    leaveSchoolRoom(socket, schoolId) {
        const roomName = `school_${schoolId}`;
        socket.leave(roomName);
        console.log(`🚪 用户 ${socket.user?.username} 离开学校房间: ${roomName}`);
        socket.emit('LEFT_SCHOOL', {
            schoolId,
            roomName,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * 处理断开连接
     */
    handleDisconnection(socket, reason) {
        console.log(`🔌 用户 ${socket.user?.username} 断开连接: ${socket.id} - 原因: ${reason}`);
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
    broadcastToSchool(schoolId, event, data) {
        const roomName = `school_${schoolId}`;
        this.io.to(roomName).emit(event, data);
        console.log(`📡 向学校 ${schoolId} 广播事件: ${event}`);
    }
    /**
     * 向指定用户发送消息
     */
    sendToUser(userId, event, data) {
        // 查找属于该用户的所有 socket 连接
        const sockets = Array.from(this.io.sockets.sockets.values())
            .filter((socket) => socket.user?.userId === userId);
        sockets.forEach(socket => {
            socket.emit(event, data);
        });
        console.log(`📤 向用户 ${userId} 发送事件: ${event} (${sockets.length} 个连接)`);
    }
    /**
     * 向指定角色用户广播消息
     */
    broadcastToRole(schoolId, role, event, data) {
        const roomName = `school_${schoolId}`;
        const sockets = Array.from(this.io.sockets.adapter.rooms.get(roomName) || [])
            .map(socketId => this.io.sockets.sockets.get(socketId))
            .filter((socket) => socket?.user?.role === role && socket?.schoolId === schoolId);
        sockets.forEach(socket => {
            socket.emit(event, data);
        });
        console.log(`📡 向学校 ${schoolId} 的 ${role} 角色广播事件: ${event} (${sockets.length} 个用户)`);
    }
    /**
     * 获取学校房间信息
     */
    getSchoolRoomInfo(schoolId) {
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
            .filter((socket) => socket !== undefined && socket.isAuthenticated && socket.schoolId === schoolId);
        const users = sockets.map(socket => ({
            socketId: socket.id,
            userId: socket.user?.userId,
            username: socket.user?.username,
            role: socket.user?.role,
            connectedAt: socket.handshake.time
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
    getConnectionStats() {
        const totalConnections = this.io.engine.clientsCount;
        const authenticatedSockets = Array.from(this.io.sockets.sockets.values())
            .filter((socket) => socket.isAuthenticated);
        const schools = new Set();
        authenticatedSockets.forEach((socket) => {
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
    disconnectSchool(schoolId, reason = '管理员操作') {
        const roomName = `school_${schoolId}`;
        const sockets = Array.from(this.io.sockets.adapter.rooms.get(roomName) || [])
            .map(socketId => this.io.sockets.sockets.get(socketId))
            .filter((socket) => socket?.schoolId === schoolId);
        sockets.forEach(socket => {
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
    broadcastSystemMessage(message, type = 'info') {
        this.io.emit('SYSTEM_MESSAGE', {
            message,
            type,
            timestamp: new Date().toISOString()
        });
        console.log(`📢 系统消息广播: [${type.toUpperCase()}] ${message}`);
    }
}
exports.SocketService = SocketService;
exports.default = SocketService;
