# 智能仓储 Agent 系统（前端）

基于 Vue 3 + Vite + TailwindCSS 的智能粮库仓储管理系统前端界面。

## 功能特性

- **智能对话**：与仓储 Agent 进行自然语言交互
- **对话历史**：保存和管理历史对话记录
- **快捷命令**：一键发送常用查询指令
- **仓库监控**：实时展示仓库温湿度、状态等数据
- **视频监控**：模拟摄像头视频画面展示
- **暗色主题**：支持明亮/暗黑主题切换
- **用户认证**：安全的登录验证机制
- **响应式设计**：适配不同屏幕尺寸

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.4.0 | 前端框架 |
| Vite | 5.0.10 | 构建工具 |
| TailwindCSS | 3.4.0 | CSS 框架 |
| Element Plus | 2.4.4 | UI 组件库 |
| Vue Router | 4.2.5 | 路由管理 |
| Axios | 1.6.0 | HTTP 客户端 |
| Marked | 11.0.0 | Markdown 解析 |

## 项目结构

```
src/
├── main.js                 # 入口文件
├── App.vue                 # 主应用组件
├── RootApp.vue             # 根应用（含导航栏）
├── style.css               # 全局样式
├── api/
│   └── index.js            # API 接口封装
├── router/
│   └── index.js            # 路由配置
├── components/
│   ├── ChatPanel.vue       # 聊天面板组件
│   └── StatusPanel.vue     # 状态监控面板
├── views/
│   └── Login.vue           # 登录页面
└── assets/                 # 静态资源
```

## 快速开始

### 1. 环境要求

- Node.js 18+
- npm 或 pnpm

### 2. 安装依赖

```bash
npm install
```

### 3. 配置后端地址

在 `src/api/index.js` 中配置后端 API 地址（默认已配置）：

```javascript
const BASE_URL = 'http://localhost:8088'
```

### 4. 启动开发服务

```bash
npm run dev
```

访问 `http://localhost:5173`

### 5. 构建生产版本

```bash
npm run build
```

## 页面说明

### 登录页面

- 用户名：`admin`
- 密码：`lcyfgl2018!!`

### 主界面

| 区域 | 功能 |
|------|------|
| 顶部导航栏 | 显示服务状态、活跃会话、用户信息、主题切换、退出登录 |
| 左侧聊天面板 | 对话交互、历史记录、快捷命令 |
| 右侧状态面板 | 仓库统计、监控列表、摄像头详情 |

## 功能详解

### 聊天面板 (ChatPanel)

- **对话历史侧边栏**：保存所有历史对话，支持切换和删除
- **快捷命令**：预设常用指令，一键发送
  - 查询温湿度
  - 检查通风
  - 开启通风
  - 查询状态
- **打字效果**：AI 回复逐步显示，增强交互体验
- **工具调用展示**：显示 Agent 调用的工具名称
- **Markdown 渲染**：支持格式化内容展示

### 状态面板 (StatusPanel)

- **统计卡片**：仓库总数、平均温度、平均湿度、正常运行数
- **仓库列表**：展示各仓库详细信息
  - 温度、湿度、空气质量
  - 通风状态、库存水平
  - 通风建议判断
- **摄像头监控**：
  - 多摄像头切换
  - 在线/离线状态显示
  - 模拟视频画面

### 主题系统

支持明亮和暗黑两种主题：
- 自动检测系统偏好
- 手动切换并保存到 localStorage
- CSS 变量实现，全局响应

## API 接口调用

前端通过 Axios 调用后端 API：

| 接口 | 说明 |
|------|------|
| `POST /api/auth/login` | 用户登录 |
| `GET /api/auth/verify` | Token 验证 |
| `POST /api/agent/chat` | Agent 对话 |
| `DELETE /api/agent/session/{id}` | 清除会话 |
| `GET /api/agent/status` | 系统状态 |

## 自定义样式

项目使用 CSS 变量定义主题颜色，可在 `src/style.css` 中修改：

```css
:root {
  --primary-color: #007AFF;
  --accent-color: #34C759;
  --success-color: #34C759;
  --warning-color: #FF9500;
  --danger-color: #FF3B30;
}
```

## 配套后端项目

后端服务项目：[warehouse-agent](https://github.com/Vangogh777/warehouse-agent)

## 开发建议

1. 启动后端服务后再启动前端
2. 使用 Chrome DevTools 调试
3. 修改 `src/api/index.js` 中的 `BASE_URL` 以适配不同环境

## License

MIT License