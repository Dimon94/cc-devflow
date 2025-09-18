#!/usr/bin/env python3
"""
CC-DevFlow 完整功能演示
展示从需求创建到代码交付的完整流程
"""

import os
import json
import time
import subprocess
from datetime import datetime

class CCDevFlowDemo:
    """CC-DevFlow 演示类"""

    def __init__(self):
        self.demo_req_id = "REQ-DEMO"
        self.demo_title = "用户认证系统"
        self.demo_urls = "https://example.com/auth-spec"

    def print_step(self, step_num, title, description=""):
        """打印步骤信息"""
        print(f"\n{'='*60}")
        print(f"🎯 步骤 {step_num}: {title}")
        if description:
            print(f"   {description}")
        print('='*60)

    def print_info(self, message):
        """打印信息"""
        print(f"ℹ️  {message}")

    def print_success(self, message):
        """打印成功信息"""
        print(f"✅ {message}")

    def print_warning(self, message):
        """打印警告信息"""
        print(f"⚠️  {message}")

    def wait_for_user(self, message="按回车继续..."):
        """等待用户输入"""
        try:
            input(f"\n🤔 {message}")
        except KeyboardInterrupt:
            print("\n\n👋 演示被用户中断")
            exit(0)

    def create_demo_environment(self):
        """创建演示环境"""
        self.print_step(1, "环境准备", "创建演示所需的目录和文件")

        # 确保基础目录存在
        demo_dirs = [
            ".claude/docs/requirements",
            ".claude/logs",
            ".claude/cache",
            "src/auth",
            "src/components/auth",
            "tests/auth"
        ]

        for dir_path in demo_dirs:
            os.makedirs(dir_path, exist_ok=True)
            self.print_info(f"创建目录: {dir_path}")

        # 创建演示用的 package.json
        if not os.path.exists("package.json"):
            package_json = {
                "name": "cc-devflow-demo",
                "version": "1.0.0",
                "scripts": {
                    "dev": "echo 'Development server started'",
                    "test": "echo 'Running tests'",
                    "test:watch": "echo 'Running tests in watch mode'",
                    "typecheck": "echo 'TypeScript checking passed'"
                },
                "devDependencies": {
                    "typescript": "^5.0.0"
                }
            }

            with open("package.json", "w", encoding="utf-8") as f:
                json.dump(package_json, f, indent=2)

            self.print_success("创建了演示用的 package.json")

        self.print_success("演示环境准备完成")

    def demonstrate_flow_new(self):
        """演示 flow:new 命令"""
        self.print_step(2, "启动新需求流程", f"使用 /flow:new 创建需求 {self.demo_req_id}")

        # 模拟 flow:new 命令的效果
        self.simulate_flow_new()

        self.print_info("在实际使用中，您会运行:")
        print(f'   /flow:new "{self.demo_req_id}|{self.demo_title}|{self.demo_urls}"')

        self.wait_for_user("查看创建的文档结构")

    def simulate_flow_new(self):
        """模拟 flow:new 命令执行"""
        req_dir = f".claude/docs/requirements/{self.demo_req_id}"
        os.makedirs(f"{req_dir}/research", exist_ok=True)
        os.makedirs(f"{req_dir}/tasks", exist_ok=True)

        # 创建 PRD
        prd_content = f"""# 产品需求文档: {self.demo_title}

## 需求概述
实现完整的用户认证系统，包括注册、登录、密码重置等功能。

## 功能要求

### 核心功能
- 用户注册 (邮箱/用户名)
- 用户登录 (支持记住我)
- 密码重置 (邮箱验证)
- 会话管理
- 权限控制

### 非功能要求
- 安全性: 密码哈希、防CSRF
- 性能: 快速响应 (<200ms)
- 可扩展性: 支持OAuth集成

## 验收标准
- [ ] 用户可以成功注册账号
- [ ] 用户可以正常登录和退出
- [ ] 密码重置功能正常工作
- [ ] 安全测试通过
- [ ] 性能测试满足要求

## 技术栈
- 后端: Node.js + Express
- 前端: React + TypeScript
- 数据库: MongoDB
- 认证: JWT + bcrypt
"""

        with open(f"{req_dir}/PRD.md", "w", encoding="utf-8") as f:
            f.write(prd_content)

        # 创建 EPIC
        epic_content = f"""# Epic: {self.demo_title}

## Epic 概述
构建安全可靠的用户认证系统

## 任务分解

### TASK_001: 后端认证API
- 用户模型设计
- 认证中间件
- API端点实现
- 密码安全处理

### TASK_002: 前端认证界面
- 登录组件
- 注册组件
- 密码重置组件
- 状态管理

### TASK_003: 安全和测试
- 安全测试
- 单元测试
- 集成测试
- 性能测试

## 估算
- 总工时: 40小时
- 开发周期: 2周
- 风险评估: 中等
"""

        with open(f"{req_dir}/EPIC.md", "w", encoding="utf-8") as f:
            f.write(epic_content)

        # 创建任务文件
        tasks = [
            ("TASK_001", "后端认证API", "实现用户认证的后端服务"),
            ("TASK_002", "前端认证界面", "创建用户认证的前端界面"),
            ("TASK_003", "安全和测试", "确保系统安全性和质量")
        ]

        for task_id, title, description in tasks:
            task_content = f"""# {task_id}: {title}

## 描述
{description}

## 技术要求
- 遵循项目编码规范
- 编写单元测试
- 确保安全性

## 验收标准
- [ ] 功能实现完成
- [ ] 单元测试通过
- [ ] 代码审查通过
- [ ] 文档更新完成

## 估算
- 工时: 12-16小时
- 复杂度: 中等
"""

            with open(f"{req_dir}/tasks/{task_id}.md", "w", encoding="utf-8") as f:
                f.write(task_content)

            # 创建初始任务状态
            task_status = {
                "taskId": task_id,
                "reqId": self.demo_req_id,
                "status": "planning",
                "progress": 0,
                "lastUpdated": datetime.now().isoformat(),
                "milestones": []
            }

            with open(f"{req_dir}/tasks/{task_id}_status.json", "w", encoding="utf-8") as f:
                json.dump(task_status, f, indent=2)

        # 创建实现计划
        impl_plan = f"""# 实现计划: {self.demo_req_id}

## 概述
用户认证系统的详细实现计划

## 技术架构

### 后端结构
```
src/auth/
├── models/
│   └── User.js          # 用户数据模型
├── middleware/
│   └── authMiddleware.js # 认证中间件
├── controllers/
│   └── authController.js # 认证控制器
└── routes/
    └── authRoutes.js    # 认证路由
```

### 前端结构
```
src/components/auth/
├── LoginForm.tsx        # 登录表单组件
├── RegisterForm.tsx     # 注册表单组件
├── ResetPassword.tsx    # 密码重置组件
└── AuthProvider.tsx     # 认证状态提供者
```

## 实现步骤

### TASK_001: 后端认证API

#### 文件: src/auth/models/User.js
- `createUser()` - 创建新用户
- `validatePassword()` - 验证密码
- `generateToken()` - 生成JWT令牌

#### 文件: src/auth/controllers/authController.js
- `register()` - 用户注册
- `login()` - 用户登录
- `logout()` - 用户退出
- `resetPassword()` - 密码重置

### TASK_002: 前端认证界面

#### 文件: src/components/auth/LoginForm.tsx
- `LoginForm` - 登录表单组件
- `handleSubmit()` - 提交处理
- `validateForm()` - 表单验证

#### 文件: src/components/auth/AuthProvider.tsx
- `AuthProvider` - 认证状态管理
- `useAuth()` - 认证钩子

### TASK_003: 安全和测试

#### 测试文件
- `tests/auth/auth.test.js` - 认证功能测试
- `tests/auth/security.test.js` - 安全测试

## 依赖关系
- TASK_001 → TASK_002
- TASK_002 → TASK_003
"""

        with open(f"{req_dir}/IMPLEMENTATION_PLAN.md", "w", encoding="utf-8") as f:
            f.write(impl_plan)

        self.print_success(f"创建了需求文档结构: {req_dir}")

    def demonstrate_auto_update(self):
        """演示自动进度更新"""
        self.print_step(3, "自动进度更新演示", "展示代码变更如何触发进度自动更新")

        # 模拟开始第一个任务
        self.simulate_task_start("TASK_001")

        self.wait_for_user("观察任务状态变化")

        # 模拟代码实现过程
        self.simulate_code_implementation()

        self.wait_for_user("查看自动进度更新效果")

    def simulate_task_start(self, task_id):
        """模拟任务开始"""
        self.print_info(f"开始任务: {task_id}")

        # 更新任务状态为进行中
        status_file = f".claude/docs/requirements/{self.demo_req_id}/tasks/{task_id}_status.json"

        task_status = {
            "taskId": task_id,
            "reqId": self.demo_req_id,
            "status": "in_progress",
            "progress": 5,
            "lastUpdated": datetime.now().isoformat(),
            "milestones": [
                {
                    "timestamp": datetime.now().isoformat(),
                    "status": "in_progress",
                    "progress": 5,
                    "comment": "任务开始",
                    "confidence": 1.0
                }
            ]
        }

        with open(status_file, "w", encoding="utf-8") as f:
            json.dump(task_status, f, indent=2)

        self.print_success(f"任务 {task_id} 状态更新为: in_progress (5%)")

    def simulate_code_implementation(self):
        """模拟代码实现过程"""
        # 创建用户模型文件
        self.print_info("创建用户模型文件...")

        user_model_content = """// 用户数据模型
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class User {
    constructor(username, email, password) {
        this.username = username;
        this.email = email;
        this.passwordHash = null;
        this.createdAt = new Date();
    }

    // 创建用户
    async createUser() {
        this.passwordHash = await bcrypt.hash(this.password, 10);
        // 保存到数据库的逻辑
        return this;
    }
}

module.exports = User;
"""

        os.makedirs("src/auth/models", exist_ok=True)
        with open("src/auth/models/User.js", "w", encoding="utf-8") as f:
            f.write(user_model_content)

        self.print_success("创建 src/auth/models/User.js")

        # 模拟自动进度更新触发
        self.trigger_auto_update("文件创建")

        # 继续实现更多功能
        time.sleep(1)
        self.print_info("实现认证控制器...")

        auth_controller_content = """// 认证控制器
const User = require('../models/User');

class AuthController {
    // 用户注册
    async register(req, res) {
        try {
            const { username, email, password } = req.body;
            const user = new User(username, email, password);
            await user.createUser();

            res.status(201).json({ success: true, user: user });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // 用户登录
    async login(req, res) {
        try {
            const { email, password } = req.body;
            // 登录逻辑实现
            res.json({ success: true, token: 'jwt_token_here' });
        } catch (error) {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    }

    // 密码重置
    async resetPassword(req, res) {
        try {
            const { email } = req.body;
            // 密码重置逻辑
            res.json({ success: true, message: 'Reset email sent' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = new AuthController();
"""

        os.makedirs("src/auth/controllers", exist_ok=True)
        with open("src/auth/controllers/authController.js", "w", encoding="utf-8") as f:
            f.write(auth_controller_content)

        self.print_success("创建 src/auth/controllers/authController.js")

        # 再次触发自动更新
        self.trigger_auto_update("功能实现")

    def trigger_auto_update(self, trigger_reason):
        """触发自动进度更新"""
        self.print_info(f"触发自动进度更新 (原因: {trigger_reason})")

        try:
            # 运行自动更新检测
            result = subprocess.run([
                "python3", ".claude/hooks/auto-progress-update.py"
            ], capture_output=True, text=True, timeout=10)

            if result.returncode == 0:
                if result.stdout.strip():
                    print(f"   📊 {result.stdout.strip()}")
                else:
                    self.print_info("   自动更新静默执行 (无显著进度变化)")
            else:
                self.print_warning(f"   自动更新失败: {result.stderr}")

        except subprocess.TimeoutExpired:
            self.print_warning("   自动更新超时")
        except Exception as e:
            self.print_warning(f"   自动更新异常: {e}")

        # 显示当前任务状态
        self.show_current_status()

    def show_current_status(self):
        """显示当前任务状态"""
        status_file = f".claude/docs/requirements/{self.demo_req_id}/tasks/TASK_001_status.json"

        if os.path.exists(status_file):
            try:
                with open(status_file, "r", encoding="utf-8") as f:
                    status = json.load(f)

                print(f"   📈 当前状态: {status.get('status', 'unknown')}")
                print(f"   📊 进度: {status.get('progress', 0):.1f}%")
                print(f"   🕐 更新时间: {status.get('lastUpdated', 'unknown')}")

                milestones = status.get('milestones', [])
                if milestones:
                    last_milestone = milestones[-1]
                    print(f"   💭 最新记录: {last_milestone.get('comment', '')}")

            except Exception as e:
                self.print_warning(f"   读取状态失败: {e}")

    def demonstrate_flow_status(self):
        """演示 flow:status 命令"""
        self.print_step(4, "进度查询演示", "使用 /flow:status 查看开发进度")

        self.print_info("在实际使用中，您可以运行:")
        print("   /flow:status                 # 查看所有需求")
        print(f"   /flow:status {self.demo_req_id}         # 查看特定需求")
        print(f"   /flow:status --detailed {self.demo_req_id} # 详细报告")

        # 模拟状态输出
        self.simulate_status_output()

        self.wait_for_user("查看状态报告")

    def simulate_status_output(self):
        """模拟状态输出"""
        print("\n📊 模拟状态输出:")
        print("="*50)
        print(f"🔄 进行中的需求 (1个):")
        print("┌─────────────┬─────────────────┬──────────┬─────────────────┬────────┐")
        print("│ REQ-ID      │ 标题             │ 状态     │ 当前阶段         │ 进度   │")
        print("├─────────────┼─────────────────┼──────────┼─────────────────┼────────┤")
        print(f"│ {self.demo_req_id:<11} │ 用户认证系统      │ 开发阶段 │ 主代理执行中     │ 35%    │")
        print("└─────────────┴─────────────────┴──────────┴─────────────────┴────────┘")
        print("")
        print("📈 任务详情:")
        print("  ✅ TASK_001: 后端认证API (进行中 - 35%)")
        print("  ⏳ TASK_002: 前端认证界面 (计划中)")
        print("  ⏳ TASK_003: 安全和测试 (计划中)")

    def demonstrate_monitoring(self):
        """演示监控功能"""
        self.print_step(5, "监控服务演示", "展示后台监控和自动化功能")

        self.print_info("启动监控服务:")
        print("   .claude/scripts/start-monitor.sh start")

        self.print_info("监控功能包括:")
        print("   • 文件变更检测")
        print("   • Git提交监控")
        print("   • 测试结果跟踪")
        print("   • 自动进度计算")
        print("   • 风险预警")

        # 检查监控脚本是否存在
        monitor_script = ".claude/scripts/start-monitor.sh"
        if os.path.exists(monitor_script):
            self.print_success("监控脚本已就绪")
            self.print_info("您可以运行以下命令:")
            print(f"   {monitor_script} start     # 启动监控")
            print(f"   {monitor_script} status    # 查看状态")
            print(f"   {monitor_script} logs      # 查看日志")
        else:
            self.print_warning("监控脚本未找到")

        self.wait_for_user("了解监控功能")

    def demonstrate_commands(self):
        """演示所有命令"""
        self.print_step(6, "命令总览", "cc-devflow 所有可用命令")

        commands = [
            ("/flow:new", "启动新需求开发流程", 'REQ-123|标题|URL'),
            ("/flow:status", "查看开发进度状态", '[REQ-ID] [--detailed]'),
            ("/flow:restart", "重启中断的开发流程", 'REQ-ID [--from=STAGE]'),
            ("/flow:update", "手动更新任务进度", 'REQ-ID TASK-ID [OPTIONS]'),
            ("/flow:sprint", "冲刺管理和跟踪", '[ACTION] [OPTIONS]'),
        ]

        print("\n📋 命令列表:")
        print("─" * 80)

        for cmd, desc, usage in commands:
            print(f"🔧 {cmd:<15} {desc}")
            print(f"   用法: {cmd} \"{usage}\"")
            print()

        self.wait_for_user("查看命令说明")

    def cleanup_demo(self):
        """清理演示环境"""
        self.print_step(7, "清理演示环境", "删除演示创建的文件")

        cleanup_paths = [
            f".claude/docs/requirements/{self.demo_req_id}",
            "src/auth",
            "package.json" if self.is_demo_package() else None
        ]

        for path in cleanup_paths:
            if path and os.path.exists(path):
                if os.path.isdir(path):
                    shutil.rmtree(path)
                    self.print_info(f"删除目录: {path}")
                else:
                    os.remove(path)
                    self.print_info(f"删除文件: {path}")

        # 清理空目录
        empty_dirs = ["src"]
        for dir_path in empty_dirs:
            if os.path.exists(dir_path) and not os.listdir(dir_path):
                os.rmdir(dir_path)
                self.print_info(f"删除空目录: {dir_path}")

        self.print_success("演示环境清理完成")

    def is_demo_package(self):
        """检查是否是演示创建的package.json"""
        if os.path.exists("package.json"):
            try:
                with open("package.json", "r", encoding="utf-8") as f:
                    package = json.load(f)
                return package.get("name") == "cc-devflow-demo"
            except:
                pass
        return False

    def show_summary(self):
        """显示演示总结"""
        print("\n" + "="*70)
        print("🎯 CC-DevFlow 演示总结")
        print("="*70)

        print("✅ 演示完成的功能:")
        print("   1. 需求流程创建 (/flow:new)")
        print("   2. 自动进度更新 (基于代码变更)")
        print("   3. 进度查询 (/flow:status)")
        print("   4. 监控服务 (后台自动化)")
        print("   5. 命令系统 (完整工具链)")

        print("\n🔧 核心特性:")
        print("   • 研究型子代理 + 主代理执行")
        print("   • 智能进度检测和更新")
        print("   • Git分支自动管理")
        print("   • 实时状态监控")
        print("   • 质量门禁控制")

        print("\n📚 下一步:")
        print("   1. 阅读完整文档: README.md")
        print("   2. 配置您的项目设置")
        print("   3. 开始第一个真实需求")
        print("   4. 体验完整开发流程")

        print("\n🔗 相关资源:")
        print("   • 项目仓库: https://github.com/Dimon94/cc-devflow")
        print("   • Claude Code: https://claude.ai/code")
        print("   • 问题反馈: https://github.com/Dimon94/cc-devflow/issues")

    def run(self):
        """运行完整演示"""
        print("🚀 欢迎使用 CC-DevFlow 完整功能演示!")
        print("   这个演示将展示从需求创建到代码交付的完整流程")

        try:
            # 演示步骤
            self.create_demo_environment()
            self.demonstrate_flow_new()
            self.demonstrate_auto_update()
            self.demonstrate_flow_status()
            self.demonstrate_monitoring()
            self.demonstrate_commands()

            # 显示总结
            self.show_summary()

        except KeyboardInterrupt:
            print("\n\n👋 演示被用户中断")
        except Exception as e:
            print(f"\n❌ 演示过程中发生错误: {e}")
        finally:
            # 询问是否清理
            try:
                response = input("\n🤔 是否清理演示环境? (y/N): ")
                if response.lower() in ['y', 'yes']:
                    self.cleanup_demo()
                else:
                    self.print_info("保留演示环境，您可以继续探索")
            except:
                pass

            print("\n🎉 感谢体验 CC-DevFlow!")

def main():
    """主函数"""
    demo = CCDevFlowDemo()
    demo.run()

if __name__ == "__main__":
    main()