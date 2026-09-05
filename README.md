# CET-6 Studio | 大学英语六级无纸化备考与全真模考系统

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.7.2-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/IndexedDB-Dexie.js-2A7A4B?style=flat-square" alt="Dexie" />
  <img src="https://img.shields.io/badge/Dictionary-Collins%20COBUILD-D8232A?style=flat-square" alt="Collins" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel" alt="Vercel" />
</p>

> **CET-6 Studio** 是一款专为全国大学英语六级（CET-6）考生量身打造的**现代化、无纸化高保真模考与智能备考工作台**。
> 告别繁琐的纸质试卷与碎片化查词工具，在一套纯粹、清爽的高颜值界面中实现**真题精练、听力复读、正版柯林斯英英双解、实时答题草稿箱与备考足迹统计**。

---

## 核心特性

### 1. 全真无纸化真题演练（Exam Workspace）

- **双屏沉浸式模考体验**：左侧内置高清 PDF 原题阅读器，右侧配套全交互式答题卡，支持一键翻题与作答状态定位。
- **官方答案与全解析瞬切**：作答完毕一键交卷并核对《官方答案与详析》，附带通关彩带动效（Confetti）。
- **专业级精听音频播放器**：
  - 智能支持 `0.8x` / `1.0x` / `1.2x` / `1.5x` 多档变速；
  - `±5s` 快捷微调回退与前跳；
  - **A-B 区间循环复读**，助你攻克长对话、新闻与学术演讲重难点弱读连读。
- **组件常驻保护机制（Keep-Alive）**：模考中途临时切换至「英英词典」查词或查看计划，**作答进度、音频播放位置、PDF 翻页绝对零丢失**。
- **多试卷实时自动存盘（Local Draft）**：每选一个选项实时保存在本地，意外断电、误触 F5 刷新网页或关闭浏览器均可无缝恢复；提供随时一键「重置作答」从零模考。

### 2.  权威柯林斯英英双解词典 & 智能生词本

- **正版《柯林斯高阶英汉双解词典》（Collins COBUILD）深度集成**：
  - **情境全句式英英释义**：告别干瘪机翻，以完整英文叙述掌握学术与应用语境；
  - **权威原书真题例句与精译**：每个义项配备真实原声例句及高质量中文对照；
  - **柯林斯官方词频星级**（`★~★★★★★`），快速识别六级核心高频词。
- **智能拼写容错与自动纠偏（Typo Auto-Correction）**：
  - 如不小心输入 `therpy`，系统自动识别并纠偏为 `therapy`，并拉取对应的柯林斯完整条目、例句与释义。
- **六级常考同义替换（Paraphrase）**：自动提取高频改写同义词，助力阅读推断与写作高分升级。
- **真人美音发音**：网易专业母语发音 CDN + 浏览器原生 Web Speech 双通道发声。
- **IndexedDB 离线生词本**：查词后一键收藏至本地生词本，支持按「待复习 / 已掌握」分类温故知新。

### 3. 总览看板与学情监控（Dashboard）

- **备考活跃度热力图**：GitHub Contribution 风格的打卡足迹记录；
- **智能冲刺倒计时**：距离六级考试天数实时提醒与冲刺建议；
- **真题库完成度**：六级各套真题完成进度与正确率雷达。

### 4.  每日复习计划（Planner）&  素材积累（Materials）

- **结构化备考任务流**：听力、阅读、翻译专项练习打卡；
- **高分写作模板与翻译核心表达**：按主题分类积累，支持关键词填空自测。

### 5.  舒适的视觉设计系统

- 精心调制的**星巴克绿（Starbucks Green）品牌色彩矩阵**（深林绿、薄荷绿、陶瓷白）；
- 完美支持**深色暗黑模式（Dark Mode）**，夜间刷题护眼不伤眼。

---

## 系统技术架构

```
cet6-study-platform/
├── api/                     # Vercel Serverless 云函数（线上柯林斯反代接口）
│   └── dict.js              # 携带 Referer 鉴权与 24h Edge 缓存的字典代理
├── src/
│   ├── components/
│   │   ├── dashboard/       # 总览看板组件（热力图、倒计时、真题入口）
│   │   ├── exam/            # 真题演练（双屏PDF、答题卡、精听播放器）
│   │   ├── dictionary/      # 英英词典与本地生词本
│   │   ├── planner/         # 每日备考计划打卡
│   │   ├── materials/       # 写作翻译素材积累
│   │   └── layout/          # 全局侧边栏（多页面状态切换）
│   ├── data/
│   │   ├── defaultPapers.ts # 六级真题试卷原题、听力与题目结构
│   │   └── cet6Dictionary.ts# 本地六级核心真题高频离线词库 (0ms兜底)
│   ├── services/
│   │   └── dictionaryApi.ts # 多级词典网关（柯林斯 -> 本地离线 -> Datamuse）
│   ├── db/                  # Dexie.js (IndexedDB) 本地持久化配置
│   ├── types/               # 全局 TypeScript 数据结构接口
│   ├── App.tsx              # 根组件（Keep-Alive 常驻挂载与主题管理）
│   └── main.tsx             # 应用入口
├── public/                  # 静态静态资源、音频与试卷真题 PDF
├── vercel.json              # Vercel 生产环境重定向与 API 路由规则
└── vite.config.ts           # Vite 开发服务器反向代理与构建打包配置
```

---

## 快速开始

### 环境依赖

- **Node.js** >= 18.0.0
- **npm** 或 **pnpm** / **yarn**

### 1. 克隆代码仓库

```bash
git clone https://github.com/K-ristina/cet6-study-platform.git
cd cet6-study-platform
```

### 2. 安装项目依赖

```bash
npm install
```

### 3. 启动本地开发环境

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可开始使用。

### 4. 构建生产产物

```bash
npm run build
```

编译产物将输出至 `dist/` 目录中。

---


## 隐私与离线安全

- **纯本地数据存储**：所有作答记录、做题进度、生词本、每日计划均通过浏览器的 `IndexedDB` 与 `LocalStorage` 存储在用户本地设备，**无需注册登录，数据完全属于你自己**。
- **支持离线运行**：六级核心高频词典与题库完全内置，弱网或断网环境下仍可秒级离线查词与答题。

---

## 开源许可证

本项目基于 [MIT License](LICENSE) 开源协议，欢迎自由学习、使用与二次开发。祝各位考生六级考试高分过关！
