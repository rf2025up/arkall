const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        console.log('Checking database status...');

        const tables = ['pk_matches', 'task_records', 'students', 'challenges', 'badges'];

        for (const table of tables) {
            try {
                const count = await prisma[table].count();
                console.log(`Table ${table}: ${count} records`);
            } catch (e) {
                console.log(`Table ${table} check failed: ${e.message}`);
            }
        }

        // Check recent task records
        const recentTaskRecordsCount = await prisma.task_records.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            }
        });
        console.log(`Recent task records (24h): ${recentTaskRecordsCount}`);

        // Check connections
        const connections = await prisma.$queryRaw`SELECT count(*) FROM pg_stat_activity`;
        console.log('Active connections:', connections);

    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

check();
