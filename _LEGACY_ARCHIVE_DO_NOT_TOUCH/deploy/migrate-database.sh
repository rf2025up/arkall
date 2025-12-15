#!/bin/bash

# StarJourney 数据库迁移脚本
# =====================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 数据库配置
DB_HOST="growark-postgresql.ns-bg6fgs6y.svc"
DB_PORT="5432"
DB_USER="postgres"
DB_PASSWORD="kngwb5cb"
DB_NAME="postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/opt/starj-backups"
MIGRATION_DIR="/home/devbox/project/database/migrations"

# 检查PostgreSQL客户端
check_postgres_client() {
    if ! command -v psql &> /dev/null; then
        log_error "PostgreSQL客户端 (psql) 未安装"
        log_info "请安装: apt-get install postgresql-client"
        exit 1
    fi

    if ! command -v pg_dump &> /dev/null; then
        log_error "PostgreSQL备份工具 (pg_dump) 未安装"
        log_info "请安装: apt-get install postgresql-client"
        exit 1
    fi
}

# 创建备份目录
create_backup_directory() {
    mkdir -p "$BACKUP_DIR"
    log_success "备份目录创建完成: $BACKUP_DIR"
}

# 数据库连接测试
test_database_connection() {
    log_info "测试数据库连接..."

    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        log_success "数据库连接成功"
    else
        log_error "数据库连接失败"
        exit 1
    fi
}

# 创建数据库备份
create_database_backup() {
    local backup_file="$BACKUP_DIR/pre_migration_backup_$TIMESTAMP.sql"

    log_info "创建数据库备份..."
    log_info "备份文件: $backup_file"

    if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$backup_file"; then
        log_success "数据库备份完成"

        # 压缩备份文件
        gzip "$backup_file"
        log_success "备份文件已压缩: $backup_file.gz"
    else
        log_error "数据库备份失败"
        exit 1
    fi
}

# 执行迁移脚本
execute_migration() {
    local migration_file="$1"
    local migration_name=$(basename "$migration_file" .sql)

    log_info "执行迁移: $migration_name"

    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"; then
        log_success "迁移完成: $migration_name"

        # 记录迁移历史
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
            INSERT INTO schema_migrations (name, executed_at)
            VALUES ('$migration_name', CURRENT_TIMESTAMP)
            ON CONFLICT (name) DO NOTHING;
        " 2>/dev/null || true
    else
        log_error "迁移失败: $migration_name"
        log_error "请检查数据库状态并考虑回滚"
        exit 1
    fi
}

# 创建迁移历史表
create_migration_table() {
    log_info "创建迁移历史表..."

    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        CREATE TABLE IF NOT EXISTS schema_migrations (
            name VARCHAR(255) PRIMARY KEY,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    " 2>/dev/null || true

    log_success "迁移历史表创建完成"
}

# 检查已执行的迁移
get_executed_migrations() {
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT name FROM schema_migrations ORDER BY executed_at;
    " 2>/dev/null | tr '\n' '|' | sed 's/|$//'
}

# 验证迁移结果
verify_migration() {
    log_info "验证迁移结果..."

    # 检查关键表是否存在
    local tables=("lms_task_library" "lms_lesson_plans" "lms_student_record" "students")

    for table in "${tables[@]}"; do
        local count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
            SELECT COUNT(*) FROM information_schema.tables
            WHERE table_name = '$table';
        " 2>/dev/null | tr -d ' ')

        if [[ "$count" -gt 0 ]]; then
            log_success "表存在: $table"
        else
            log_error "表缺失: $table"
            exit 1
        fi
    done

    # 检查任务库数据
    local task_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM lms_task_library WHERE is_active = true;
    " 2>/dev/null | tr -d ' ')

    if [[ "$task_count" -gt 0 ]]; then
        log_success "任务库数据验证通过: $task_count 个活跃任务"
    else
        log_warning "任务库数据为空，可能需要初始化"
    fi
}

# 回滚功能
rollback_migration() {
    local backup_file="$1"

    if [[ ! -f "$backup_file" ]]; then
        log_error "备份文件不存在: $backup_file"
        exit 1
    fi

    log_warning "开始数据库回滚..."
    log_warning "这将恢复到备份状态，所有现有数据将被覆盖"

    read -p "确认回滚? (yes/no): " confirm

    if [[ "$confirm" != "yes" ]]; then
        log_info "回滚已取消"
        exit 0
    fi

    # 解压备份文件（如果需要）
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" > "/tmp/rollback_$TIMESTAMP.sql"
        backup_file="/tmp/rollback_$TIMESTAMP.sql"
    fi

    # 执行回滚
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$backup_file"; then
        log_success "数据库回滚完成"
    else
        log_error "数据库回滚失败"
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    cat << EOF
StarJourney 数据库迁移工具

用法: $0 [选项] [参数]

选项:
    -h, --help          显示此帮助信息
    -m, --migrate       执行所有迁移
    -s, --status        显示迁移状态
    -b, --backup        仅创建数据库备份
    -r, --rollback FILE 回滚到指定备份文件
    -v, --verify        验证当前数据库状态

示例:
    $0 --migrate                    # 执行所有迁移
    $0 --backup                     # 创建备份
    $0 --rollback backup.sql.gz     # 回滚到备份
    $0 --status                     # 显示迁移状态
    $0 --verify                     # 验证数据库状态

EOF
}

# 显示迁移状态
show_migration_status() {
    log_info "迁移状态:"

    local executed=$(get_executed_migrations)

    if [[ -z "$executed" ]]; then
        log_info "  尚未执行任何迁移"
    else
        log_info "  已执行的迁移:"
        echo "$executed" | tr '|' '\n' | while read -r migration; do
            [[ -n "$migration" ]] && echo "    ✓ $migration"
        done
    fi

    log_info "  可用迁移文件:"
    for file in "$MIGRATION_DIR"/*.sql; do
        if [[ -f "$file" ]]; then
            local name=$(basename "$file" .sql)
            if echo "$executed" | grep -q "|$name|"; then
                echo "    ✓ $name (已执行)"
            else
                echo "    ○ $name (待执行)"
            fi
        fi
    done
}

# 主函数
main() {
    case "${1:-}" in
        -h|--help)
            show_help
            ;;
        -m|--migrate)
            log_info "开始数据库迁移..."
            check_postgres_client
            create_backup_directory
            test_database_connection
            create_migration_table
            create_database_backup

            local executed=$(get_executed_migrations)

            for migration_file in "$MIGRATION_DIR"/*.sql; do
                if [[ -f "$migration_file" ]]; then
                    local migration_name=$(basename "$migration_file" .sql)
                    if ! echo "$executed" | grep -q "|$migration_name|"; then
                        execute_migration "$migration_file"
                    else
                        log_info "跳过已执行的迁移: $migration_name"
                    fi
                fi
            done

            verify_migration
            log_success "🎉 数据库迁移完成！"
            ;;
        -s|--status)
            check_postgres_client
            test_database_connection
            show_migration_status
            ;;
        -b|--backup)
            log_info "创建数据库备份..."
            check_postgres_client
            create_backup_directory
            test_database_connection
            create_database_backup
            log_success "备份完成！"
            ;;
        -r|--rollback)
            if [[ -z "${2:-}" ]]; then
                log_error "请指定备份文件"
                show_help
                exit 1
            fi
            check_postgres_client
            test_database_connection
            rollback_migration "$2"
            ;;
        -v|--verify)
            log_info "验证数据库状态..."
            check_postgres_client
            test_database_connection
            verify_migration
            log_success "数据库验证完成！"
            ;;
        *)
            log_error "未知选项: ${1:-}"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"