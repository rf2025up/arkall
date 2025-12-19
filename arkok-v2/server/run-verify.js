
import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

async function run() {
    try {
        console.log('🚀 获取 Token...');
        const { execSync } = require('child_process');
        const tokenOutput = execSync('node ../create-token.js long').toString();
        const tokenMatch = tokenOutput.match(/eyJh[A-Za-z0-9._-]+/);
        if (!tokenMatch) throw new Error('Token not found in output');
        const token = tokenMatch[0];
        process.env.TEACHER_TOKEN = token;

        console.log('✅ Token 获取成功，开始验证...');
        // 动态加载验证逻辑
        require('./verify-prepare-qc-sync.ts');
    } catch (e) {
        console.error('❌ 脚本运行失败:', e.message);
    }
}

run();
