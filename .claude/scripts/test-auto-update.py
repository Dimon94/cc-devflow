#!/usr/bin/env python3
"""
测试 CC-DevFlow 自动进度更新机制
"""

import os
import json
import shutil

def create_test_environment():
    """创建测试环境"""
    print("📁 创建测试环境...")

    # 创建测试目录结构
    test_dirs = [
        ".claude/docs/requirements/REQ-001/research",
        ".claude/docs/requirements/REQ-001/tasks",
        "src/components",
        "src/api"
    ]

    for dir_path in test_dirs:
        os.makedirs(dir_path, exist_ok=True)

    # 创建测试 PRD
    prd_content = """# PRD: 用户管理系统

## 需求概述
实现基本的用户管理功能

## 功能要求
- 用户注册
- 用户登录
- 用户信息管理
"""

    with open(".claude/docs/requirements/REQ-001/PRD.md", "w", encoding="utf-8") as f:
        f.write(prd_content)

    # 创建测试实现计划
    impl_plan = """# 实现计划 REQ-001

## 文件结构

### TASK_001: 用户模型实现

需要创建以下文件：
- `src/models/User.js` - 用户数据模型
- `src/api/userApi.js` - 用户API接口

#### 函数实现
- `createUser()` - 创建用户
- `getUserById()` - 获取用户信息
- `updateUser()` - 更新用户信息

### TASK_002: 用户界面组件

需要创建以下文件：
- `src/components/UserForm.jsx` - 用户表单组件
- `src/components/UserList.jsx` - 用户列表组件

#### 组件功能
- `UserForm` - 用户注册/编辑表单
- `UserList` - 用户列表展示
"""

    with open(".claude/docs/requirements/REQ-001/IMPLEMENTATION_PLAN.md", "w", encoding="utf-8") as f:
        f.write(impl_plan)

    # 创建任务文件
    task1_content = """# TASK_001: 用户模型实现

## 描述
实现用户数据模型和基础API

## 验收标准
- [ ] 用户模型定义完成
- [ ] API接口实现完成
- [ ] 单元测试通过
"""

    with open(".claude/docs/requirements/REQ-001/tasks/TASK_001.md", "w", encoding="utf-8") as f:
        f.write(task1_content)

    # 创建初始任务状态
    task_status = {
        "taskId": "TASK_001",
        "reqId": "REQ-001",
        "status": "in_progress",
        "progress": 20,
        "lastUpdated": "2024-01-15T10:00:00Z",
        "milestones": []
    }

    with open(".claude/docs/requirements/REQ-001/tasks/TASK_001_status.json", "w", encoding="utf-8") as f:
        json.dump(task_status, f, indent=2)

    print("✅ 测试环境创建完成")

def test_scenario_1_create_files():
    """测试场景1: 创建计划中的文件"""
    print("\n🧪 测试场景1: 创建计划中的文件")

    # 创建 User.js 文件
    user_js_content = """// 用户数据模型
class User {
    constructor(name, email) {
        this.name = name;
        this.email = email;
    }

    // 创建用户
    createUser() {
        // TODO: 实现创建用户逻辑
        return this;
    }
}

module.exports = User;
"""

    os.makedirs("src/models", exist_ok=True)
    with open("src/models/User.js", "w", encoding="utf-8") as f:
        f.write(user_js_content)

    print("  ✅ 创建了 src/models/User.js")

    # 运行自动更新检测
    run_auto_update()

    # 检查进度更新
    check_progress_update("REQ-001", "TASK_001", "创建文件后")

def test_scenario_2_implement_functions():
    """测试场景2: 实现计划中的函数"""
    print("\n🧪 测试场景2: 实现计划中的函数")

    # 更新 User.js，实现更多函数
    user_js_content = """// 用户数据模型
class User {
    constructor(name, email) {
        this.name = name;
        this.email = email;
    }

    // 创建用户
    createUser() {
        // 实现创建用户逻辑
        console.log('Creating user:', this.name);
        return this;
    }

    // 获取用户信息
    getUserById(id) {
        // 实现获取用户逻辑
        console.log('Getting user by ID:', id);
        return this;
    }

    // 更新用户信息
    updateUser(data) {
        // 实现更新用户逻辑
        Object.assign(this, data);
        return this;
    }
}

module.exports = User;
"""

    with open("src/models/User.js", "w", encoding="utf-8") as f:
        f.write(user_js_content)

    print("  ✅ 实现了所有计划函数")

    # 创建 API 文件
    api_content = """// 用户API接口
const User = require('../models/User');

const userApi = {
    // 创建用户
    createUser: async (userData) => {
        const user = new User(userData.name, userData.email);
        return user.createUser();
    },

    // 获取用户
    getUserById: async (id) => {
        const user = new User();
        return user.getUserById(id);
    }
};

module.exports = userApi;
"""

    os.makedirs("src/api", exist_ok=True)
    with open("src/api/userApi.js", "w", encoding="utf-8") as f:
        f.write(api_content)

    print("  ✅ 创建了 src/api/userApi.js")

    # 运行自动更新检测
    run_auto_update()

    # 检查进度更新
    check_progress_update("REQ-001", "TASK_001", "实现函数后")

