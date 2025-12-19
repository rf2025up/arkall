import { io, Socket } from 'socket.io-client';

export interface SocketEvents {
  // 连接事件
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;

  // 分数更新事件
  score_update: (data: {
    studentId: string;
    studentName: string;
    className: string;
    schoolId: string;
    previousPoints: number;
    newPoints: number;
    pointsAdded: number;
    previousExp: number;
    newExp: number;
    expAdded: number;
    reason: string;
    timestamp: string;
  }) => void;

  // 批量分数更新
  batch_score_update: (data: {
    schoolId: string;
    totalUpdates: number;
    updates: Array<{
      studentId: string;
      studentName: string;
      className: string;
      pointsAdded: number;
      expAdded: number;
      newPoints: number;
      newExp: number;
    }>;
    timestamp: string;
  }) => void;

  // 教学计划发布
  plan_published: (data: {
    lessonPlanId: string;
    schoolId: string;
    title: string;
    date: string;
    taskStats: {
      totalStudents: number;
      tasksCreated: number;
      totalExpAwarded: number;
    };
    affectedClasses: string[];
  }) => void;

  // PK事件 - 战斗模式
  PK_START: (data: {
    id: string;
    studentA: {
      id: string;
      name: string;
      avatar_url: string;
      team_name?: string;
      total_points: number;
      total_exp: number;
    };
    studentB: {
      id: string;
      name: string;
      avatar_url: string;
      team_name?: string;
      total_points: number;
      total_exp: number;
    };
    topic: string;
    schoolId: string;
    startTime: string;
  }) => void;

  PK_END: (data: {
    id: string;
    winner_id: string;
    endTime: string;
    duration: number;
    finalScores: {
      studentA: number;
      studentB: number;
    };
  }) => void;

  // 挑战成功事件
  CHALLENGE_SUCCESS: (data: {
    id: string;
    studentId: string;
    studentName: string;
    challengeTitle: string;
    expAwarded: number;
    pointsAwarded: number;
    successTime: string;
  }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(schoolId: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      try {
        this.socket = io('/', {
          transports: ['websocket', 'polling'],
          upgrade: true,
          rememberUpgrade: true,
          timeout: 20000,
          forceNew: true,
          query: {
            schoolId,
            clientType: 'mobile'
          }
        });

        // 连接成功
        this.socket.on('connect', () => {
          console.log('🔌 Socket connected successfully');
          console.log('📊 Socket ID:', this.socket?.id);
          this.reconnectAttempts = 0;
          resolve(this.socket!);
        });

        // 连接错误
        this.socket.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error);
          this.reconnectAttempts++;

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            reject(error);
          } else {
            console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => {
              this.connect(schoolId).then(resolve).catch(reject);
            }, this.reconnectDelay * this.reconnectAttempts);
          }
        });

        // 断开连接
        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Socket disconnected:', reason);

          if (reason === 'io server disconnect') {
            // 服务器主动断开，需要重新连接
            this.socket?.connect();
          }
        });

        // 监听默认错误
        this.socket.on('error', (error) => {
          console.error('❌ Socket error:', error);
        });

      } catch (error) {
        console.error('❌ Failed to initialize socket:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // 监听事件
  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    if (this.socket) {
      (this.socket as any).on(event, callback);
    }
  }

  // 取消监听事件
  off<K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]): void {
    if (this.socket) {
      if (callback) {
        (this.socket as any).off(event, callback);
      } else {
        (this.socket as any).off(event);
      }
    }
  }

  // 发送事件
  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ Cannot emit event - socket not connected:', event);
    }
  }

  // 加入房间
  joinRoom(room: string): void {
    this.emit('join_room', { room });
  }

  // 离开房间
  leaveRoom(room: string): void {
    this.emit('leave_room', { room });
  }

  // 获取连接统计
  getConnectionStats(): {
    connected: boolean;
    socketId?: string;
    reconnectAttempts: number;
  } {
    return {
      connected: this.isConnected(),
      socketId: this.getSocketId(),
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// 创建单例实例
export const socketService = new SocketService();

export default socketService;