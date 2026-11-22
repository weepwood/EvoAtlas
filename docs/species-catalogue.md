# EvoAtlas 代表物种目录（2026-11）

> 本目录是**按名称组织的教学版数据集**，不是 Catalogue of Life 或 GBIF 的实时抓取结果，也不等于已经通过专家复核的系统发育假说。

## 规模与原则

- 原有 **109 个节点、35 个物种**。
- 新增 **461 个现生物种、38 个真实名称的高层分类支系**。
- 合计 **608 个节点、496 个物种**，另保留原有化石类群。
- 不存在为凑数量而生成的 `Survey clade` 占位节点。
- 新增物种以二名法学名为主，中文名称为便于浏览的编辑性名称；名称及归属尚需按来源发布版本逐项审查。
- 新增物种 `ageMa:0` 只代表「现生」，**不是分化年代为零**。高层分类支系中的年代坐标仍是教学近似，不能用于科研推断。

## 涉及的代表谱系

| 谱系 | 总节点 | 物种 |
| --- | ---: | ---: |
| 细菌 | 30 | 26 |
| 古菌 | 10 | 7 |
| 真菌 | 31 | 28 |
| 原始色素体生物（含植物与红藻） | 134 | 111 |
| 后生动物 | 398 | 323 |
| 其中脊椎动物 | 291 | 237 |
| 其中哺乳动物 | 158 | 129 |
| 其中灵长目 | 33 | 22 |

这些谱系**嵌套而不是并列**，不能直接求和。例如哺乳动物已计入脊椎动物和后生动物。

物种分布面向教学探索，包括模式细菌、酵母与蘑菇、藻类和苔藓、农作物与被子植物、昆虫、软体动物、节肢动物、鱼类、两栖类、爬行动物、鸟类以及现生哺乳动物。

## 数据文件

`data/species.js` 使用明文分隔记录维护物种：

```text
parent-clade-id|中文名称|Genus species
poaceae|水稻|Oryza sativa
felidae|虎|Panthera tigris
```

父节点对应 `data/data.js`、`data/curation.js` 或此文件前部定义的分类支系。生成节点的 `evidenceState` 固定为 `pending-review`，以及 `confidence:'low'`：这只是策展流程状态，不是统计置信度。

现有 `sources` 字段表示**推荐核验的数据库入口**。不能将 `['col','gbif','opentree']` 理解为所有记录已从这三处逐条验证。

## 图谱表现与性能

- **概览**：均衡遍历各兄弟分支，选择一部分节点，避免所有物种都在一屏内缩成难以阅读的细线。保留搜索命中物种的完整祖先路径。
- **全部节点**：在当前聚焦支系展示全部可用节点，允许缩放和平移；在大型分支可能需要放大到可读比例。
- **比较物种**：下拉菜单最多先展示 80 条匹配结果，输入中文或学名可检索其余全部物种。
- **键盘**：搜索框与列表共用方向键、Enter、Escape；图谱按 Enter 或空格查看节点。

后续如果要扩展到万级/百万级物种，应该先构建受审定、可溯源的数据管线，然后引入子树分片、LOD、画布渲染和索引。**不应为了节点数量而自动生成看似真实的学名或分化时间。**

## 核验与数据来源

待审定优先级：学名及异名、接受名状态、父节点所属分类概念、源数据库 release/version、原始 ID、中文俗名、分化年代及原始研究。可从以下公开入口开始核对：

- [Catalogue of Life](https://www.catalogueoflife.org/tools/checklistbank) / [CoL API](https://www.catalogueoflife.org/tools/api)：接受名和名称来源。
- [GBIF Backbone](https://www.gbif.org/dataset/d7dddbf4-2cf0-4f39-9b2a-bb099caae36c)：跨库分类对照与名称用法。
- [Open Tree of Life](https://tree.opentreeoflife.org/) / [TNRS](https://opentreeoflife.github.io/use)：名称映射与综合系统发育拓扑。
- [NCBI Taxonomy](https://www.ncbi.nlm.nih.gov/taxonomy)：参考生物学名称与分子数据 ID。
- [WoRMS](https://www.marinespecies.org/)：海洋生物接受名及分类版本。
- [POWO](https://powo.science.kew.org/)：植物学名与分类。
- [Index Fungorum](https://www.indexfungorum.org/)：真菌命名索引。

正式数据接入前建议：`taxon_id`、`source_database`、`source_release`、`source_taxon_id`、`accepted_name`、`status`、`checked_at`、`reference_url`、`reviewer`。

## 校验

```bash
python3 scripts/validate_data.py
python3 scripts/validate_ui.py
node --check data/species.js
```

自动校验确保 ID 不重复、学名不重复、父节点存在且无环、样本数满足预期、新增现生物种不持有虚构分化时间和待核验状态。它不等于外部权威数据库逐项核对。
