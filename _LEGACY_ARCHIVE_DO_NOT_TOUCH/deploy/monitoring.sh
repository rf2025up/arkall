#!/bin/bash

# StarJourney 监控和告警配置脚本
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
MONITOR_DIR="/opt/starj-monitoring"
CONFIG_DIR="/etc/starj"
LOG_DIR="/var/log/starj"
ALERT_EMAIL="admin@starj.com"
WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

# 创建监控目录
create_monitoring_directories() {
    log_info "创建监控目录..."

    mkdir -p "$MONITOR_DIR/scripts"
    mkdir -p "$MONITOR_DIR/config"
    mkdir -p "$CONFIG_DIR"
    mkdir -p "$LOG_DIR/monitoring"

    log_success "监控目录创建完成"
}

# 创建性能监控脚本
create_performance_monitor() {
    log_info "创建性能监控脚本..."

    cat > "$MONITOR_DIR/scripts/performance-monitor.sh" << 'EOF'
#!/bin/bash

# StarJourney 性能监控脚本

METRICS_FILE="/var/log/starj/metrics.log"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=80
ALERT_THRESHOLD_DISK=85
API_URL="http://localhost:3001/api/health"

# 获取系统指标
get_system_metrics() {
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")

    # CPU使用率
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')

    # 内存使用率
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')

    # 磁盘使用率
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

    # API响应时间
    local api_response_time=$(curl -o /dev/null -s -w '%{time_total}' "$API_URL" 2>/dev/null || echo "0")

    # 数据库连接数
    local db_connections=$(psql -h growark-postgresql.ns-bg6fgs6y.svc -U postgres -d postgres -t -c "
        SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
    " 2>/dev/null | tr -d ' ' || echo "0")

    # 写入指标
    echo "$timestamp,cpu:$cpu_usage,memory:$memory_usage,disk:$disk_usage,api_response:$api_response_time,db_connections:$db_connections" >> "$METRICS_FILE"

    # 检查告警阈值
    check_alerts "$cpu_usage" "$memory_usage" "$disk_usage" "$api_response_time" "$db_connections"
}

# 检查告警条件
check_alerts() {
    local cpu=$1
    local memory=$2
    local disk=$3
    local api_time=$4
    local db_conn=$5

    local alerts=()

    # CPU告警
    if (( $(echo "$cpu > $ALERT_THRESHOLD_CPU" | bc -l) )); then
        alerts+=("CPU使用率过高: ${cpu}%")
    fi

    # 内存告警
    if (( $(echo "$memory > $ALERT_THRESHOLD_MEMORY" | bc -l) )); then
        alerts+=("内存使用率过高: ${memory}%")
    fi

    # 磁盘告警
    if [[ $disk -gt $ALERT_THRESHOLD_DISK ]]; then
        alerts+=("磁盘使用率过高: ${disk}%")
    fi

    # API响应时间告警
    if (( $(echo "$api_time > 5.0" | bc -l) )); then
        alerts+=("API响应时间过长: ${api_time}s")
    fi

    # 数据库连接数告警
    if [[ $db_conn -gt 80 ]]; then
        alerts+=("数据库连接数过多: $db_conn")
    fi

    # 发送告警
    if [[ ${#alerts[@]} -gt 0 ]]; then
        send_alert "${alerts[*]}"
    fi
}

# 发送告警
send_alert() {
    local message="StarJourney系统告警: $1"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")

    # 写入告警日志
    echo "$timestamp ALERT: $message" >> "/var/log/starj/alerts.log"

    # 发送邮件告警
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "StarJourney系统告警" "$ALERT_EMAIL"
    fi

    # 发送Slack告警
    if [[ -n "$WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 $message\"}" \
            "$WEBHOOK_URL" 2>/dev/null || true
    fi
}

# 主循环
while true; do
    get_system_metrics
    sleep 60
done
EOF

    chmod +x "$MONITOR_DIR/scripts/performance-monitor.sh"
    log_success "性能监控脚本创建完成"
}

# 创建业务监控脚本
create_business_monitor() {
    log_info "创建业务监控脚本..."

    cat > "$MONITOR_DIR/scripts/business-monitor.sh" << 'EOF'
#!/bin/bash

# StarJourney 业务监控脚本

BUSINESS_METRICS_FILE="/var/log/starj/business-metrics.log"
API_BASE="http://localhost:3001/api"

# 获取业务指标
get_business_metrics() {
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")

    # 任务库数据检查
    local task_count=$(curl -s "$API_BASE/meta/tasks" | jq '.data | length' 2>/dev/null || echo "0")

    # 检查今日备课计划
    local today_plans=$(curl -s "$API_BASE/plans/today?teacher_id=teacher_001" | jq '. | length' 2>/dev/null || echo "0")

    # 数据库连接检查
    local db_status=0
    if psql -h growark-postgresql.ns-bg6fgs6y.svc -U postgres -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
        db_status=1
    fi

    # 检查关键表数据完整性
    local lms_task_library_count=$(psql -h growark-postgresql.ns-bg6fgs6y.svc -U postgres -d postgres -t -c "
        SELECT COUNT(*) FROM lms_task_library WHERE is_active = true;
    " 2>/dev/null | tr -d ' ' || echo "0")

    local students_count=$(psql -h growark-postgresql.ns-bg6fgs6y.svc -U postgres -d postgres -t -c "
        SELECT COUNT(*) FROM students;
    " 2>/dev/null | tr -d ' ' || echo "0")

    # 记录业务指标
    echo "$timestamp,tasks:$task_count,today_plans:$today_plans,db_status:$db_status,lms_tasks:$lms_task_library_count,students:$students_count" >> "$BUSINESS_METRICS_FILE"

    # 业务告警检查
    check_business_alerts "$task_count" "$today_plans" "$db_status" "$lms_task_library_count" "$students_count"
}

# 业务告警检查
check_business_alerts() {
    local tasks=$1
    local plans=$2
    local db_status=$3
    local lms_tasks=$4
    local students=$5

    local alerts=()

    # 任务库告警
    if [[ $tasks -eq 0 ]]; then
        alerts+=("任务库API异常或无数据")
    fi

    # 数据库连接告警
    if [[ $db_status -eq 0 ]]; then
        alerts+=("数据库连接失败")
    fi

    # 关键数据告警
    if [[ $lms_tasks -lt 50 ]]; then
        alerts+=("任务库数据不足: $lms_tasks 个任务")
    fi

    if [[ $students -eq 0 ]]; then
        alerts+=("学生数据为空")
    fi

    # 发送业务告警
    if [[ ${#alerts[@]} -gt 0 ]]; then
        send_business_alert "${alerts[*]}"
    fi
}

# 发送业务告警
send_business_alert() {
    local message="StarJourney业务告警: $1"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")

    echo "$timestamp BUSINESS_ALERT: $message" >> "/var/log/starj/business-alerts.log"

    # 发送邮件告警
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "StarJourney业务告警" "$ALERT_EMAIL"
    fi
}

# 主循环
while true; do
    get_business_metrics
    sleep 300  # 5分钟检查一次
done
EOF

    chmod +x "$MONITOR_DIR/scripts/business-monitor.sh"
    log_success "业务监控脚本创建完成"
}

# 创建日志分析脚本
create_log_analyzer() {
    log_info "创建日志分析脚本..."

    cat > "$MONITOR_DIR/scripts/log-analyzer.sh" << 'EOF'
#!/bin/bash

# StarJourney 日志分析脚本

LOG_FILE="/var/log/starj/starj.log"
ERROR_LOG="/var/log/starj/error-summary.log"
ANALYSIS_INTERVAL=3600  # 1小时

# 分析错误日志
analyze_errors() {
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    local error_count=$(grep -c "ERROR" "$LOG_FILE" 2>/dev/null || echo "0")
    local warning_count=$(grep -c "WARNING" "$LOG_FILE" 2>/dev/null || echo "0")

    # 提取最近的错误
    local recent_errors=$(tail -100 "$LOG_FILE" | grep "ERROR" | tail -5)

    if [[ $error_count -gt 0 || $warning_count -gt 0 ]]; then
        echo "$timestamp ERROR_SUMMARY: errors=$error_count, warnings=$warning_count" >> "$ERROR_LOG"

        if [[ -n "$recent_errors" ]]; then
            echo "$timestamp RECENT_ERRORS:" >> "$ERROR_LOG"
            echo "$recent_errors" >> "$ERROR_LOG"
        fi

        # 如果错误过多，发送告警
        if [[ $error_count -gt 10 ]]; then
            send_error_alert "$error_count" "$warning_count"
        fi
    fi
}

# 发送错误告警
send_error_alert() {
    local errors=$1
    local warnings=$2

    local message="StarJourney错误告警: 错误 $errors 个，警告 $warnings 个"

    if command -v mail &> /dev/null; then
        echo "请检查系统日志: $LOG_FILE" | mail -s "StarJourney错误告警" "$ALERT_EMAIL"
    fi
}

# 主循环
while true; do
    if [[ -f "$LOG_FILE" ]]; then
        analyze_errors
    fi
    sleep $ANALYSIS_INTERVAL
done
EOF

    chmod +x "$MONITOR_DIR/scripts/log-analyzer.sh"
    log_success "日志分析脚本创建完成"
}

# 创建Prometheus配置
create_prometheus_config() {
    log_info "创建Prometheus配置..."

    cat > "$CONFIG_DIR/prometheus.yml" << EOF
# StarJourney Prometheus配置
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "$CONFIG_DIR/alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - localhost:9093

scrape_configs:
  - job_name: 'starj-metrics'
    static_configs:
      - targets: ['localhost:9091']
    scrape_interval: 30s
    metrics_path: /metrics

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['localhost:9187']
EOF

    log_success "Prometheus配置创建完成"
}

# 创建告警规则
create_alert_rules() {
    log_info "创建告警规则..."

    cat > "$CONFIG_DIR/alert_rules.yml" << EOF
# StarJourney 告警规则
groups:
  - name: starj_alerts
    rules:
      - alert: HighCPUUsage
        expr: cpu_usage > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "StarJourney CPU使用率过高"
          description: "CPU使用率 {{ $value }}% 超过阈值"

      - alert: HighMemoryUsage
        expr: memory_usage > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "StarJourney内存使用率过高"
          description: "内存使用率 {{ $value }}% 超过阈值"

      - alert: HighDiskUsage
        expr: disk_usage > 85
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "StarJourney磁盘使用率过高"
          description: "磁盘使用率 {{ $value }}% 超过阈值"

      - alert: APIDown
        expr: up{job="starj-metrics"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "StarJourney API服务不可用"
          description: "StarJourney API服务已停止响应"

      - alert: DatabaseDown
        expr: up{job="postgres-exporter"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL数据库不可用"
          description: "数据库连接失败"

      - alert: HighAPILatency
        expr: api_response_time > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "API响应时间过长"
          description: "API平均响应时间 {{ $value }}s 超过阈值"

      - alert: TooManyDatabaseConnections
        expr: db_connections > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "数据库连接数过多"
          description: "活跃数据库连接数 {{ $value }} 超过阈值"
EOF

    log_success "告警规则创建完成"
}

# 创建监控服务
create_monitoring_services() {
    log_info "创建监控服务..."

    # 性能监控服务
    cat > /etc/systemd/system/starj-performance-monitor.service << EOF
[Unit]
Description=StarJourney Performance Monitor
After=starj.service
Requires=starj.service

[Service]
Type=simple
User=starj
ExecStart=$MONITOR_DIR/scripts/performance-monitor.sh
Restart=always
RestartSec=30
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    # 业务监控服务
    cat > /etc/systemd/system/starj-business-monitor.service << EOF
[Unit]
Description=StarJourney Business Monitor
After=starj.service
Requires=starj.service

[Service]
Type=simple
User=starj
ExecStart=$MONITOR_DIR/scripts/business-monitor.sh
Restart=always
RestartSec=60
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    # 日志分析服务
    cat > /etc/systemd/system/starj-log-analyzer.service << EOF
[Unit]
Description=StarJourney Log Analyzer
After=starj.service
Requires=starj.service

[Service]
Type=simple
User=starj
ExecStart=$MONITOR_DIR/scripts/log-analyzer.sh
Restart=always
RestartSec=120
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable starj-performance-monitor
    systemctl enable starj-business-monitor
    systemctl enable starj-log-analyzer

    log_success "监控服务创建完成"
}

# 启动监控服务
start_monitoring_services() {
    log_info "启动监控服务..."

    systemctl start starj-performance-monitor
    systemctl start starj-business-monitor
    systemctl start starj-log-analyzer

    # 检查服务状态
    for service in starj-performance-monitor starj-business-monitor starj-log-analyzer; do
        if systemctl is-active --quiet "$service"; then
            log_success "$service 启动成功"
        else
            log_warning "$service 启动失败"
        fi
    done

    log_success "监控服务启动完成"
}

# 创建监控仪表板
create_dashboard() {
    log_info "创建监控仪表板..."

    cat > "$CONFIG_DIR/dashboard.json" << EOF
{
  "dashboard": {
    "title": "StarJourney 系统监控",
    "panels": [
      {
        "title": "系统状态",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job='starj-metrics'}",
            "legendFormat": "API服务"
          }
        ]
      },
      {
        "title": "CPU使用率",
        "type": "graph",
        "targets": [
          {
            "expr": "cpu_usage",
            "legendFormat": "CPU%"
          }
        ]
      },
      {
        "title": "内存使用率",
        "type": "graph",
        "targets": [
          {
            "expr": "memory_usage",
            "legendFormat": "内存%"
          }
        ]
      },
      {
        "title": "API响应时间",
        "type": "graph",
        "targets": [
          {
            "expr": "api_response_time",
            "legendFormat": "响应时间(s)"
          }
        ]
      }
    ]
  }
}
EOF

    log_success "监控仪表板配置创建完成"
}

# 显示监控信息
show_monitoring_info() {
    log_info "监控配置完成！"
    log_info "监控目录: $MONITOR_DIR"
    log_info "配置目录: $CONFIG_DIR"
    log_info "日志目录: $LOG_DIR"

    echo ""
    log_info "监控服务状态:"
    for service in starj-performance-monitor starj-business-monitor starj-log-analyzer; do
        local status=$(systemctl is-active "$service" 2>/dev/null || echo "inactive")
        echo "  $service: $status"
    done

    echo ""
    log_info "常用监控命令:"
    echo "  查看性能监控: journalctl -u starj-performance-monitor -f"
    echo "  查看业务监控: journalctl -u starj-business-monitor -f"
    echo "  查看日志分析: journalctl -u starj-log-analyzer -f"
    echo "  查看系统指标: tail -f /var/log/starj/metrics.log"
    echo "  查看业务指标: tail -f /var/log/starj/business-metrics.log"
    echo "  查看告警日志: tail -f /var/log/starj/alerts.log"
}

# 主函数
main() {
    log_info "配置StarJourney监控和告警系统..."

    create_monitoring_directories
    create_performance_monitor
    create_business_monitor
    create_log_analyzer
    create_prometheus_config
    create_alert_rules
    create_monitoring_services
    start_monitoring_services
    create_dashboard
    show_monitoring_info

    log_success "🎉 监控和告警系统配置完成！"
}

# 执行主函数
main "$@"