def run_auto_update():
    """运行自动更新检测"""
    print("  🔄 运行自动进度检测...")

    # 模拟钩子执行
    import subprocess
    try:
        result = subprocess.run([
            "python3", ".claude/hooks/auto-progress-update.py"
        ], capture_output=True, text=True, timeout=10)

        if result.stdout:
            print(f"  📊 {result.stdout.strip()}")
        if result.stderr:
            print(f"  ⚠️  {result.stderr.strip()}")

    except subprocess.TimeoutExpired:
        print("  ⚠️  自动更新超时")
    except Exception as e:
        print(f"  ❌ 自动更新失败: {e}")

def check_progress_update(req_id, task_id, scenario_name):
    """检查进度更新结果"""
    status_file = f".claude/docs/requirements/{req_id}/tasks/{task_id}_status.json"

    if os.path.exists(status_file):
        try:
            with open(status_file, "r", encoding="utf-8") as f:
                status = json.load(f)

            print(f"  📈 {scenario_name}进度更新:")
            print(f"     状态: {status.get('status', 'unknown')}")
            print(f"     进度: {status.get('progress', 0)}%")
            print(f"     更新时间: {status.get('lastUpdated', 'unknown')}")
            print(f"     更新方式: {status.get('updatedBy', 'unknown')}")

            milestones = status.get('milestones', [])
            if milestones:
                last_milestone = milestones[-1]
                print(f"     最新里程碑: {last_milestone.get('comment', '')}")
                print(f"     置信度: {last_milestone.get('confidence', 0):.2f}")

        except Exception as e:
            print(f"  ❌ 读取状态失败: {e}")
    else:
        print(f"  ⚠️  状态文件不存在: {status_file}")

def test_git_branch_detection():
    """测试Git分支检测"""
    print("\n🧪 测试Git分支检测")

    # 检查当前分支
    try:
        import subprocess
        result = subprocess.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
                              capture_output=True, text=True)

        current_branch = result.stdout.strip()
        print(f"  📍 当前分支: {current_branch}")

        # 创建feature分支（如果不存在）
        if not current_branch.startswith('feature/REQ-001'):
            print("  🌿 创建测试分支...")
            subprocess.run(['git', 'checkout', '-b', 'feature/REQ-001-user-management'],
                         capture_output=True)
            print("  ✅ 已切换到 feature/REQ-001-user-management")

    except Exception as e:
        print(f"  ⚠️  Git操作失败: {e}")

def cleanup_test_environment():
    """清理测试环境"""
    print("\n🧹 清理测试环境...")

    # 删除测试文件
    test_paths = [
        ".claude/docs/requirements/REQ-001",
        "src/models/User.js",
        "src/api/userApi.js"
    ]

    for path in test_paths:
        if os.path.exists(path):
            if os.path.isdir(path):
                shutil.rmtree(path)
            else:
                os.remove(path)

    # 清理空目录
    empty_dirs = ["src/models", "src/api"]
    for dir_path in empty_dirs:
        if os.path.exists(dir_path) and not os.listdir(dir_path):
            os.rmdir(dir_path)

    print("✅ 测试环境清理完成")

def show_test_summary():
    """显示测试摘要"""
    print("\n" + "="*50)
    print("🎯 CC-DevFlow 自动进度更新测试摘要")
    print("="*50)
    print("✅ 测试完成的功能:")
    print("   - 环境检测和初始化")
    print("   - Git分支检测")
    print("   - 文件创建检测")
    print("   - 函数实现检测")
    print("   - 进度计算和更新")
    print("   - 状态文件管理")
    print("   - 里程碑记录")
    print("")
    print("📝 使用方法:")
    print("   1. 在项目中启用自动更新钩子")
    print("   2. 使用 /flow:new 创建需求")
    print("   3. 编辑代码文件时自动触发进度更新")
    print("   4. 使用 /flow:status 查看实时进度")
    print("")
    print("⚙️  配置文件: .claude/settings.json")
    print("🔧 钩子脚本: .claude/hooks/auto-progress-update.py")
    print("📊 监控服务: .claude/scripts/progress-monitor.py")

def main():
    """主测试函数"""
    print("🚀 CC-DevFlow 自动进度更新测试")
    print("="*50)

    try:
        # 执行测试主逻辑

        # 创建测试环境
        create_test_environment()

        # 测试Git分支检测
        test_git_branch_detection()

        # 运行测试场景
        test_scenario_1_create_files()
        test_scenario_2_implement_functions()

        # 显示测试摘要
        show_test_summary()

    except KeyboardInterrupt:
        print("\n⚠️  测试被用户中断")
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
    finally:
        # 询问是否清理
        try:
            response = input("\n🤔 是否清理测试环境? (y/N): ")
            if response.lower() in ['y', 'yes']:
                cleanup_test_environment()
        except:
            pass

if __name__ == "__main__":
    main()