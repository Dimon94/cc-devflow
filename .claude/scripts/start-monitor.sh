#!/bin/bash

# CC-DevFlow 进度监控服务启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 工作目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
MONITOR_SCRIPT="$SCRIPT_DIR/progress-monitor.py"
PID_FILE="$PROJECT_ROOT/.claude/cache/monitor.pid"
LOG_FILE="$PROJECT_ROOT/.claude/logs/progress-monitor.log"

# 创建必要目录
mkdir -p "$PROJECT_ROOT/.claude/cache"
mkdir -p "$PROJECT_ROOT/.claude/logs"

# 函数定义
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# 检查Python依赖
check_dependencies() {
    log_info "检查依赖..."

    # 检查Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python3 未安装"
        exit 1
    fi

    # 检查必要的Python包
    local required_packages=("watchdog")
    for package in "${required_packages[@]}"; do
        if ! python3 -c "import $package" &> /dev/null; then
            log_warn "Python包 $package 未安装，正在安装..."
            pip3 install $package || {
                log_error "安装 $package 失败"
                exit 1
            }
        fi
    done

    log_info "依赖检查完成"
}

# 检查是否已在运行
is_running() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        else
            # PID文件存在但进程不存在，清理PID文件
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# 启动监控服务
start_monitor() {
    log_info "启动 CC-DevFlow 进度监控服务..."

    if is_running; then
        local pid=$(cat "$PID_FILE")
        log_warn "监控服务已在运行 (PID: $pid)"
        return 0
    fi

    # 检查依赖
    check_dependencies

    # 切换到项目根目录
    cd "$PROJECT_ROOT"

    # 启动监控服务
    log_info "启动监控进程..."
    nohup python3 "$MONITOR_SCRIPT" start > "$LOG_FILE" 2>&1 &
    local pid=$!

    # 保存PID
    echo $pid > "$PID_FILE"

    # 等待几秒检查进程是否正常启动
    sleep 3
    if kill -0 "$pid" 2>/dev/null; then
        log_info "监控服务启动成功 (PID: $pid)"
        log_info "日志文件: $LOG_FILE"
        return 0
    else
        log_error "监控服务启动失败"
        rm -f "$PID_FILE"
        return 1
    fi
}

# 停止监控服务
stop_monitor() {
    log_info "停止 CC-DevFlow 进度监控服务..."

    if ! is_running; then
        log_warn "监控服务未在运行"
        return 0
    fi

    local pid=$(cat "$PID_FILE")
    log_info "正在停止进程 (PID: $pid)..."

    # 发送TERM信号
    if kill -TERM "$pid" 2>/dev/null; then
        # 等待进程优雅退出
        local count=0
        while kill -0 "$pid" 2>/dev/null && [[ $count -lt 30 ]]; do
            sleep 1
            count=$((count + 1))
        done

        # 如果进程仍在运行，强制杀死
        if kill -0 "$pid" 2>/dev/null; then
            log_warn "进程未响应TERM信号，发送KILL信号..."
            kill -KILL "$pid" 2>/dev/null || true
        fi

        rm -f "$PID_FILE"
        log_info "监控服务已停止"
    else
        log_error "无法停止进程 (PID: $pid)"
        rm -f "$PID_FILE"
        return 1
    fi
}

# 重启监控服务
restart_monitor() {
    log_info "重启 CC-DevFlow 进度监控服务..."
    stop_monitor
    sleep 2
    start_monitor
}

# 查看监控状态
status_monitor() {
    echo -e "${BLUE}CC-DevFlow 进度监控服务状态${NC}"
    echo "=================================="

    if is_running; then
        local pid=$(cat "$PID_FILE")
        echo -e "状态: ${GREEN}运行中${NC}"
        echo "PID: $pid"

        # 显示进程信息
        if command -v ps &> /dev/null; then
            echo "进程信息:"
            ps -p "$pid" -o pid,ppid,cmd,etime,pcpu,pmem 2>/dev/null || true
        fi

        # 显示最近日志
        if [[ -f "$LOG_FILE" ]]; then
            echo ""
            echo "最近日志 (最后10行):"
            tail -10 "$LOG_FILE" 2>/dev/null || true
        fi

        # 显示监控报告
        local report_file="$PROJECT_ROOT/.claude/cache/monitoring_report.json"
        if [[ -f "$report_file" ]]; then
            echo ""
            echo "监控报告:"
            if command -v jq &> /dev/null; then
                jq . "$report_file" 2>/dev/null || cat "$report_file"
            else
                cat "$report_file"
            fi
        fi
    else
        echo -e "状态: ${RED}未运行${NC}"
    fi

    echo ""
    echo "配置文件: $PROJECT_ROOT/.claude/settings.json"
    echo "日志文件: $LOG_FILE"
    echo "PID文件: $PID_FILE"
}

