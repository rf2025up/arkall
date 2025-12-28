import { Server as SocketIOServer } from 'socket.io';

export function setupSocketHandlers(io: SocketIOServer): void {
  console.log('🔧 Setting up Socket.IO handlers...');

  // 连接处理器已在App类中处理，这里处理自定义事件

  io.on('connection', (socket) => {
    // 加入学校房间（用于多租户隔离）
    socket.on('join-school', (schoolId: string) => {
      socket.join(`school-${schoolId}`);
      console.log(`🏫 Socket ${socket.id} joined school-${schoolId}`);
    });

    // 离开学校房间
    socket.on('leave-school', (schoolId: string) => {
      socket.leave(`school-${schoolId}`);
      console.log(`🏫 Socket ${socket.id} left school-${schoolId}`);
    });

    // 加入班级房间
    socket.on('join-class', (className: string) => {
      socket.join(`class-${className}`);
      console.log(`📚 Socket ${socket.id} joined class-${className}`);
    });

    // 🆕 加入学生个人房间 (用于家长端实时同步)
    socket.on('join-student', (studentId: string) => {
      socket.join(`student-${studentId}`);
      console.log(`👶 Socket ${socket.id} joined student-${studentId}`);
    });

    // 🆕 离开学生个人房间
    socket.on('leave-student', (studentId: string) => {
      socket.leave(`student-${studentId}`);
      console.log(`👶 Socket ${socket.id} left student-${studentId}`);
    });

    // 测试连接
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // 心跳检测
    socket.on('heartbeat', () => {
      socket.emit('heartbeat-response', {
        status: 'alive',
        timestamp: new Date().toISOString()
      });
    });
  });
}

// 广播助手函数
export function broadcastToSchool(io: SocketIOServer, schoolId: string, event: string, data: any): void {
  io.to(`school-${schoolId}`).emit(event, data);
  console.log(`📡 Broadcasted to school-${schoolId}: ${event}`);
}

export function broadcastToClass(io: SocketIOServer, className: string, event: string, data: any): void {
  io.to(`class-${className}`).emit(event, data);
  console.log(`📡 Broadcasted to class-${className}: ${event}`);
}

export function broadcastToStudent(io: SocketIOServer, studentId: string, event: string, data: any): void {
  io.to(`student-${studentId}`).emit(event, data);
  console.log(`📡 Broadcasted to student-${studentId}: ${event}`);
}

// 常用事件定义
export const SOCKET_EVENTS = {
  // 分数相关
  SCORE_UPDATE: 'score_update',
  BATCH_SCORE_UPDATE: 'batch_score_update',

  // 计划相关
  PLAN_PUBLISHED: 'plan_published',
  PLAN_UPDATED: 'plan_updated',

  // PK相关
  PK_STARTED: 'pk_started',
  PK_FINISHED: 'pk_finished',
  PK_UPDATED: 'pk_updated',

  // 学生相关
  STUDENT_JOINED: 'student_joined',
  STUDENT_LEFT: 'student_left',
  STUDENT_UPDATED: 'student_updated',

  // 🆕 通用数据更新 (家长端实时同步)
  DATA_UPDATE: 'DATA_UPDATE',

  // 系统相关
  SYSTEM_NOTIFICATION: 'system_notification',
  HEALTH_CHECK: 'health_check'
} as const;