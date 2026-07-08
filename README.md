# 全球恐怖袭击 · 数据可视化
### Global Terrorism — a scrollytelling data story

一个单页滚动叙事（scrollytelling）作品，呈现 **2020 年 11 月 26 日至 12 月 31 日**、共 35 天内全球被记录的恐怖袭击：**700 起事件、1,920 人死亡、1,298 人受伤、波及 45 个国家**。

A single-page scrollytelling piece covering 35 days of recorded terrorist attacks worldwide (Nov 26 – Dec 31, 2020): 700 incidents, 1,920 deaths, 1,298 injured, across 45 countries. Nine chapters, a hand-written scroll engine (IntersectionObserver + custom particle system, no scrollama), and honest disclosure of data limitations (37% of perpetrators unknown; figures are lower bounds).

**▶ Live: https://sunnywang666.github.io/Global-Terrorism/**

配套 A3 海报 / companion A3 poster:

<img src="docs/poster-a3.jpg" width="420" alt="恐怖袭击数据新闻 A3 海报">

- **数据来源**：CnOpenData · 全球恐怖袭击数据库
- **技术**：纯 HTML / CSS / JavaScript + ECharts（图表）+ 手写滚动引擎与粒子系统（叙事），无需构建
- **叙事打磨**：32 次提交中多轮重写文案去除套路化表达，借鉴《Rape in India》等经典数据新闻的叙事手法

---

## 如何打开（重要）

**不要直接双击 `index.html`。** 第 4 节的世界地图需要读取本地地图数据文件，浏览器在 `file://` 模式下会因安全限制（CORS）拒绝读取，导致地图无法显示。请用一个本地小服务器打开：

在解压后的文件夹里打开终端 / 命令行，运行其中任意一条：

```bash
# 方式一：Python 3（Mac 通常自带，多数电脑都有）
python3 -m http.server 8000

# 方式二：Node.js
npx http-server -p 8000
```

然后在浏览器访问 **http://localhost:8000** 即可。

> 用现代浏览器（Chrome / Edge / Firefox / Safari）打开。建议用桌面端浏览，移动端布局已适配但叙事体验以桌面为佳。

---

## 文件结构

```
.
├── index.html   主文件（页面结构 + 全部样式 + 启动脚本）
├── assets/      ECharts 库、中文字体、预处理数据、世界地图、各章节图表脚本
└── README.md
```

所有数据已预先算好，存在 `assets/` 下的 `TERROR_DATA` 中；图表由 ECharts 渲染。三部分缺一不可，提交时请保持文件夹完整。

---

## 九个章节

| # | 标题 | 内容 |
|---|------|------|
| 01 | 35 天 | 700 起袭击按天散布，纵轴是单起死伤；可点击任意一点查看该起事件 |
| 02 | 逐日死亡 | 每日死亡 / 受伤走势，标注峰值（12 月 23 日） |
| 03 | 1,920 与 1,298 | 象形图，一个图标代表十个人 |
| 04 | 45 个国家 | 世界地图热点；可点击国家查看该国最致命的一起 |
| 05 | 谁在哪里活动 | 组织 → 国家关系网络（线越粗袭击越多），并披露 37% 实施者未知 |
| 06 | 六类武器 | 武器类型分布与各自致死人数 |
| 07 | 怎么打 | 袭击手法分布 |
| 08 | 谁是目标 | 袭击对象分布 |
| 09 | 次数 ≠ 致命 | 发生次数 vs. 每起平均死亡 |

---

## 交互说明

- **滚动**驱动叙事，图表随文字推进而变化。
- 第 01、04 节支持**点击**查看单起事件详情；详情弹窗点击框外、按 ESC、或点 × 均可关闭。
- 关于数据口径与局限（"恐怖主义"无统一定义、37% 实施者未知、数字为下限等），见页面结尾的"尾声"部分。
