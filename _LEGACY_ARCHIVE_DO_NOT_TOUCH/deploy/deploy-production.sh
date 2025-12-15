#!/bin/bash

# StarJourney 生产环境部署脚本
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

# 配置变量
PROJECT_DIR="/home/devbox/project"
DEPLOY_DIR="/opt/starj-production"
BACKUP_DIR="/opt/starj-backups"
LOG_DIR="/var/log/starj"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 检查是否为root用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要root权限运行"
        exit 1
    fi
}

# 创建必要目录
create_directories() {
    log_info "创建部署目录..."
    mkdir -p "$DEPLOY_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$DEPLOY_DIR/scripts"
    mkdir -p "$DEPLOY_DIR/config"
    mkdir -p "/var/run/starj"

    log_success "目录创建完成"
}

# 备份现有部署
backup_existing() {
    if [[ -d "$DEPLOY_DIR" && -f "$DEPLOY_DIR/star-server.js" ]]; then
        log_info "备份现有部署..."

        BACKUP_NAME="starj_backup_$TIMESTAMP"
        mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

        cp -r "$DEPLOY_DIR"/* "$BACKUP_DIR/$BACKUP_NAME/" 2>/dev/null || true

        # 备份数据库
        log_info "备份数据库..."
        pg_dump -h growark-postgresql.ns-bg6fgs6y.svc -U postgres -d postgres > "$BACKUP_DIR/$BACKUP_NAME/database_$TIMESTAMP.sql"

        log_success "备份完成: $BACKUP_DIR/$BACKUP_NAME"
    fi
}

# 部署应用文件
deploy_application() {
    log_info "部署应用文件..."

    # 复制StarJourney文件
    cp -r "$PROJECT_DIR/starj/"* "$DEPLOY_DIR/"

    # 复制前端文件
    mkdir -p "$DEPLOY_DIR/frontend"
    cp -r "$PROJECT_DIR/arkok/"* "$DEPLOY_DIR/frontend/"

    # 复制部署配置
    cp "$PROJECT_DIR/deploy/production.env" "$DEPLOY_DIR/config/.env"

    # 设置权限
    chown -R starj:starj "$DEPLOY_DIR" 2>/dev/null || chown -R $USER:$USER "$DEPLOY_DIR"
    chmod +x "$DEPLOY_DIR/star-server.js"

    log_success "应用部署完成"
}

# 创建系统服务文件
create_systemd_service() {
    log_info "创建系统服务..."

    cat > /etc/systemd/system/starj.service << EOF
[Unit]
Description=StarJourney Learning Management System
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=starj
Group=starj
WorkingDirectory=$DEPLOY_DIR
Environment=NODE_ENV=production
EnvironmentFile=$DEPLOY_DIR/config/.env
ExecStart=/usr/bin/node star-server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=starj
KillMode=mixed
KillSignal=SIGTERM
TimeoutStopSec=30

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$DEPLOY_DIR $LOG_DIR /var/run/starj

# 资源限制
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable starj

    log_success "系统服务创建完成"
}

# 配置日志轮转
configure_log_rotation() {
    log_info "配置日志轮转..."

    cat > /etc/logrotate.d/starj << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 starj starj
    postrotate
        systemctl reload starj || true
    endscript
}
EOF

    log_success "日志轮转配置完成"
}

# 配置监控脚本
setup_monitoring() {
    log_info "设置监控脚本..."

    cat > "$DEPLOY_DIR/scripts/health-check.sh" << 'EOF'
#!/bin/bash

# 健康检查脚本
HEALTH_URL="http://localhost:3001/api/health"
LOG_FILE="/var/log/starj/health-check.log"
MAX_FAILED=3
FAILED_COUNT=0

while true; do
    if curl -f -s "$HEALTH_URL" > /dev/null; then
        echo "$(date): Health check passed" >> "$LOG_FILE"
        FAILED_COUNT=0
    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
        echo "$(date): Health check failed ($FAILED_COUNT/$MAX_FAILED)" >> "$LOG_FILE"

        if [[ $FAILED_COUNT -ge $MAX_FAILED ]]; then
            echo "$(date): Restarting StarJourney service" >> "$LOG_FILE"
            systemctl restart starj
            FAILED_COUNT=0
        fi
    fi

    sleep 30
done
EOF

    chmod +x "$DEPLOY_DIR/scripts/health-check.sh"

    # 创建监控服务
    cat > /etc/systemd/system/starj-monitor.service << EOF
[Unit]
Description=StarJourney Health Monitor
After=starj.service
Requires=starj.service

[Service]
Type=simple
User=starj
ExecStart=$DEPLOY_DIR/scripts/health-check.sh
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable starj-monitor

    log_success "监控脚本设置完成"
}

# 创建用户和权限
setup_user() {
    if ! id "starj" &>/dev/null; then
        log_info "创建starj用户..."
        useradd -r -s /bin/false -d "$DEPLOY_DIR" starj
        log_success "用户创建完成"
    fi
}

# 数据库迁移
run_database_migrations() {
    log_info "执行数据库迁移..."

    cd "$DEPLOY_DIR"
    node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    console.log('🔄 执行数据库迁移...');

    // 创建任务库表
    await pool.query(\`
      CREATE TABLE IF NOT EXISTS lms_task_library (
        id SERIAL PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        name VARCHAR(200) NOT NULL,
        default_exp INTEGER DEFAULT 10,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    \`);

    console.log('✅ 任务库表创建完成');

    // 升级其他表
    await pool.query(\`
      ALTER TABLE lms_lesson_plans
      ADD COLUMN IF NOT EXISTS course_progress JSONB,
      ADD COLUMN IF NOT EXISTS qc_config JSONB,
      ADD COLUMN IF NOT EXISTS publish_date DATE,
      ADD COLUMN IF NOT EXISTS batch_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS total_students INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_records INTEGER DEFAULT 0
    \`);

    console.log('✅ lesson_plans表升级完成');

    await pool.query(\`
      ALTER TABLE lms_student_record
      ADD COLUMN IF NOT EXISTS plan_id INTEGER,
      ADD COLUMN IF NOT EXISTS batch_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS task_category VARCHAR(50),
      ADD COLUMN IF NOT EXISTS exp_awarded INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS is_special BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP
    \`);

    console.log('✅ student_record表升级完成');

    await pool.query(\`
      ALTER TABLE students
      ADD COLUMN IF NOT EXISTS individual_progress JSONB,
      ADD COLUMN IF NOT EXISTS teacher_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS class_id_ref INTEGER,
      ADD COLUMN IF NOT EXISTS current_grade_level INTEGER
    \`);

    console.log('✅ students表升级完成');

    console.log('🎉 数据库迁移完成！');
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
" || {
        log_error "数据库迁移失败"
        exit 1
    }

    log_success "数据库迁移完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."

    systemctl start starj
    systemctl start starj-monitor

    # 等待服务启动
    sleep 5

    # 检查服务状态
    if systemctl is-active --quiet starj; then
        log_success "StarJourney服务启动成功"
    else
        log_error "StarJourney服务启动失败"
        systemctl status starj
        exit 1
    fi

    if systemctl is-active --quiet starj-monitor; then
        log_success "监控服务启动成功"
    else
        log_warning "监控服务启动失败，但不影响主要功能"
    fi
}

# 运行部署后测试
post_deploy_tests() {
    log_info "运行部署后测试..."

    # 健康检查
    if curl -f -s "http://localhost:3001/api/health" > /dev/null; then
        log_success "健康检查通过"
    else
        log_error "健康检查失败"
        exit 1
    fi

    # 任务库API测试
    if curl -f -s "http://localhost:3001/api/meta/tasks" > /dev/null; then
        log_success "任务库API测试通过"
    else
        log_error "任务库API测试失败"
        exit 1
    fi

    log_success "部署后测试全部通过"
}

# 主函数
main() {
    log_info "开始StarJourney生产环境部署..."
    log_info "部署时间: $(date)"
    log_info "项目目录: $PROJECT_DIR"
    log_info "部署目录: $DEPLOY_DIR"

    check_root
    create_directories
    backup_existing
    setup_user
    deploy_application
    create_systemd_service
    configure_log_rotation
    setup_monitoring
    run_database_migrations
    start_services
    post_deploy_tests

    log_success "🎉 StarJourney生产环境部署完成！"
    log_info "服务状态: $(systemctl is-active starj)"
    log_info "访问地址: https://esboimzbkure.sealosbja.site"
    log_info "日志位置: $LOG_DIR"
    log_info "配置文件: $DEPLOY_DIR/config/.env"

    echo ""
    log_info "常用命令:"
    echo "  查看服务状态: systemctl status starj"
    echo "  查看日志: journalctl -u starj -f"
    echo "  重启服务: systemctl restart starj"
    echo "  停止服务: systemctl stop starj"
}

# 执行主函数
main "$@"