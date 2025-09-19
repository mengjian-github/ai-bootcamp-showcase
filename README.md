# AI编程训练营作品展示平台

一个功能完整的AI编程训练营学员作品展示平台，支持用户认证、多训练营管理、作品上传、投票系统、管理后台等完整功能。

## 🎬 功能演示

![AI编程训练营作品展示平台演示](./public/videos/demo.gif)

> 📹 **功能演示**：展示了平台的完整功能流程，包括用户注册登录、作品上传展示、投票互动、管理后台等核心特性。
>
> 💡 **提示**：如需查看完整高清演示视频，请访问 [`./public/videos/demo.mp4`](./public/videos/demo.mp4) 文件。

## ✨ 核心功能

### 🎯 作品展示系统
- **多训练营支持** - 支持创建和管理多个训练营，分类展示学员作品
- **作品上传** - 支持HTML文件上传和在线链接两种方式
- **封面图展示** - 统一规范的作品封面图展示（建议800x600px）
- **投票排序** - 按投票数量排序展示，提升优秀作品曝光度
- **分页浏览** - 支持分页浏览，提升用户体验

### 🔐 用户认证系统
- **用户注册/登录** - JWT token身份验证
- **用户角色管理** - 支持6种不同角色：教练、行动家、圈友、志愿者、工作人员、管理员
- **权限控制** - 基于角色的访问控制，管理员拥有完整管理权限
- **个人资料** - 昵称、星球编号、头像等个人信息管理

### ❤️ 互动投票系统
- **一人一票** - 每个用户对每个作品只能投一次票
- **实时更新** - 投票结果实时更新并重新排序
- **投票状态** - 显示用户是否已投票的状态

### 🛠️ 管理后台
- **训练营管理** - 创建、编辑、删除训练营配置
- **作品审核** - 管理员可审核通过/拒绝作品展示
- **用户管理** - 查看用户信息和权限管理
- **数据统计** - 作品数量、投票统计等数据展示

## 🎨 界面特色

- **现代化设计** - 采用渐变色彩和毛玻璃效果
- **动画效果** - Framer Motion驱动的流畅动画
- **响应式布局** - 完美适配桌面端和移动端
- **交互反馈** - 丰富的鼠标悬停和点击效果
- **用户体验** - Toast提示、加载状态、空状态设计

## 👥 用户角色

- 👑 **管理员** (ADMIN) - 平台管理员，拥有所有权限
- 🎓 **教练** (COACH) - 训练营教练
- ⚡ **行动家** (ACTIONIST) - 积极参与的学员
- 👥 **圈友** (MEMBER) - 普通学员
- 🤝 **志愿者** (VOLUNTEER) - 志愿服务者
- 🛠️ **工作人员** (STAFF) - 平台工作人员

## 🛠️ 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS + Framer Motion
- **后端**: Next.js API Routes + JWT认证
- **数据库**: PostgreSQL + Prisma ORM
- **UI组件**: Lucide React图标 + React Hot Toast
- **文件存储**: 本地文件系统
- **样式**: CSS-in-JS + 响应式设计

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置数据库连接：

```env
DATABASE_URL="postgresql://username:password@localhost:5432/ai_bootcamp_showcase"
```

### 3. 初始化数据库

```bash
# 生成Prisma客户端
npx prisma generate

# 运行数据库迁移
npx prisma db push

# 填充种子数据（可选）
npx prisma db seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📁 页面结构

- **首页** (`/`) - 作品展示页面，支持按训练营筛选和分页浏览
- **登录页** (`/login`) - 用户登录界面
- **注册页** (`/register`) - 新用户注册界面
- **个人资料** (`/profile`) - 用户个人信息管理
- **作品上传** (`/upload`) - 学员作品上传表单（需登录）
- **管理后台** (`/admin`) - 训练营和作品管理（管理员专用）

## 🔌 API 接口

### 用户认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 训练营管理
- `GET /api/bootcamps` - 获取训练营列表
- `POST /api/bootcamps` - 创建新训练营（管理员）
- `PUT /api/bootcamps` - 更新训练营信息（管理员）
- `DELETE /api/bootcamps` - 删除训练营（管理员）

### 用户管理
- `GET /api/users` - 获取用户列表
- `GET /api/users/[id]` - 获取特定用户信息
- `PUT /api/users/[id]` - 更新用户信息
- `GET /api/users/[id]/projects` - 获取用户的作品列表

### 作品管理
- `GET /api/projects` - 获取作品列表（支持admin参数查看所有作品）
- `POST /api/projects` - 创建新作品（需登录）
- `PUT /api/projects` - 更新作品信息（管理员）
- `DELETE /api/projects` - 删除作品（管理员）
- `POST /api/projects/[id]/vote` - 作品投票（需登录）

### 文件上传
- `POST /api/upload` - 文件上传接口（支持封面图和HTML文件）

## 封面图规范

为了保持展示效果的一致性，建议上传的封面图符合以下规范：

- **尺寸**: 800x600px (4:3比例)
- **格式**: JPG/PNG
- **大小**: 不超过2MB
- **内容**: 清晰展示作品特色，避免过于复杂的设计

## 部署

### 生产环境构建

```bash
npm run build
npm start
```

### 使用Docker (可选)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🚀 已完成功能

- ✅ 用户认证系统（注册、登录、JWT验证）
- ✅ 多角色权限管理
- ✅ 作品上传和展示
- ✅ 投票系统
- ✅ 管理后台
- ✅ 响应式设计
- ✅ 动画效果
- ✅ 文件上传
- ✅ 数据分页

## 🛣️ 发展规划

- [ ] 作品分类标签系统
- [ ] 搜索和筛选功能
- [ ] 作品评论系统
- [ ] 数据统计分析面板
- [ ] 邮件通知系统
- [ ] 作品评分系统
- [ ] 多媒体作品支持（视频、音频）
- [ ] 社交分享功能
- [ ] 移动端APP
- [ ] 数据导出功能

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📝 使用指南

### 第一次使用
1. 访问注册页面创建账户
2. 选择合适的用户角色（建议新用户选择"圈友"）
3. 登录后即可查看作品和进行投票
4. 点击"分享我的作品"上传你的创意作品

### 管理员功能
- 管理员可在后台管理训练营配置
- 审核用户提交的作品
- 查看平台数据统计

### 作品上传注意事项
- 封面图：建议尺寸800x600px，格式JPG/PNG/WebP
- HTML文件：仅支持单个HTML文件，大小不超过10MB
- 作品链接：确保链接有效且可公开访问

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 创建 GitHub Issue
- 项目作者：mengjian

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

**AI破局俱乐部 × AI编程训练营**
🚀 探索AI编程的无限可能，让创意与技术完美融合
