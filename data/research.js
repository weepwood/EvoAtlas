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

/**
 * Categorized registry extension. These are curated REFERENCE ENTRIES, not
 * live API connections or verified evidence for every node shown in the tree.
 */
(() => {
  const registry=window.EVO_RESEARCH;
  registry.sources.push(
    {code:'itis',name:'ITIS',category:'分类名称',url:'https://www.itis.gov/',description:'整合学名、分类处理与名称参考信息，适用于跨库名称核对。'},
    {code:'worms',name:'WoRMS',category:'海洋分类',url:'https://www.marinespecies.org/',description:'海洋生物学名、接受名、异名及 Aphia 分类编号。'},
    {code:'powo',name:'Plants of the World Online',category:'植物分类',url:'https://powo.science.kew.org/',description:'Kew 汇集的全球植物分类与分布信息，可用于核对植物学名。'},
    {code:'ipni',name:'IPNI',category:'植物命名',url:'https://www.ipni.org/',description:'维管植物名称发表与命名信息索引，记录名称不等于裁定接受名。'},
    {code:'fungorum',name:'Index Fungorum',category:'真菌命名',url:'https://www.indexfungorum.org/',description:'真菌及相关生物名称的命名学索引，可用于检索名称与命名历史。'},
    {code:'treebase',name:'TreeBASE',category:'系统发育资料',url:'https://www.treebase.org/treebase-web/',description:'发表研究提交的系统发育树和支持数据，适合追踪具体研究。'},
    {code:'onezoom',name:'OneZoom',category:'可视化参考',url:'https://www.onezoom.org/',description:'大规模可缩放生命之树展示项目，主要用于交互设计参考。'},
    {code:'macrostrat',name:'Macrostrat',category:'地层数据',url:'https://macrostrat.org/',description:'整合地层单位、地质地图与地质文献数据，辅助理解岩层时空背景。'},
    {code:'bold',name:'BOLD Systems',category:'DNA 条形码',url:'https://www.boldsystems.org/',description:'DNA 条形码数据发布、检索与鉴定资源，需要核对标本和序列质量。'}
  );
  registry.groups=[
    {id:'taxonomy',name:'分类与命名',description:'核对学名、异名与命名状态。它们不是同一个系统发育树。'},
    {id:'phylogeny',name:'系统发育与分化时间',description:'独立核对树的拓扑、分化时间及原始论文。'},
    {id:'paleo',name:'化石与地质年代',description:'区分地层证据、化石出现和推测的分化时间。'},
    {id:'context',name:'性状、分子数据与媒体',description:'作为补充信息，保留单条记录的原始出处和使用限制。'}
  ];
  const detail={
    col:['taxonomy','接受名、异名、分类清单','分类等级不能直接代表分化顺序','https://www.catalogueoflife.org/'],
    gbif:['taxonomy','名称匹配、分类主干、出现记录','出现记录有采样偏差，不能直接表示丰度','https://techdocs.gbif.org/en/openapi/v1/species'],
    itis:['taxonomy','科学名称与 TSN 编号','不同数据库的分类观点不一定一致','https://www.itis.gov/'],
    worms:['taxonomy','海洋分类、AphiaID、异名','海洋物种覆盖重点，不适合替代陆域全量分类','https://www.marinespecies.org/aphia.php?p=webservice'],
    powo:['taxonomy','植物分类、接受名与分布','命名学来源仍应和 IPNI 区分','https://powo.science.kew.org/'],
    ipni:['taxonomy','植物名称、命名作者和发表记录','IPNI 不是完整的接受名审定数据库','https://www.ipni.org/'],
    fungorum:['taxonomy','真菌名称检索、命名学索引','需与 Species Fungorum 的接受名判断区分','https://www.indexfungorum.org/Names/Names.asp'],
    opentree:['phylogeny','综合系统发育拓扑与 OTT ID','可能有多分叉和研究冲突，须记录版本','https://opentreeoflife.github.io/use'],
    timetree:['phylogeny','物种分化时间和研究综合','不能将单个估计点当作确定时间','https://timetree.org/'],
    treebase:['phylogeny','论文发表所用的树及矩阵','研究提交的结果不代表统一公认拓扑','https://www.treebase.org/treebase-web/'],
    onezoom:['phylogeny','大规模缩放交互与生命树阅读','主要作为可视化参考，不是独立的验证源','https://www.onezoom.org/'],
    pbdb:['paleo','化石出现记录、年代与地层','最早已发现化石不等于真实起源','https://paleobiodb.org/data1.2/'],
    ics:['paleo','国际地质年代边界','具体年龄应按官方版本更新','https://stratigraphy.org/chart/'],
    macrostrat:['paleo','地层单位与地质地图','地层空间覆盖和推断分辨率存在差异','https://www.macrostrat.org/docs/data-services'],
    ncbi:['context','NCBI Taxonomy ID 与分子资源关联','并非全部物种的唯一命名学裁判','https://www.ncbi.nlm.nih.gov/taxonomy'],
    eol:['context','性状、生态和描述内容','仍需核对每条性状的测量背景','https://eol.org/'],
    bold:['context','DNA 条形码、鉴定和序列记录','条形码聚类并不自动等于物种界限','https://portal.boldsystems.org/'],
    commons:['context','媒体作者、授权及原始文件页','第三方图片的许可证需逐张核验','https://commons.wikimedia.org/']
  };
  registry.sources.forEach(source=>{
    const [group,usage,limitation,resourceUrl]=detail[source.code]||['context','','需要原始资料核验',source.url];
    Object.assign(source,{group,usage,limitation,resourceUrl});
  });
})();