# 查看日志
view_logs() {
    if [[ -f "$LOG_FILE" ]]; then
        log_info "查看监控日志 (按 Ctrl+C 退出)..."
        tail -f "$LOG_FILE"
    else
        log_warn "日志文件不存在: $LOG_FILE"
    fi
}

# 配置自动启动
setup_autostart() {
    log_info "配置自动启动..."

    # 创建systemd服务文件 (Linux)
    if command -v systemctl &> /dev/null; then
        local service_file="/etc/systemd/system/cc-devflow-monitor.service"
        log_info "创建systemd服务: $service_file"

        sudo tee "$service_file" > /dev/null << EOF
[Unit]
Description=CC-DevFlow Progress Monitor
After=network.target

[Service]
Type=forking
User=$USER
WorkingDirectory=$PROJECT_ROOT
ExecStart=$SCRIPT_DIR/start-monitor.sh start
ExecStop=$SCRIPT_DIR/start-monitor.sh stop
PIDFile=$PID_FILE
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

        sudo systemctl daemon-reload
        sudo systemctl enable cc-devflow-monitor.service
        log_info "systemd服务已配置，使用以下命令管理:"
        echo "  启动: sudo systemctl start cc-devflow-monitor"
        echo "  停止: sudo systemctl stop cc-devflow-monitor"
        echo "  状态: sudo systemctl status cc-devflow-monitor"

    # macOS LaunchAgent
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        local plist_file="$HOME/Library/LaunchAgents/com.ccdevflow.monitor.plist"
        log_info "创建LaunchAgent: $plist_file"

        mkdir -p "$(dirname "$plist_file")"
        cat > "$plist_file" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ccdevflow.monitor</string>
    <key>ProgramArguments</key>
    <array>
        <string>$SCRIPT_DIR/start-monitor.sh</string>
        <string>start</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJECT_ROOT</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$LOG_FILE</string>
    <key>StandardErrorPath</key>
    <string>$LOG_FILE</string>
</dict>
</plist>
EOF

        launchctl load "$plist_file"
        log_info "LaunchAgent已配置，使用以下命令管理:"
        echo "  启动: launchctl start com.ccdevflow.monitor"
        echo "  停止: launchctl stop com.ccdevflow.monitor"

    else
        log_warn "不支持的操作系统，请手动配置自动启动"
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."

    local issues=0

    # 检查服务状态
    if ! is_running; then
        log_error "监控服务未运行"
        issues=$((issues + 1))
    fi

    # 检查Python依赖
    if ! python3 -c "import watchdog" &> /dev/null; then
        log_error "Python依赖 watchdog 缺失"
        issues=$((issues + 1))
    fi

    # 检查目录权限
    if [[ ! -w "$PROJECT_ROOT/.claude" ]]; then
        log_error ".claude目录不可写"
        issues=$((issues + 1))
    fi

    # 检查日志文件
    if [[ -f "$LOG_FILE" ]]; then
        local log_size=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
        if [[ $log_size -gt 10485760 ]]; then  # 10MB
            log_warn "日志文件过大 ($(($log_size / 1024 / 1024))MB)"
        fi
    fi

    # 检查配置文件
    local config_file="$PROJECT_ROOT/.claude/settings.json"
    if [[ -f "$config_file" ]]; then
        if ! python3 -c "import json; json.load(open('$config_file'))" &> /dev/null; then
            log_error "配置文件格式错误"
            issues=$((issues + 1))
        fi
    fi

    if [[ $issues -eq 0 ]]; then
        log_info "健康检查通过"
        return 0
    else
        log_error "发现 $issues 个问题"
        return 1
    fi
}

# 显示帮助
show_help() {
    cat << EOF
CC-DevFlow 进度监控服务管理脚本

用法: $0 [COMMAND] [OPTIONS]

命令:
  start       启动监控服务
  stop        停止监控服务
  restart     重启监控服务
  status      查看服务状态
  logs        查看实时日志
  health      执行健康检查
  autostart   配置自动启动
  help        显示此帮助信息

选项:
  -v, --verbose    详细输出
  -q, --quiet      静默模式

示例:
  $0 start                # 启动监控服务
  $0 status               # 查看状态
  $0 logs                 # 查看日志
  $0 health               # 健康检查

配置文件: $PROJECT_ROOT/.claude/settings.json
日志文件: $LOG_FILE

更多信息请参考: https://github.com/Dimon94/cc-devflow
EOF
}

# 主逻辑
main() {
    case "${1:-help}" in
        start)
            start_monitor
            ;;
        stop)
            stop_monitor
            ;;
        restart)
            restart_monitor
            ;;
        status)
            status_monitor
            ;;
        logs)
            view_logs
            ;;
        health)
            health_check
            ;;
        autostart)
            setup_autostart
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主逻辑
main "$@"