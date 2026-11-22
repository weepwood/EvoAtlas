# EvoAtlas：研究资料、数据边界与重构说明（2026-11）

> 整理日期：2026-11-23。此文档是可追踪的研究入口和策展说明，不代表已完成逐节点的科学鉴定。

## 1. 产品定位

EvoAtlas 是帮助学习者**沿时间探索演化亲缘关系**的交互式生命之树。它不是分类名称目录、物种普查、化石系统数据库，也不是“从低级到高级”的生命阶梯。

优先支持以下问题：

1. 一个类群在树的哪个位置？它与哪些类群共享祖先？
2. 两个代表物种的**最近共同祖先（MRCA）**是哪一条示意谱系？
3. 化石记录、推断分化时间和现生物种有什么不同？
4. 哪些位置存在拓扑争议、数据缺口或不能用单棵树表达的过程？

## 2. 这次完成的数据整理

原始演示数据在基础节点之后，通过循环生成 42 个名为 Survey clade 的虚构聚合节点，并将总数裁切到 106。这样做虽然增加图谱密度，但容易将示意占位与真实分类混淆。

本次的数据覆盖层（data/curation.js）完成：

- 去除全部 Survey clade 占位节点，节点总数变为 **109**，其中 **35** 个代表物种及 **5** 个原有灭绝化石类群；这个数量不是任何生物多样性统计。
- 新增细菌、古菌、红藻、苔藓、刺胞动物、蜕皮动物、软体动物、棘皮动物、软骨鱼、辐鳍鱼、两栖动物、单孔类、有袋类和长臂猿等代表性分支。
- 将节肢动物示范节点接入蜕皮动物，将鲸类接入鲸偶蹄目。
- 在兽脚类下增加鸟翼类，避免将 Archaeopteryx 简化为现代鸟类冠群的确定成员或现代鸟类的直系祖先。
- 增加了数据结构自动校验，禁止生成占位节点重新混入。

**仍未完成：** 所有节点逐条绑定的外部 ID、发表文献、具体时间置信区间、支持度和备选拓扑。原始字段中的 confidence 只是演示标签，不能解释为统计上的 posterior probability、bootstrap support 或某数据库的审核评级。

## 3. 科学上需要特别谨慎的地方

### 3.1 LUCA 与细胞生命早期谱系

LUCA 表示现生细胞生命的最近共同祖先概念，既不是“第一生命”，也不是已有明确鉴定的化石物种。演示将它放在约 4000 Ma 的水平位置仅是视觉坐标，没有独立数据论证。不能把这里的 4000 Ma 当作可靠观测。

旧图谱采用 Bacteria / Archaea / Eukaryota 三条直连根部的教学简化模型。Asgard 古菌的基因组研究使真核生物可能起源于古菌内部的“两域”模型获得重要支持，同时真核起源具体位置、过程和时间仍在研究中。**此版没有重建可用于科学推断的根部拓扑**，界面和说明必须声明它是概念示意。

入门综述与新研究：
- Nature (2024), *The emerging view on the origin and early evolution of eukaryotic cells*: https://www.nature.com/articles/s41586-024-07677-6
- Nature Reviews Microbiology (2026), *Diversity, ecology, cell biology and evolution of the Asgard archaea*: https://www.nature.com/articles/s41579-026-01288-w
- Nature (2025), *Deep origin of eukaryotes outside Heimdallarchaeia within Asgardarchaeota*: https://www.nature.com/articles/s41586-025-08955-7

### 3.2 分类层级与系统发育树不可等同

用户看到的“界 / 门 / 纲 / 目 / 科 / 属 / 种”有命名学和分类史的维度，真正的进化关系来自系统发育分析。分类等级不是共同祖先之间统一的时间尺度。

- Open Tree of Life：https://tree.opentreeoflife.org/
- Web services：https://opentreeoflife.github.io/use
- 阅读系统发育树：https://organismalbio.biosci.gatech.edu/biodiversity/phylogenetic-trees/

本示意树把若干未完全展开的系统发育节点压缩到相邻的父子关系中，不能用于系统发育论文的定量分析。**概览模式显示被折叠的路径时，必须保留其实际祖先链，不可将遥远物种画成某个高级类群的直接子节点。**

### 3.3 分化时间与地质事件

TimeTree 通过汇总发表的分子钟结果提供时间参考，不能把单个数字表示为具有无需说明的精度或置信水平。TimeTree 网站在 2026 年已公布 Version 6 相关下载资源；本项目还没有导入该数据。

- TimeTree：https://timetree.org/
- TimeTree 5 方法论文（2022）：https://doi.org/10.1093/molbev/msac174
- TimeTree 下载资源：https://timetree.temple.edu/downloads

地质年代尺优先以**国际地层委员会（ICS）2026/06** 发布的信息为核对基准。本界面的五次大灭绝标记是方便教学的近似中心位置，不能混同为精确地层边界。灭绝事件也可能跨越相当时间，并非瞬间发生。

