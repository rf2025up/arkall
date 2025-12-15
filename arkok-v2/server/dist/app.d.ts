import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import AuthService from './services/auth.service';
import StudentService from './services/student.service';
import SocketService from './services/socket.service';
import HabitService from './services/habit.service';
import ChallengeService from './services/challenge.service';
import PKMatchService from './services/pkmatch.service';
import BadgeService from './services/badge.service';
export declare class App {
    app: express.Application;
    server: any;
    io: SocketIOServer;
    prisma: PrismaClient;
    authService: AuthService;
    studentService: StudentService;
    socketService: SocketService;
    habitService: HabitService;
    challengeService: ChallengeService;
    pkMatchService: PKMatchService;
    badgeService: BadgeService;
    constructor();
    private initializeMiddlewares;
    private initializeRoutes;
    private initializeErrorHandling;
    private initializeSocketIO;
    broadcast(event: string, data: any): void;
    broadcastToRoom(room: string, event: string, data: any): void;
    getConnectionStats(): {
        connected: number;
        rooms: string[];
    };
    start(port?: number): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=app.d.ts.map