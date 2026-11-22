# EvoAtlas · 生命演化图谱

EvoAtlas 是零第三方前端依赖的交互式生命之树工作台。通过时间树、谱系分叉、化石记录和最近共同祖先（MRCA）比较探索亲缘关系，而非构建“低级到高级”的生命阶梯。

> **教学数据集**：当前有 109 个代表性节点、35 个物种节点和 5 个灭绝化石类群。所有年代是示意坐标，部分深层拓扑仍有争议，不能把演示内容作为已逐节点验证的科学数据库。

## 功能

- 大画布优先：原生 SVG 系统发育时间树，拖拽、指针锚点滚轮缩放、画布适应与细分/概览视图。
- 类群快速聚焦与中英文/拉丁学名搜索，支持键盘搜索导航。
- 右侧详情：分类路径、概略年代、性状、推荐核验数据库。
- 两个物种的最近共同祖先比较，查看两条后代路径。
- 对数和线性时间坐标、五次主要大灭绝事件的概略标记。
- 浅色 / 深色 / 跟随系统主题；响应式侧栏与移动端详情抽屉。
- 文献与方法入口，明确区分数据建议来源和已核验的节点证据。

## 启动

在仓库根目录运行 Python 静态服务器：

    python3 -m http.server 8000

随后访问 http://localhost:8000 。

推荐使用现代 Chromium、Firefox 或 Safari 浏览器。不需要安装 npm 依赖或构建工具。

## 交互快捷方式

| 操作 | 效果 |
| --- | --- |
| 滚轮 | 以鼠标指针为中心缩放 |
| 按住空白拖动 | 平移画布 |
| 点击节点 | 查看详细资料 |
| 节点聚焦后按 Enter / 空格 | 键盘选中节点 |
| / | 聚焦搜索 |
| ↑、↓、Enter | 选择搜索结果 |
| Escape | 关闭搜索、抽屉或详情 |
| 左侧类群入口 | 聚焦对应演化分支 |
| 共同祖先比较 | 分析两个代表物种的路径关系 |

## 目录

- index.html：工作台布局
- styles.css：设计变量、浅深主题及自适应样式
- app.js：图谱、比较、搜索与交互逻辑
- data/data.js：原型基础数据（保留历史以利审计）
- data/curation.js：移除生成式占位支系、修正部分关系并补充真实名称类群
- data/research.js：研究资料页的数据源与参考链接
- docs/research-notes-2026.md：科学资料、审查边界与设计决策
- scripts/validate_data.py：策展数据结构校验
- scripts/validate_ui.py：页面元素与脚本引用校验
- .github/workflows/validate.yml：GitHub Actions 静态检查

原始文件曾生成 Survey clade 占位节点；运行时由 data/curation.js 全部过滤，正式图谱不再显示这些虚构分类名称。

## 科学表达边界

1. LUCA 不是可确证的第一个生命。图中的根部年代仅为教学示意。
2. 真核起源涉及古菌相关祖先与细菌内共生；根部三域式简图不是唯一被讨论的模型。
3. 化石首次/末次出现范围不能简单等同为谱系起源、灭绝时刻或确定的直系祖先。
4. 此版 ageMa 是示意近似值，而非从 TimeTree 导入的研究级分化时间。
5. 数据字段中的 sources 代表推荐核对的数据库，并不等于逐条核实；confidence 也不是统计上的分支支持度。

**请优先阅读 [研究资料与局限](docs/research-notes-2026.md)。**

## 校验

需要 Python 3、Node.js。执行：

    node --check app.js
    node --check data/curation.js
    python3 scripts/validate_data.py
    python3 scripts/validate_ui.py

CI 自动运行相同的静态验证；实际浏览器交互、视觉回归及学术判断需要另外进行。

## 参考数据库

[Open Tree of Life](https://tree.opentreeoflife.org/) · [Catalogue of Life](https://www.catalogueoflife.org/) · [GBIF](https://www.gbif.org/) · [TimeTree](https://timetree.org/) · [Paleobiology Database](https://paleobiodb.org/) · [ICS](https://stratigraphy.org/chart/)

## 部署与路线图

无需构建，Netlify 直接发布根目录；其他静态托管亦可。后续优先完成逐节点引文、时间置信区间、深层拓扑多方案，而非优先引入大型 UI 框架。详见 [路线图](docs/roadmap.md)。