- ICS：https://stratigraphy.org/chart/
- 2026/06 版本更新：https://stratigraphy.org/news/156

### 3.4 化石、祖先与平行谱系

最早/最晚的化石出现记录（first/last occurrence）受岩层暴露、保存条件、鉴定与采样努力影响，不等于谱系真实起源或消失的精确时间。Tiktaalik、Archaeopteryx、Australopithecus 等代表化石不能默认解释为现代物种的确定直系祖先。

- PBDB：https://paleobiodb.org/
- PBDB API：https://paleobiodb.org/data1.2/

此外，细菌的水平基因转移、古人类基因渗入、植物杂交及内共生无法由单一树状连线完整表示。未来应在特定专题提供证据可追踪的网络关系视图，而不是将树上分叉做成随机的装饰。

## 4. 数据源分工与质量阈值

| 层 | 推荐数据源 | 正式接入前的要求 |
| --- | --- | --- |
| 名称 / 接受名 / 异名 | Catalogue of Life、GBIF | source ID、版本、名称概念、异名映射 |
| 关系拓扑 | Open Tree of Life、原始论文 | OTT ID、合成树版本、证据与未解析分叉 |
| 分化时间 | TimeTree、同行评审论文 | 方法、研究 ID、点估计与区间、时间单位 |
| 化石记录 | Paleobiology Database | taxon ID、occurrence ID、地层、鉴定状态 |
| 基因组关联 | NCBI Taxonomy | taxid、序列版本、概念映射 |
| 性状与生态 | EOL / TraitBank | 原始引文、单位、测量背景 |
| 地质单位 | ICS | 标尺版本、界限更新记录 |
| 媒体 | Wikimedia Commons | 作者、授权类型、许可版本、来源页、抓取日期 |

禁止将“这个节点可能适合查询哪些数据库”自动转写为“这些数据库证实了此节点的全部字段”。

建议未来给每条证据增加字段：source_release、reference_url、retrieved_at、subject_id、assertion_type、confidence_method、interval_min、interval_max、review_state、editorial_notes。

## 5. UI 与交互设计依据

设计取向：**自然历史博物馆信息终端 + 科学软件工作台**。减少背景动效、装饰性 Hero、常驻说明小字和大面积玻璃拟态，重要的是图、关系和证据。

- **导航**：固定的类群快速入口，搜索优先，焦点可以随路径返回祖先。
- **画布**：大面积居中，拖拽、指针锚点缩放、适应画布、两种时间坐标；事件与标尺跟随画布变换。
- **详情**：宽屏独立右栏，小屏可滑入的检查器；默认不抢占内容。
- **比较**：统一的两个物种选择器，显示最近共同祖先及两边的独立后代路径。
- **视觉**：浅色默认取博物馆纸张与石板色系；深色跟随系统；不再使用旋转的生命轨道、霓虹光圈和大量渐变。
- **可访问性**：语义按钮、可见键盘焦点、Escape 关闭覆盖界面、节点 Enter/空格选择、降低动画偏好、宽窄屏布局。
- **性能**：目前规模保留零依赖 SVG + 原生 JS；只有在数据增长时再引入视口裁剪、Worker 和 Canvas / WebGL。避免为了框架而框架。

参考资料：
- Oxford University Museum of Natural History：https://oumnh.ox.ac.uk/reading-the-tree-of-life
- Open Tree viewer：https://browse.opentreeoflife.org/opentree/argus

## 6. 下一步科学数据版本化工作

优先级建议：

1. **P0**：为所有节点标注教学/证据已核验，逐一替换缺省年龄及置信标签。
2. **P0**：对生命最深层拓扑采用独立、可切换的争议模型，避免将三域图视为确定事实。
3. **P1**：引入 Open Tree + Catalogue of Life 的版本化子树 ETL 和差异检查。
4. **P1**：引入 TimeTree 的估计区间与 DOI，将化石年代单列为 occurrence 而不是 branch divergence。
5. **P2**：生物多样性数据量超过 SVG 可用范围后再做 LOD、Worker、WebGL / Canvas 渲染。
6. **P2**：课程路线、地质尺度视图与多方案对照；来源保留可审核性。

## 7. 验证与已知局限

可运行：
- python3 scripts/validate_data.py
- python3 scripts/validate_ui.py
- node --check app.js

这些检查只验证代码语法、树结构、时间方向和 HTML 元素契约，**并不证明系统发育学正确性**。当前仍需真实桌面/移动浏览器验证搜索、焦点、标尺可读性、触控和屏幕阅读器体验。网站依赖 JS 运行，没有后端服务。

外部科学引用资料仅以文本链接引用，未复制第三方受限图片。仓库在添加明确 LICENSE 前，不应推断代码或未来图片具有任意再利用许可。
