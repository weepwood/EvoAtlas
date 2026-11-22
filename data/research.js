/**
 * Public references for EvoAtlas. URLs are reading / verification entry points,
 * not evidence that all tutorial records have been checked against a release.
 * Verified editorial snapshot: 2026-11-23.
 */
window.EVO_RESEARCH={
  sources:[
    {code:'col',name:'Catalogue of Life',category:'分类名称',url:'https://www.catalogueoflife.org/',description:'核对接受名、异名及分类清单版本。名称体系和系统发育关系应分别处理。'},
    {code:'gbif',name:'GBIF',category:'分类与分布',url:'https://www.gbif.org/',description:'提供分类主干、名称匹配与出现记录。采样密度不能直接解释为物种真实丰度。'},
    {code:'opentree',name:'Open Tree of Life',category:'演化拓扑',url:'https://tree.opentreeoflife.org/',description:'整合已发表的系统发育研究；不应为了界面整齐而将未解析多分叉任意二叉化。'},
    {code:'timetree',name:'TimeTree',category:'分化年代',url:'https://timetree.org/',description:'汇编分子钟研究中的物种分化时间。正式接入需存储原始研究、估计区间和版本。'},
    {code:'ncbi',name:'NCBI Taxonomy',category:'分子序列',url:'https://www.ncbi.nlm.nih.gov/taxonomy',description:'为序列、基因组等分子资料提供分类标识，不应替代全部类群的唯一名称裁定。'},
    {code:'pbdb',name:'Paleobiology Database',category:'化石记录',url:'https://paleobiodb.org/',description:'查询化石出现记录与地层信息。最早发现的记录不等于该谱系真实起源时间。'},
    {code:'ics',name:'国际地层委员会 ICS',category:'地质年代',url:'https://stratigraphy.org/chart/',description:'发布国际年代地层表。地层界线值应随官方最新版本更新。'},
    {code:'eol',name:'Encyclopedia of Life',category:'性状与生态',url:'https://eol.org/',description:'汇集性状及生态相关资料；单项性状仍需记录原始文献与上下文。'},
    {code:'commons',name:'Wikimedia Commons',category:'开放媒体',url:'https://commons.wikimedia.org/',description:'媒体如需接入，必须保存作者、版权声明、许可证版本与原文件页。'}
  ],
  topics:[
    {category:'方法入门',title:'如何正确阅读系统发育树',url:'https://organismalbio.biosci.gatech.edu/biodiversity/phylogenetic-trees/',summary:'树梢排列位置不决定亲缘远近；共同祖先、分叉与根才是主要信息。'},
    {category:'早期生命 · 研究进展',title:'Asgard 古菌与真核起源',url:'https://www.nature.com/articles/s41579-026-01288-w',summary:'2026 年综述讨论 Asgard 古菌的多样性及其与真核细胞起源的联系，不能简单把传统三域模型视为最终定论。'},
    {category:'早期生命 · 研究综述',title:'真核生物起源的演化模型',url:'https://www.nature.com/articles/s41586-024-07677-6',summary:'真核细胞演化涉及古菌相关宿主与细菌来源的线粒体前体，起源年代与演化路径仍有不确定性。'},
    {category:'地质标准 · 2026',title:'国际年代地层表',url:'https://stratigraphy.org/chart/',summary:'官方地层年代标尺持续修订；图中的五次大灭绝时间仅作概略标记，不能当作完整事件边界。'},
    {category:'年代方法',title:'TimeTree 5 的时间综合方法',url:'https://doi.org/10.1093/molbev/msac174',summary:'分歧年代来自不同研究的综合估计，正式数据需要保留研究数量、区间与来源。'},
    {category:'演化拓扑',title:'Open Tree of Life API',url:'https://opentreeoflife.github.io/use',summary:'可通过 API 使用综合树和分类匹配，建议先做版本化、可审计的静态数据快照。'},
    {category:'化石数据',title:'PBDB 数据接口',url:'https://paleobiodb.org/data1.2/',summary:'支持化石出现记录等数据导出；注意标本鉴定、地层范围与保存偏差。'},
    {category:'大规模交互参考',title:'Oxford University Museum：生命之树',url:'https://oumnh.ox.ac.uk/reading-the-tree-of-life',summary:'自然历史博物馆对生命之树的展示强调读图与探索，而不是装饰性视觉。'}
  ]
};