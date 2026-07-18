# 数据源调研

## 1. Catalogue of Life

用途：接受名、异名、分类等级、名称使用记录和版本化清单。

适合作为名称归一化的基础，但“分类名称”和“系统发育关系”不是同一个问题；不能直接把传统分类层级当成时间校准的进化树。

官网：https://www.catalogueoflife.org/

## 2. GBIF Backbone / ChecklistBank

用途：名称匹配、统一分类主干、物种出现记录和数据集交叉引用。

GBIF 的优势是分类与分布数据可连接；限制是出现记录受采样努力、地理可达性和数据发布习惯影响，不能把记录密度直接解释为真实丰度。

官网：https://www.gbif.org/

API 文档：https://techdocs.gbif.org/en/openapi/v1/species

## 3. Open Tree of Life

用途：综合已发表系统发育树和统一分类，输出大尺度综合树。

正式实现时应保留多分叉。多分叉通常代表关系尚未解析或多种研究结论尚未统一，而不是可以任意排列的多个二叉分支。

官网：https://tree.opentreeoflife.org/

## 4. TimeTree

用途：获取两个类群的分化时间、物种时间线和指定类群的时间树。

分化时间是统计估计，应保存中位数、区间、研究数量和参考文献，不能只保留一个看似精确的数字。

官网：https://timetree.org/

## 5. NCBI Taxonomy

用途：连接 Taxonomy ID、基因组、核酸、蛋白和模式生物数据。

NCBI Taxonomy 面向公共序列数据库维护，覆盖重点与命名学权威数据库不同。它适合作为分子数据关联层，而不是所有类群的唯一分类裁判。

官网：https://www.ncbi.nlm.nih.gov/taxonomy

## 6. Paleobiology Database

用途：化石出现记录、地理位置、地质年代、分类鉴定和古地理信息。

化石记录不完整，受到保存概率、岩层暴露、采样强度和分类修订影响。网站应显示记录范围和数据量，而不是把“最早记录”直接等同于“真实起源时间”。

官网：https://paleobiodb.org/

数据服务：https://paleobiodb.org/data1.2/

## 7. Encyclopedia of Life / TraitBank

用途：性状、生态关系、描述文本和媒体聚合。

适合补充体型、食性、栖息地、生活史和生态相互作用。每条性状仍需保留原始来源、单位和测量上下文。

官网：https://eol.org/

## 8. Wikimedia Commons

用途：开放图片、作者、许可协议和原始文件页。

不要只保存缩略图 URL。应同时保存文件标题、作者、许可证、许可版本、来源页和抓取时间，以便正确署名与后续更新。

官网：https://commons.wikimedia.org/

## 建议的主键映射

```text
internal_taxon_id
├── col_usage_id
├── gbif_taxon_key
├── ott_id
├── ncbi_tax_id
├── pbdb_taxon_no
├── eol_page_id
├── wikidata_qid
└── source_versions[]
```

内部主键不应直接等同于任一外部数据库 ID，因为不同来源的概念边界、异名处理和版本节奏不同。
