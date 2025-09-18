#!/usr/bin/env python3
"""
CC-DevFlow 自动进度更新钩子
在代码编辑、文件写入和命令执行后自动检测和更新任务进度
"""

import os
import json
import subprocess
import re
from datetime import datetime

def should_update_progress():
    """判断是否需要更新进度"""
    # 检查是否在 cc-devflow 项目中
    if not os.path.exists('.claude/docs'):
        return False

    # 检查是否有活跃的需求
    requirements_dir = Path('.claude/docs/requirements')
    if not requirements_dir.exists():
        return False

    return True

def detect_current_task():
    """检测当前正在工作的任务"""

    # 1. 从Git分支名推断
    try:
        branch_name = subprocess.check_output(['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
                                            text=True).strip()

        # 匹配 feature/REQ-123-title 格式
        match = re.match(r'feature/(REQ-\d+)', branch_name)
        if match:
            req_id = match.group(1)

            # 检查当前进行中的任务
            current_task = find_current_task(req_id)
            if current_task:
                return req_id, current_task

    except subprocess.CalledProcessError:
        pass

    return None, None

def find_current_task(req_id):
    """查找需求下当前进行中的任务"""

    tasks_dir = f".claude/docs/requirements/{req_id}/tasks"
    if not os.path.exists(tasks_dir):
        return None

    # 查找进行中的任务
    for file_name in os.listdir(tasks_dir):
        if file_name.endswith('_status.json'):
            task_id = file_name.replace('_status.json', '')
            status_file = os.path.join(tasks_dir, file_name)

            try:
                with open(status_file, 'r', encoding='utf-8') as f:
                    status = json.load(f)

                if status.get('status') == 'in_progress':
                    return task_id
            except:
                continue

    # 如果没有进行中的任务，返回第一个未完成的任务
    task_files = [f for f in os.listdir(tasks_dir) if f.startswith('TASK_') and f.endswith('.md')]
    task_files.sort()

    for task_file in task_files:
        task_id = task_file.replace('.md', '')
        status_file = os.path.join(tasks_dir, f"{task_id}_status.json")

        if os.path.exists(status_file):
            try:
                with open(status_file, 'r', encoding='utf-8') as f:
                    status = json.load(f)

                if status.get('status') not in ['completed', 'cancelled']:
                    return task_id
            except:
                continue
        else:
            # 没有状态文件，说明是新任务
            return task_id

    return None

def analyze_code_progress(req_id, task_id):
    """分析代码进度"""

    # 读取实现计划
    impl_plan_path = f".claude/docs/requirements/{req_id}/IMPLEMENTATION_PLAN.md"
    if not os.path.exists(impl_plan_path):
        return None

    with open(impl_plan_path, 'r', encoding='utf-8') as f:
        impl_plan = f.read()

    # 提取任务相关的文件列表
    task_files = extract_task_files_from_plan(impl_plan, task_id)

    if not task_files:
        return None

    # 分析代码完成度
    progress_data = {
        'files_planned': len(task_files),
        'files_created': 0,
        'functions_planned': 0,
        'functions_implemented': 0,
        'lines_added': 0,
        'test_coverage': 0
    }

    for planned_file in task_files:
        if os.path.exists(planned_file):
            progress_data['files_created'] += 1

            # 分析函数实现度
            planned_functions = extract_planned_functions(impl_plan, task_id, planned_file)
            implemented_functions = count_implemented_functions(planned_file)

            progress_data['functions_planned'] += len(planned_functions)
            progress_data['functions_implemented'] += implemented_functions

            # 统计代码行数
            with open(planned_file, 'r', encoding='utf-8') as f:
                progress_data['lines_added'] += len(f.readlines())

    # 计算整体进度
    if progress_data['files_planned'] > 0:
        file_progress = progress_data['files_created'] / progress_data['files_planned']
    else:
        file_progress = 0

    if progress_data['functions_planned'] > 0:
        function_progress = progress_data['functions_implemented'] / progress_data['functions_planned']
    else:
        function_progress = 1.0  # 没有规划函数时认为已完成

    # 加权计算总进度
    overall_progress = (file_progress * 0.4 + function_progress * 0.6) * 100

    return {
        'progress': min(100, max(0, overall_progress)),
        'details': progress_data,
        'confidence': calculate_confidence(progress_data)
    }

def extract_task_files_from_plan(impl_plan, task_id):
    """从实现计划中提取任务相关文件"""
    files = []
    lines = impl_plan.split('\n')

    in_task_section = False
    for line in lines:
        if f"### {task_id}" in line or f"## {task_id}" in line:
            in_task_section = True
            continue
        elif line.startswith('###') or line.startswith('##'):
            in_task_section = False
            continue

        if in_task_section and ('src/' in line or 'components/' in line):
            # 提取文件路径
            matches = re.findall(r'`([^`]+\.(js|ts|tsx|jsx|py|java|go|rs|cpp|c|h))`', line)
            for match in matches:
                files.append(match[0])

    return files

def extract_planned_functions(impl_plan, task_id, file_path):
    """提取计划实现的函数列表"""
    functions = []
    lines = impl_plan.split('\n')

    for line in lines:
        if file_path in line:
            # 查找函数定义模式
            func_matches = re.findall(r'`(\w+)\(`', line)
            functions.extend(func_matches)

    return functions

def count_implemented_functions(file_path):
    """统计已实现的函数数量"""
    if not os.path.exists(file_path):
        return 0

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 简化实现：统计函数定义
        # JavaScript/TypeScript 函数
        js_functions = len(re.findall(r'function\s+\w+\s*\(|const\s+\w+\s*=\s*\(.*?\)\s*=>', content))

        # Python 函数
        py_functions = len(re.findall(r'def\s+\w+\s*\(', content))

        return js_functions + py_functions

    except:
        return 0

def calculate_confidence(progress_data):
    """计算进度检测的置信度"""
    confidence = 0.5  # 基础置信度

    # 根据数据完整性调整置信度
    if progress_data['files_created'] > 0:
        confidence += 0.2

    if progress_data['functions_implemented'] > 0:
        confidence += 0.2

    if progress_data.get('test_coverage', 0) > 0:
        confidence += 0.1

    return min(1.0, confidence)

def update_task_progress_auto(req_id, task_id, progress_data):
    """自动更新任务进度"""

    status_file = f".claude/docs/requirements/{req_id}/tasks/{task_id}_status.json"

    # 读取现有状态
    current_status = {}
    if os.path.exists(status_file):
        try:
            with open(status_file, 'r', encoding='utf-8') as f:
                current_status = json.load(f)
        except:
            pass

    # 确定新的状态
    new_progress = progress_data['progress']
    old_progress = current_status.get('progress', 0)

    # 只有进度变化超过5%才更新
    if abs(new_progress - old_progress) < 5:
        return current_status

    if new_progress >= 100:
        new_status = 'completed'
    elif new_progress >= 90:
        new_status = 'review'
    elif new_progress > 0:
        new_status = 'in_progress'
    else:
        new_status = current_status.get('status', 'planning')

    # 构建新状态
    updated_status = {
        'taskId': task_id,
        'reqId': req_id,
        'status': new_status,
        'progress': round(new_progress, 1),
        'lastUpdated': datetime.now().isoformat(),
        'updatedBy': 'auto_hook',
        'updateMethod': 'code_analysis',
        'autoDetection': progress_data,
        'milestones': current_status.get('milestones', [])
    }

    # 添加里程碑记录
    if (current_status.get('progress', 0) != new_progress or
        current_status.get('status') != new_status):

        milestone = {
            'timestamp': datetime.now().isoformat(),
            'status': new_status,
            'progress': new_progress,
            'comment': f'自动检测: 代码变更',
            'confidence': progress_data.get('confidence', 0.8)
        }

        updated_status['milestones'].append(milestone)

        # 限制里程碑数量
        if len(updated_status['milestones']) > 20:
            updated_status['milestones'] = updated_status['milestones'][-20:]

    # 保存状态文件
    os.makedirs(os.path.dirname(status_file), exist_ok=True)
    with open(status_file, 'w', encoding='utf-8') as f:
        json.dump(updated_status, f, indent=2, ensure_ascii=False)

    return updated_status

def update_requirement_overall_progress(req_id):
    """更新需求整体进度"""

    tasks_dir = f".claude/docs/requirements/{req_id}/tasks"
    if not os.path.exists(tasks_dir):
        return

    # 收集所有任务状态
    total_progress = 0
    task_count = 0
    completed_tasks = 0

    for file_name in os.listdir(tasks_dir):
        if file_name.endswith('_status.json'):
            status_file = os.path.join(tasks_dir, file_name)

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

    # 计算整体进度
    overall_progress = total_progress / task_count

    # 更新需求状态
    req_status_file = f".claude/docs/requirements/{req_id}/requirement_status.json"

    req_status = {
        'reqId': req_id,
        'overallProgress': round(overall_progress, 1),
        'completedTasks': completed_tasks,
        'totalTasks': task_count,
        'lastUpdated': datetime.now().isoformat(),
        'updatedBy': 'auto_hook'
    }

    # 确定需求状态
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

def main():
    """钩子主执行函数"""

    try:
        # 检查是否需要更新进度
        if not should_update_progress():
            return

        # 检测当前任务
        req_id, task_id = detect_current_task()
        if not req_id or not task_id:
            return

        # 分析代码进度
        progress_data = analyze_code_progress(req_id, task_id)

        if not progress_data:
            return

        # 只有置信度足够高才更新
        if progress_data.get('confidence', 0) < 0.7:
            return

        # 读取当前状态用于比较
        status_file = f".claude/docs/requirements/{req_id}/tasks/{task_id}_status.json"
        old_status = {}
        if os.path.exists(status_file):
            try:
                with open(status_file, 'r', encoding='utf-8') as f:
                    old_status = json.load(f)
            except:
                pass

        # 更新任务进度
        new_status = update_task_progress_auto(req_id, task_id, progress_data)

        # 更新需求整体进度
        update_requirement_overall_progress(req_id)

        # 输出更新信息
        progress_change = new_status['progress'] - old_status.get('progress', 0)
        if abs(progress_change) >= 5:  # 进度变化大于5%才显示
            print(f"📊 进度自动更新: {req_id} > {task_id}")
            print(f"   状态: {old_status.get('status', 'unknown')} → {new_status['status']}")
            print(f"   进度: {old_status.get('progress', 0):.1f}% → {new_status['progress']:.1f}%")
            print(f"   置信度: {progress_data.get('confidence', 0):.2f}")

    except Exception as e:
        # 静默失败，避免干扰主工作流
        pass

if __name__ == "__main__":
    main()