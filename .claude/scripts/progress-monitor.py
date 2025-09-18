#!/usr/bin/env python3
"""
CC-DevFlow 进度监控服务
自动监控文件变更、Git操作和测试结果，实时更新任务进度
"""

import os
import sys
import json
import time
import logging
import subprocess
import threading
from datetime import datetime, timedelta
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('.claude/logs/progress-monitor.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class ProgressMonitor:
    """进度监控主类"""

    def __init__(self, config_path='.claude/settings.json'):
        self.config = self.load_config(config_path)
        self.running = False
        self.observer = None
        self.git_monitor_thread = None
        self.test_monitor_thread = None
        self.last_git_commit = None
        self.active_requirements = {}

        # 初始化监控状态
        self.init_monitoring_state()

    def load_config(self, config_path):
        """加载配置文件"""
        default_config = {
            "progressMonitor": {
                "enabled": True,
                "watchPaths": ["src/", "components/", "lib/", "utils/"],
                "excludePatterns": ["*.test.*", "*.spec.*", "node_modules/", ".git/"],
                "gitMonitorInterval": 30,
                "testMonitorInterval": 300,
                "autoUpdateThreshold": 0.1,
                "maxConfidenceRequired": 0.8
            }
        }

        if os.path.exists(config_path):
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    user_config = json.load(f)
                    default_config.update(user_config)
            except Exception as e:
                logger.warning(f"配置文件读取失败，使用默认配置: {e}")

        return default_config["progressMonitor"]

    def init_monitoring_state(self):
        """初始化监控状态"""
        self.scan_active_requirements()
        logger.info(f"发现 {len(self.active_requirements)} 个活跃需求")

    def scan_active_requirements(self):
        """扫描活跃的需求"""
        requirements_dir = Path(".claude/docs/requirements")
        if not requirements_dir.exists():
            return

        for req_dir in requirements_dir.iterdir():
            if req_dir.is_dir() and req_dir.name.startswith('REQ-'):
                req_id = req_dir.name

                # 检查需求状态
                status_file = req_dir / "requirement_status.json"
                if status_file.exists():
                    try:
                        with open(status_file, 'r', encoding='utf-8') as f:
                            status = json.load(f)

                        if status.get('status') not in ['completed', 'cancelled']:
                            self.active_requirements[req_id] = {
                                'dir': req_dir,
                                'status': status,
                                'last_update': datetime.fromisoformat(status.get('lastUpdated', datetime.now().isoformat())),
                                'current_tasks': self.get_active_tasks(req_id)
                            }
                    except Exception as e:
                        logger.warning(f"读取需求 {req_id} 状态失败: {e}")

    def get_active_tasks(self, req_id):
        """获取需求下的活跃任务"""
        tasks = []
        tasks_dir = Path(f".claude/docs/requirements/{req_id}/tasks")

        if not tasks_dir.exists():
            return tasks

        for task_file in tasks_dir.glob("*_status.json"):
            try:
                with open(task_file, 'r', encoding='utf-8') as f:
                    task_status = json.load(f)

                if task_status.get('status') not in ['completed', 'cancelled']:
                    tasks.append({
                        'task_id': task_status['taskId'],
                        'status': task_status,
                        'file': task_file
                    })
            except Exception as e:
                logger.warning(f"读取任务状态失败 {task_file}: {e}")

        return tasks

    def start(self):
        """启动监控服务"""
        if self.running:
            logger.warning("监控服务已在运行")
            return

        logger.info("启动 CC-DevFlow 进度监控服务")
        self.running = True

        try:
            # 启动文件监控
            self.start_file_watcher()

            # 启动Git监控
            self.start_git_monitor()

            # 启动测试监控
            self.start_test_monitor()

            # 主循环
            self.main_loop()

        except KeyboardInterrupt:
            logger.info("收到停止信号")
        except Exception as e:
            logger.error(f"监控服务异常: {e}")
        finally:
            self.stop()

    def start_file_watcher(self):
        """启动文件监控"""
        self.observer = Observer()
        handler = CodeChangeHandler(self)

        # 监控配置的路径
        for path in self.config["watchPaths"]:
            if os.path.exists(path):
                self.observer.schedule(handler, path, recursive=True)
                logger.info(f"监控目录: {path}")

        self.observer.start()

    def start_git_monitor(self):
        """启动Git监控线程"""
        def git_monitor_loop():
            while self.running:
                try:
                    self.check_git_changes()
                    time.sleep(self.config["gitMonitorInterval"])
                except Exception as e:
                    logger.error(f"Git监控异常: {e}")
                    time.sleep(10)

        self.git_monitor_thread = threading.Thread(target=git_monitor_loop, daemon=True)
        self.git_monitor_thread.start()
        logger.info("Git监控线程已启动")

    def start_test_monitor(self):
        """启动测试监控线程"""
        def test_monitor_loop():
            while self.running:
                try:
                    self.check_test_results()
                    time.sleep(self.config["testMonitorInterval"])
                except Exception as e:
                    logger.error(f"测试监控异常: {e}")
                    time.sleep(30)

        self.test_monitor_thread = threading.Thread(target=test_monitor_loop, daemon=True)
        self.test_monitor_thread.start()
        logger.info("测试监控线程已启动")

    def main_loop(self):
        """主监控循环"""
        while self.running:
            try:
                # 定期刷新活跃需求
                self.scan_active_requirements()

                # 检查长时间未更新的任务
                self.check_stale_tasks()

                # 生成监控报告
                self.generate_monitoring_report()

                time.sleep(60)  # 每分钟执行一次

            except Exception as e:
                logger.error(f"主循环异常: {e}")
                time.sleep(10)

    def check_git_changes(self):
        """检查Git变更"""
        try:
            # 获取最新提交
            result = subprocess.run(
                ['git', 'log', '-1', '--format=%H|%s|%ct'],
                capture_output=True, text=True, timeout=10
            )

            if result.returncode == 0:
                commit_info = result.stdout.strip()
                if commit_info and commit_info != self.last_git_commit:
                    self.last_git_commit = commit_info
                    self.handle_git_commit(commit_info)

        except subprocess.TimeoutExpired:
            logger.warning("Git命令超时")
        except Exception as e:
            logger.error(f"Git检查失败: {e}")

    def handle_git_commit(self, commit_info):
        """处理Git提交"""
        parts = commit_info.split('|')
        if len(parts) >= 2:
            commit_hash = parts[0]
            commit_message = parts[1]

            logger.info(f"检测到新提交: {commit_hash[:8]} - {commit_message}")

            # 分析提交相关的需求和任务
            req_task = self.extract_req_task_from_commit(commit_message)
            if req_task:
                req_id, task_id = req_task
                self.trigger_progress_update(req_id, task_id, 'git_commit')

    def extract_req_task_from_commit(self, commit_message):
        """从提交信息提取需求和任务ID"""
        import re

        # 匹配 feat(REQ-123): ... 格式
        req_match = re.search(r'\(?(REQ-\d+)\)?:', commit_message)
        if req_match:
            req_id = req_match.group(1)

            # 尝试匹配任务ID
            task_match = re.search(r'(TASK_\d+)', commit_message)
            if task_match:
                return req_id, task_match.group(1)
            else:
                # 没有明确任务ID，查找当前进行中的任务
                current_task = self.find_current_task(req_id)
                if current_task:
                    return req_id, current_task

        return None

    def find_current_task(self, req_id):
        """查找需求下当前进行中的任务"""
        if req_id in self.active_requirements:
            for task in self.active_requirements[req_id]['current_tasks']:
                if task['status'].get('status') == 'in_progress':
                    return task['task_id']

        return None

    def check_test_results(self):
        """检查测试结果"""
        try:
            # 运行快速测试检查
            result = subprocess.run(
                ['npm', 'test', '--', '--passWithNoTests', '--silent'],
                capture_output=True, text=True, timeout=120
            )

            test_success = result.returncode == 0

            if test_success:
                # 解析测试覆盖率
                coverage_info = self.parse_test_coverage(result.stdout)
                self.update_test_metrics(coverage_info)
            else:
                logger.warning(f"测试失败: {result.stderr}")

        except subprocess.TimeoutExpired:
            logger.warning("测试执行超时")
        except Exception as e:
            logger.error(f"测试检查失败: {e}")

    def parse_test_coverage(self, test_output):
        """解析测试覆盖率"""
        import re

        coverage_patterns = [
            r'All files\s+\|\s+(\d+(?:\.\d+)?)',  # Jest coverage
            r'TOTAL\s+\d+\s+\d+\s+(\d+)%',        # NYC coverage
        ]

        for pattern in coverage_patterns:
            match = re.search(pattern, test_output)
            if match:
                return {
                    'overall_coverage': float(match.group(1)),
                    'timestamp': datetime.now().isoformat()
                }

        return {'overall_coverage': 0, 'timestamp': datetime.now().isoformat()}

    def update_test_metrics(self, coverage_info):
        """更新测试指标"""
        # 更新全局测试指标
        metrics_file = Path(".claude/cache/test_metrics.json")
        metrics_file.parent.mkdir(exist_ok=True)

        with open(metrics_file, 'w', encoding='utf-8') as f:
            json.dump(coverage_info, f, indent=2)

        # 触发相关任务的进度更新
        for req_id in self.active_requirements:
            for task in self.active_requirements[req_id]['current_tasks']:
                if task['status'].get('status') == 'in_progress':
                    self.trigger_progress_update(req_id, task['task_id'], 'test_update')

    def trigger_progress_update(self, req_id, task_id, trigger_type):
        """触发进度更新"""
        try:
            logger.info(f"触发进度更新: {req_id} > {task_id} ({trigger_type})")

            # 调用进度更新逻辑
            progress_data = self.analyze_task_progress(req_id, task_id)

            if progress_data and progress_data.get('confidence', 0) >= self.config["maxConfidenceRequired"]:
                self.update_task_progress(req_id, task_id, progress_data, trigger_type)
            else:
                logger.debug(f"进度更新置信度不足: {progress_data.get('confidence', 0)}")

        except Exception as e:
            logger.error(f"进度更新失败 {req_id}>{task_id}: {e}")

    def analyze_task_progress(self, req_id, task_id):
        """分析任务进度"""
        try:
            # 读取实现计划
            impl_plan_path = f".claude/docs/requirements/{req_id}/tasks/"
            if not os.path.exists(impl_plan_path):
                return None

            with open(impl_plan_path, 'r', encoding='utf-8') as f:
                impl_plan = f.read()

            # 分析代码实现进度
            progress_data = self.calculate_implementation_progress(impl_plan, req_id, task_id)

            # 加入测试覆盖率信息
            test_metrics = self.get_test_metrics()
            if test_metrics:
                progress_data['test_coverage'] = test_metrics.get('overall_coverage', 0)

            # 计算置信度
            progress_data['confidence'] = self.calculate_confidence(progress_data)

            return progress_data

        except Exception as e:
            logger.error(f"进度分析失败: {e}")
            return None

    def calculate_implementation_progress(self, impl_plan, req_id, task_id):
        """计算实现进度"""
        progress_data = {
            'files_planned': 0,
            'files_implemented': 0,
            'functions_planned': 0,
            'functions_implemented': 0,
            'code_quality_score': 0,
            'progress': 0
        }

        # 提取任务相关文件
        task_files = self.extract_task_files(impl_plan, task_id)
        progress_data['files_planned'] = len(task_files)

        for file_path in task_files:
            if os.path.exists(file_path):
                progress_data['files_implemented'] += 1

                # 分析文件内容
                file_analysis = self.analyze_file_implementation(file_path, impl_plan, task_id)
                progress_data['functions_planned'] += file_analysis['functions_planned']
                progress_data['functions_implemented'] += file_analysis['functions_implemented']

        # 计算整体进度
        if progress_data['files_planned'] > 0:
            file_progress = progress_data['files_implemented'] / progress_data['files_planned']
        else:
            file_progress = 0

        if progress_data['functions_planned'] > 0:
            function_progress = progress_data['functions_implemented'] / progress_data['functions_planned']
        else:
            function_progress = 1.0

        # 加权计算
        progress_data['progress'] = (file_progress * 0.4 + function_progress * 0.6) * 100

        return progress_data

    def extract_task_files(self, impl_plan, task_id):
        """提取任务相关文件"""
        files = []
        lines = impl_plan.split('\n')
        in_task_section = False

        for line in lines:
            if f"### {task_id}" in line or f"## {task_id}" in line:
                in_task_section = True
                continue
            elif (line.startswith('###') or line.startswith('##')) and in_task_section:
                break

            if in_task_section:
                # 提取文件路径
                import re
                file_matches = re.findall(r'`([^`]+\.(js|ts|tsx|jsx|py|java|go|rs))`', line)
                for match in file_matches:
                    files.append(match[0])

        return files

    def analyze_file_implementation(self, file_path, impl_plan, task_id):
        """分析文件实现度"""
        result = {
            'functions_planned': 0,
            'functions_implemented': 0
        }

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # 提取计划的函数
            planned_functions = self.extract_planned_functions(impl_plan, task_id, file_path)
            result['functions_planned'] = len(planned_functions)

            # 统计已实现的函数
            implemented_count = 0
            for func_name in planned_functions:
                if self.is_function_implemented(content, func_name):
                    implemented_count += 1

            result['functions_implemented'] = implemented_count

        except Exception as e:
            logger.warning(f"文件分析失败 {file_path}: {e}")

        return result

    def extract_planned_functions(self, impl_plan, task_id, file_path):
        """提取计划实现的函数"""
        functions = []
        lines = impl_plan.split('\n')

        # 查找任务相关的函数定义
        for line in lines:
            if file_path in line:
                import re
                func_matches = re.findall(r'`(\w+)\(`', line)
                functions.extend(func_matches)

        return functions

    def is_function_implemented(self, content, func_name):
        """检查函数是否已实现"""
        import re

        patterns = [
            rf'function\s+{func_name}\s*\(',
            rf'const\s+{func_name}\s*=',
            rf'def\s+{func_name}\s*\(',
            rf'{func_name}\s*:\s*function',
            rf'{func_name}\s*=>\s*'
        ]

        for pattern in patterns:
            if re.search(pattern, content):
                return True

        return False

    def get_test_metrics(self):
        """获取测试指标"""
        metrics_file = Path(".claude/cache/test_metrics.json")
        if metrics_file.exists():
            try:
                with open(metrics_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        return None

    def calculate_confidence(self, progress_data):
        """计算置信度"""
        confidence = 0.5

        # 基于数据完整性调整
        if progress_data['files_implemented'] > 0:
            confidence += 0.2

        if progress_data['functions_implemented'] > 0:
            confidence += 0.2

        if progress_data.get('test_coverage', 0) > 0:
            confidence += 0.1

        return min(1.0, confidence)

    def update_task_progress(self, req_id, task_id, progress_data, trigger_type):
        """更新任务进度"""
        status_file = Path(f".claude/docs/requirements/{req_id}/tasks/{task_id}_status.json")

        # 读取现有状态
        current_status = {}
        if status_file.exists():
            try:
                with open(status_file, 'r', encoding='utf-8') as f:
                    current_status = json.load(f)
            except:
                pass

        # 计算新状态
        new_progress = round(progress_data['progress'], 1)
        old_progress = current_status.get('progress', 0)

        # 只有进度变化超过阈值才更新
        if abs(new_progress - old_progress) < self.config["autoUpdateThreshold"] * 100:
            return

        # 确定新状态
        if new_progress >= 100:
            new_status = 'completed'
        elif new_progress >= 90:
            new_status = 'review'
        elif new_progress > 0:
            new_status = 'in_progress'
        else:
            new_status = current_status.get('status', 'planning')

        # 更新状态
        updated_status = {
            **current_status,
            'progress': new_progress,
            'status': new_status,
            'lastUpdated': datetime.now().isoformat(),
            'updatedBy': 'progress_monitor',
            'updateMethod': trigger_type,
            'autoDetection': progress_data
        }

        # 添加里程碑
        milestones = current_status.get('milestones', [])
        milestones.append({
            'timestamp': datetime.now().isoformat(),
            'status': new_status,
            'progress': new_progress,
            'comment': f'自动监控更新 ({trigger_type})',
            'confidence': progress_data.get('confidence', 0)
        })

        # 限制里程碑数量
        updated_status['milestones'] = milestones[-20:]

        # 保存状态
        status_file.parent.mkdir(parents=True, exist_ok=True)
        with open(status_file, 'w', encoding='utf-8') as f:
            json.dump(updated_status, f, indent=2, ensure_ascii=False)

        logger.info(f"任务进度已更新: {req_id}>{task_id} {old_progress}% → {new_progress}%")

        # 更新需求整体进度
        self.update_requirement_progress(req_id)

    def update_requirement_progress(self, req_id):
        """更新需求整体进度"""
        tasks_dir = Path(f".claude/docs/requirements/{req_id}/tasks")
        if not tasks_dir.exists():
            return

        total_progress = 0
        task_count = 0
        completed_tasks = 0

        for status_file in tasks_dir.glob("*_status.json"):
            try:
                with open(status_file, 'r', encoding='utf-8') as f:
                    status = json.load(f)

                progress = status.get('progress', 0)
                total_progress += progress
                task_count += 1

                if status.get('status') == 'completed':
                    completed_tasks += 1

            except:
                continue

        if task_count == 0:
            return

        overall_progress = total_progress / task_count

        # 更新需求状态
        req_status_file = Path(f".claude/docs/requirements/{req_id}/requirement_status.json")

        req_status = {
            'reqId': req_id,
            'overallProgress': round(overall_progress, 1),
            'completedTasks': completed_tasks,
            'totalTasks': task_count,
            'lastUpdated': datetime.now().isoformat(),
            'updatedBy': 'progress_monitor'
        }

        if completed_tasks == task_count:
            req_status['status'] = 'completed'
        elif overall_progress >= 90:
            req_status['status'] = 'review'
        elif overall_progress > 0:
            req_status['status'] = 'in_progress'
        else:
            req_status['status'] = 'planning'

        with open(req_status_file, 'w', encoding='utf-8') as f:
            json.dump(req_status, f, indent=2, ensure_ascii=False)

    def check_stale_tasks(self):
        """检查长时间未更新的任务"""
        stale_threshold = timedelta(hours=2)
        now = datetime.now()

        for req_id, req_info in self.active_requirements.items():
            for task in req_info['current_tasks']:
                last_update = datetime.fromisoformat(task['status'].get('lastUpdated', now.isoformat()))

                if now - last_update > stale_threshold:
                    task_id = task['task_id']
                    logger.warning(f"任务长时间未更新: {req_id}>{task_id} (上次更新: {last_update})")

                    # 尝试自动更新
                    self.trigger_progress_update(req_id, task_id, 'stale_check')

    def generate_monitoring_report(self):
        """生成监控报告"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'active_requirements': len(self.active_requirements),
            'total_tasks': sum(len(req['current_tasks']) for req in self.active_requirements.values()),
            'monitoring_status': 'active' if self.running else 'stopped'
        }

        report_file = Path(".claude/cache/monitoring_report.json")
        report_file.parent.mkdir(exist_ok=True)

        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

    def stop(self):
        """停止监控服务"""
        logger.info("停止进度监控服务")
        self.running = False

        if self.observer:
            self.observer.stop()
            self.observer.join()

        if self.git_monitor_thread:
            self.git_monitor_thread.join(timeout=5)

        if self.test_monitor_thread:
            self.test_monitor_thread.join(timeout=5)

        logger.info("监控服务已停止")


class CodeChangeHandler(FileSystemEventHandler):
    """文件变更处理器"""

    def __init__(self, monitor):
        self.monitor = monitor

    def on_modified(self, event):
        if event.is_directory:
            return

        file_path = event.src_path

        # 检查是否为监控的文件类型
        if self.should_monitor_file(file_path):
            logger.debug(f"文件变更: {file_path}")
            self.handle_file_change(file_path)

    def should_monitor_file(self, file_path):
        """判断是否应该监控该文件"""
        # 排除模式
        exclude_patterns = self.monitor.config["excludePatterns"]
        for pattern in exclude_patterns:
            if pattern.replace('*', '') in file_path:
                return False

        # 源代码文件
        code_extensions = ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.go', '.rs']
        return any(file_path.endswith(ext) for ext in code_extensions)

    def handle_file_change(self, file_path):
        """处理文件变更"""
        try:
            # 查找相关的需求和任务
            req_task = self.find_related_requirement_task(file_path)
            if req_task:
                req_id, task_id = req_task
                self.monitor.trigger_progress_update(req_id, task_id, 'file_change')

        except Exception as e:
            logger.error(f"处理文件变更失败 {file_path}: {e}")

    def find_related_requirement_task(self, file_path):
        """查找文件相关的需求和任务"""
        # 遍历活跃需求，查找包含该文件的实现计划
        for req_id in self.monitor.active_requirements:
            impl_plan_path = f".claude/docs/requirements/{req_id}/tasks/"

            if os.path.exists(impl_plan_path):
                try:
                    with open(impl_plan_path, 'r', encoding='utf-8') as f:
                        plan_content = f.read()

                    if os.path.basename(file_path) in plan_content:
                        # 查找包含此文件的任务
                        task_id = self.find_task_for_file(plan_content, file_path)
                        if task_id:
                            return req_id, task_id

                except Exception as e:
                    logger.warning(f"读取实现计划失败 {impl_plan_path}: {e}")

        return None

    def find_task_for_file(self, plan_content, file_path):
        """在实现计划中查找包含指定文件的任务"""
        import re

        lines = plan_content.split('\n')
        current_task = None
        file_basename = os.path.basename(file_path)

        for line in lines:
            if re.match(r'###?\s+TASK_\d+', line):
                task_match = re.search(r'(TASK_\d+)', line)
                if task_match:
                    current_task = task_match.group(1)
            elif current_task and file_basename in line:
                return current_task

        return None


def main():
    """主函数"""
    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == 'start':
            monitor = ProgressMonitor()
            monitor.start()
        elif command == 'stop':
            # 实现停止逻辑
            print("停止监控服务")
        elif command == 'status':
            # 显示监控状态
            print("监控服务状态")
        else:
            print("使用方法: python progress-monitor.py [start|stop|status]")
    else:
        print("CC-DevFlow 进度监控服务")
        print("使用方法: python progress-monitor.py [start|stop|status]")


if __name__ == "__main__":
    main()