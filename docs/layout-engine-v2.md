# EvoAtlas Layout Engine v2 — 多分叉布局引擎设计

状态：**可测试的隔离原型（尚未接入网页）**  
设计日期：2026-11-23  
源码：\`layout/engine.js\`  
契约测试：\`tests/layout-engine.test.cjs\`

## 0. 目标及非目标

EvoAtlas 当前有 608 个节点、496 个物种。此次主要解决的是**高分叉下的几何结构、标签可读性与局部展开的稳定性**，而不是外层工作台视觉。数据仍是教学型示意；节点 ageMa 不是经过逐节点核验的分化年代。

设计目标：

1. **任何一个拥有 N 个直接子节点的父节点，最多只绘制 1 条共享的纵向连接干线，并生成 N 条横向子连接**，而不是为每个子节点重复画一条 L 形路径。
2. 同一子树内部紧凑，不同兄弟子树不会在相同层级发生几何重叠；相邻子树之间留出比普通兄弟节点更大的间距。
3. **结构树**和**教学时间树**共享同一套纵向排版；横向坐标分开计算，不能把结构深度伪装成真实时间。
4. 折叠只改变可见投影，**不更改原始分类记录、年龄、父子链接或科学关系**。
5. 同一输入 + 同一设置得到完全一致的输出；局部展开后尽量保留顺序、节点锚点与用户视口位置。
6. 只输出纯计算结果，由现有 SVG UI 绘制，方便以后切换 Canvas/WebGL。

非目标：制造新的属/科、杜撰二叉分歧时间、逐个验证 496 个物种的分类、现在就为 50,000 叶子重新做 GPU 渲染、将 UI 强制迁移到 React。

## 1. 当前问题定位

现有 \`app.js\`：

- \`build()\`：概览采用固定预算（大屏约 58、小屏约 34）广度抽样，隐藏部分节点时会寻找最近的**可见祖先**作为展示父节点。这种展示捷径需要在未来标记“路径被压缩”，不能默认为真实的直接演化联系。
- \`layout()\`：叶节点依次按固定间隔排列，再用第一个和最后一个子节点的纵向中点放置父节点。无法考虑不同子树在相邻深度上的轮廓。
- \`drawTree()\`：对每一对父子节点都绘制完整折线路径（横 → 竖 → 横），多叉处的竖线反复叠加。
- \`chooseLabels()\`：用固定文字宽度估计与候选位置试探修补重叠，但当横向坐标集中、兄弟节点过多时无法从根源解决。
- 既有 \`ageMa\` 为教学近似；不能为了看起来紧凑，任意移动时间模式中代表年龄的横向位置。

按现有数据计算的直接子节点数：

| 支系 | 直接子节点数 |
| --- | ---: |
| 辐鳍鱼纲（Actinopterygii） | 23 |
| 子囊菌门（Ascomycota） | 15 |
| 啮齿目（Rodentia） | 15 |
| 鲸下目（Cetacea） | 14 |
| 雀形目（Passeriformes） | 14 |

仓库有 **25 个节点拥有超过 8 个直接子节点**。这些数字是当前策展树的数据结构，不代表自然界真实的物种数量或多分化事件数量。

## 2. 设计分层

\`\`\`text
Canonical Taxonomy（不可修改的物种与分类原始数据）
          |
          v
Hierarchy Index + Validation
  ├─ ID 唯一 / 父节点存在 / 无环
  ├─ 完整的 children / descendants / tipCount
  └─ 保留输入时的稳定顺序
          |
          v
View Projection（纯展示）
  ├─ 焦点 root / 人工折叠 collapsedIds
  ├─ 选中路径 pinnedIds
  ├─ displayBudget / 分支摘要标记
  └─ 禁止凭 UI 分组构造“新的祖先”
          |
          v
Layout Geometry（纯算法）
  ├─ 纵向：基于同深度轮廓的 tidy 子树分离
  ├─ 横向：结构层级 OR 教学时间
  ├─ 连线：父节点共享 stem + 子节点独立 arm
  └─ bounds / anchor positions / invariants
          |
          v
Presentation Geometry（后处理）
  ├─ 屏幕空间标签碰撞检测和 LOD
  ├─ 缩放和视口保留 / 动画
  └─ SVG 当前，未来可接 Canvas
\`\`\`

**关键原则：原始系统发育关系是数据，图谱折叠与屏幕位置只是状态。**

## 3. 多分叉与连接几何

过去一名父节点有 10 个孩子，就画 10 条分别包含竖线的路径。新的几何契约：

\`\`\`text
父节点 ●──┬──────────────● 子节点 1
          ├──────────────● 子节点 2
          ├──────────────● 子节点 3
          ├──────────────● 子节点 4
          └──────────────● 子节点 5
\`\`\`

对于父节点 \`p\`、子节点集合 \`c1…cn\`，父节点在时间轴（或结构层级轴）上的横坐标 \`x(p)\`：

- \`n > 1\`：仅生成 **一个** \`stem\`：\`x1=x2=x(p), y1=min(y(ci)), y2=max(y(ci))\`。
- 每个孩子生成 **一个** \`arm\`：从 \`(x(p),y(ci))\` 连接到 \`(x(ci),y(ci))\`。
- \`n = 1\`：仅需要一条水平连接；如果以后有不同 y 的特殊节点，才额外生成单一竖线。
- \`n = 0\`：不生成连接。
- 所有形状均使用**实际父节点的坐标**；绝不生成有新的 \`ageMa\` 的虚拟分叉点。

注意：直系父子连接超过 2 个，并不证明该类群发生真实的同期多路分化。对当前缺乏完整中间分类级别的教学数据，只表示**尚未充分细化的关系**，不应标记为“已证实的生物学多分叉”。

## 4. 纵向：子树轮廓排版

设计取自 **Tidy Tree / Reingold–Tilford** 的理念：对子树递归计算轮廓，保留全体同深度节点的最低/最高高度，之后按邻接轮廓把兄弟子树整体移开。

原型按下列步骤：

1. 叶节点初始 \`y=0\`，给它分配基于文字高度的上下轮廓。
2. 自底向上计算每个子树的同深度上下边界。
3. 将下一个兄弟子树整体纵向移动，确保它的上轮廓与之前兄弟子树的下轮廓之间有足够的空间。
4. 单个父节点放在第一个和最后一个子节点纵坐标的中点。
5. 子树相对坐标稳定，整体平移不影响树的连接结构。

推荐基准：标签高 18 世界单位、普通兄弟间额外留白 12、子树组间额外留白 22。数值属于引擎配置，在浏览器实际字体与 viewport 条件下还需调优。

**复杂度与规模边界：** 隔离原型采用便于审核的轮廓 Map 合并，尚未实现 Buchheim 的优化移位结构，因此不保证最坏情况 O(n)；先对 608 节点验证几何行为与正确性。正式扩展到 10k+ 节点时，再按相同输出契约实现线性时间的 Buchheim tidy 版本。<https://d3js.org/d3-hierarchy/tree>

## 5. 横向：两种语义必须分开

### 结构模式 \`mode=structure\`

\`\`\`text
x(node) = leftMargin + node.depth * depthStep
\`\`\`

只表达父子层级。不使用 \`Ma\` 时间刻度，避免暗示节点分化时间已经确认。最适合逐层阅读、查看多个直接兄弟支系。

### 教学时间模式 \`mode=time\`

给定范围 \`T=max(ageMa)\`、画布可用宽度 \`W\`：

- 线性：\`x=leftMargin + W*(1-age/T)\`
- 对数：\`x=leftMargin + W*(1-log10(age+1)/log10(T+1))\`

现生物种统一在 \`0 Ma\` 的“现在”端；现有化石节点沿用项目的 lastMa 表现规则。这里的 \`ageMa\` 仍然是教学示意，不可称为已核验的 molecular-clock divergence estimate。

两个模式之间只有 x 语义变化，y 与有序的亲缘关系不因切换而改变。**不能把结构模式的 level 投影混同为地质时间**。

## 6. 高密度下的局部折叠（下一阶段）

解决“23 个物种全部直接挂在一个父节点上”的关键，并不是再增加假的属节点，而是**显式区分三种状态**：

| 状态 | 语义 | 视觉 |
| --- | --- | --- |
| \`expanded\` | 当前节点的真实直接孩子全部显示 | 共享主干 + arms |
| \`collapsed\` | 真实支系隐藏了完整后代 | 一条摘要标记，标注隐藏数量 |
| \`overflow\`（仅展示层） | 当前视野无法容纳所有并列孩子 | “其余 N 个展示项”，明确**不是分类节点** |

当前原型只实现显式 \`collapsedIds\`，返回 \`hiddenDescendants\`。不会生成 overflow 的新 ID。因为 “23 个直接孩子”不等于“23 个可合法重组的分支”，任何 overflow 列表都必须保留真实的 parentId，并允许按真实名称检索。

下一轮 UI 可实现：
- 点击父节点旁折叠按钮，展开本地分支而不是让整张图谱切换根节点；
- 展开后只重排受影响子树，保持点击的节点接近原来屏幕位置；
- 鼠标 Hover 仅强调真实祖先路径，不能把折叠图标画成额外祖先。

## 7. 标签、缩放与动画属于 Presentation，不属于 Layout

引擎只计算世界坐标，不把字号、碰撞或缩放事件写进系统发育逻辑。

- 标签根据最终 viewport 计算文字真实宽度（SVG \`getBBox()\` / Canvas \`measureText()\`），而不是完全依赖固定字宽；
- 低 zoom：只显示重要支系 / 选中节点；高 zoom：开放物种末端文字；
- 高频缩放中可使用上一帧标签布局，停止缩放后增量计算，避免频繁 DOM 测量；
- 文字位置变更不能移动节点的时间 x 或改变拓扑；
- 用户按住缩放或展开时保持锚点世界坐标：
  \`tx' = anchorScreenX - anchorWorldX * nextZoom\`
  \`ty' = anchorScreenY - anchorWorldY * nextZoom\`；
- 动画通过 ID 建立 \`oldPosition → newPosition\`，支持中断与 prefers-reduced-motion。

## 8. 纯函数原型的输入与输出契约

\`\`\`js
const layout=EvoLayoutEngine.layoutTree(window.EVO_TAXA,{
  rootId:'actinopterygii',
  mode:'structure',          // or 'time'
  timeScale:'linear',        // time mode only
  sort:'input',              // or 'leaf-count'
  collapsedIds:[],
  leafGap:12,
  subtreeGap:22,
  depthStep:145
});

// layout.nodes:
// [{id,parentId,childIds,x,y,depth,collapsed,hiddenDescendants,...}]
//
// layout.segments:
// [{kind:'stem',ownerId,x1,y1,x2,y2}, 
//  {kind:'arm',ownerId,childId,x1,y1,x2,y2}]
//
// layout.bounds / layout.axis / layout.stats
\`\`\`

\`stem\` 是**绘制图元**，不是数据库祖先或演化时间；\`childIds\` 永远对应真实节点标识。

## 9. 与当前 app.js 的迁移路线

### 阶段 A（本 PR）：不触碰线上渲染器

- 加入纯函数原型 \`layout/engine.js\`。
- 用原有 608 条数据构建结构、时间、折叠场景。
- 在 CI 中运行 \`node --test tests/layout-engine.test.cjs\`。
- 提交设计规范与非目标，不修改原有 \`app.js\`。

### 阶段 B：一比一接线与开关

- 在 \`index.html\` 按 \`data/species.js\` 之后加载 \`layout/engine.js\`。
- 将现有 \`build()\` 显示投影、\`layout()\` 几何计算拆成单独模块。
- 将引擎 \`nodes\` 适配成现有 \`state.visible / state.pos / state.parents\`，暂不改搜索、详情、比较。
- 将 \`drawTree()\` 使用 \`segments\` 绘制共享主干，并保留 active/hover 路径样式。
- 临时用特性开关在浏览器对比旧/新引擎的同一个根节点与 zoom。
- 为静态 Pages 构建清单添加脚本文件，防止仅开发环境生效。

### 阶段 C：本地展开与可读性

- \`collapsedIds\` 保存到独立的 \`treeViewState\`，支持节点内局部展开。
- 对超出屏幕高度的部分分支，优先视口裁剪、标签 LOD；大数据才引入 Canvas/Worker。
- 尽量复用现有小地图、固定时间轴和指针锚点缩放。
- 提供视觉回归图片、拖拽/缩放中 FPS 与 DOM 节点数量基线。

## 10. 不变量与验收场景

| 场景 | 验收条件 |
| --- | --- |
| 辐鳍鱼纲（23） | 1 stem + 23 arms，无共享竖线重复描绘 |
| 子囊菌门（15） | 1 stem + 15 arms，同层标签之间保留间隔 |
| 啮齿目（15） | 1 stem + 15 arms，兄弟顺序稳定 |
| 哺乳动物（158） | 所有真实节点均可布局；展开/折叠不修改源数据 |
| 全生命树（608） | 生成节点数等于真实节点数，不增假节点 |
| 切换结构/时间 | 父子关系、孩子顺序、纵坐标保持一致，仅横坐标改变 |
| 展开后 | 显示同一真实节点 ID；父子关系不被自动二叉化 |
| 错误数据 | 重复 ID、缺失父节点、环必须抛出错误 |
| 键盘/移动端 | 重绘后仍可按 ID 恢复焦点；触控定位不跳错节点 |

需在阶段 B 之后用真实浏览器截图验收：无大面积错位、树的内部不同子树不相交、被隐藏节点可找到、年代刻度与文字不混淆。

## 11. 学习资料与设计取舍

- [D3 Tree](https://d3js.org/d3-hierarchy/tree)：Reingold–Tilford tidy tree / Buchheim 性能优化、separation accessor。
- [D3 Cluster](https://d3js.org/d3-hierarchy/cluster)：末端节点对齐的 dendrogram，与结构层级树互为参考；不直接用于时间投影。
- [iTOL 帮助文档](https://itol.embl.de/help.cgi)：节点折叠、叶节点顺序、矩形树显示与子树交互。
- [tidy tree: A New Layout for Phylogenetic Trees](https://pmc.ncbi.nlm.nih.gov/articles/PMC9550987/)：系统发育树布局及其显示边界。

本设计优先选择**语义清楚的正交连接、真实 ID、独立投影层**。在没有稳定的年代来源之前，不建议用平滑 Bezier 曲线掩盖分叉点，也不应自动创造虚假的时间二分叉。
