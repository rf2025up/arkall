const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
    try {
        console.log('--- Database Diagnosis ---');

        // 1. Check table counts
        const tables = ['pk_matches', 'task_records', 'student_badges', 'students', 'habit_logs'];
        for (const table of tables) {
            const count = await prisma[table].count();
            console.log(`Table ${table}: ${count} records`);
        }

        // 2. Check current active connections and locks (Postgres specific)
        const activeQueries = await prisma.$queryRaw`
      SELECT pid, now() - query_start AS duration, query, state
      FROM pg_stat_activity
      WHERE state != 'idle' AND query NOT LIKE '%pg_stat_activity%'
      ORDER BY duration DESC;
    `;
        console.log('Active Queries:', JSON.stringify(activeQueries, null, 2));

        // 3. Check for blocked queries
        const blockedQueries = await prisma.$queryRaw`
      SELECT
          blocked_locks.pid AS blocked_pid,
          blocked_activity.query AS blocked_query,
          blocking_locks.pid AS blocking_pid,
          blocking_activity.query AS blocking_query
      FROM pg_catalog.pg_locks blocked_locks
      JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_locks.pid = blocked_activity.pid
      JOIN pg_catalog.pg_locks blocking_locks 
          ON blocking_locks.locktype = blocked_locks.locktype
          AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
          AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
          AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
          AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
          AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
          AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
          AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
          AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
          AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
          AND blocking_locks.pid != blocked_locks.pid
      JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_locks.pid = blocking_activity.pid
      WHERE NOT blocked_locks.granted;
    `;
        console.log('Blocked Queries:', JSON.stringify(blockedQueries, null, 2));

    } catch (e) {
        console.error('Diagnosis failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
