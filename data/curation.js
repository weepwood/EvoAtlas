/**
 * EvoAtlas editorial overlay, 2026-11.
 * Remove generated Survey-clade placeholders. All dates remain pedagogical
 * coordinates, not sourced molecular-clock estimates.
 * See docs/research-notes-2026.md before reusing scientifically.
 */
(() => {
  'use strict';
  if(!Array.isArray(window.EVO_TAXA))return;
  const taxa=window.EVO_TAXA.filter(n=>!/^survey-\d+$/.test(n.id));
  const byId=new Map(taxa.map(n=>[n.id,n]));
  const patch=(id,values)=>{if(byId.has(id))Object.assign(byId.get(id),values);};
  patch('arthropoda',{parent:'ecdysozoa'});
  patch('cetacea',{parent:'cetartiodactyla'});
  patch('aves',{parent:'avialae'});
  patch('archaeopteryx',{parent:'avialae',summary:'早期鸟翼类化石，不能直接视为现代鸟类的确定直系祖先。'});
  patch('tyrannosaurus',{parent:'theropoda'});
  patch('luca',{summary:'所有现生细胞生命最近共同祖先的概念；约 40 亿年前仅为教学坐标，不是精确年代。',confidence:'low'});
  patch('eukaryota',{summary:'真核细胞起源涉及古菌相关祖先与细菌内共生。真核生物在深层树中的确切位置仍有研究争议。'});
  patch('archaea',{summary:'古菌是多样的细胞生命谱系；Asgard 古菌与真核起源的关系是重要研究方向。'});
  const rows=[
    'cyanobacteriota|bacteria|蓝细菌门|Cyanobacteriota|门|2500|bacteria|ancestral|放氧光合,代谢多样|放氧光合作用的重要谱系',
    'synechocystis|cyanobacteriota|集胞藻 PCC 6803|Synechocystis sp. PCC 6803|种|0|bacteria|extant|光合作用,模式微生物|光合作用研究中的蓝细菌模式株',
    'pseudomonadota|bacteria|变形菌门|Pseudomonadota|门|2000|bacteria|ancestral|代谢多样,广泛分布|常见旧称为 Proteobacteria',
    'escherichia|pseudomonadota|大肠杆菌|Escherichia coli|种|0|bacteria|extant|遗传学,肠道生态|部分菌株为致病菌，常用于细菌遗传研究',
    'bacillota|bacteria|厚壁菌门|Bacillota|门|1800|bacteria|ancestral|细胞壁,代谢多样|包含多样的革兰氏阳性细菌',
    'bacillus|bacillota|枯草芽孢杆菌|Bacillus subtilis|种|0|bacteria|extant|芽孢形成,模式细菌|研究细胞调控与芽孢形成的模式微生物',
    'asgard|archaea|阿斯加德古菌|Asgardarchaeota|总群|2200|archaea|ancestral|真核相关蛋白,代谢多样|与真核生物演化起源密切相关，但深层关系仍在研究',
    'euryarchaeota|archaea|广古菌类|Euryarchaeota|门|2000|archaea|ancestral|产甲烷,多样代谢|传统分类名称，边界可能随着系统发育研究修订',
    'methanobrevibacter|euryarchaeota|史密斯甲烷短杆菌|Methanobrevibacter smithii|种|0|archaea|extant|产甲烷,肠道共生|人类肠道中常见的产甲烷古菌',
    'amoebozoa|eukaryota|变形虫类|Amoebozoa|总群|1000|eukaryota|ancestral|细胞运动,吞噬作用|真核生物的重要谱系',
    'dictyostelium|amoebozoa|盘基网柄菌|Dictyostelium discoideum|种|0|eukaryota|extant|聚集发育,细胞运动|研究多细胞行为的模式生物',
    'rhodophyta|archaeplastida|红藻门|Rhodophyta|门|1200|plant|ancestral|质体,光合作用|具有初级色素体的光合真核谱系',
    'porphyra|rhodophyta|紫菜类|Porphyra umbilicalis|种|0|plant|extant|海洋光合,多细胞|海洋红藻代表物种',
    'bryophyta|embryophyta|藓类植物|Bryophyta|门|440|plant|ancestral|孢子繁殖,非维管|陆生植物中非维管的一支',
    'physcomitrium|bryophyta|小立碗藓|Physcomitrium patens|种|0|plant|extant|再生,模式苔藓|植物发育研究的模式苔藓',
    'cnidaria|metazoa|刺胞动物|Cnidaria|门|590|animal|ancestral|刺细胞,辐射对称|包含珊瑚、水母及海葵',
    'acropora|cnidaria|鹿角珊瑚|Acropora millepora|种|0|animal|extant|珊瑚礁,共生|常用于研究珊瑚共生与环境压力',
    'ecdysozoa|protostomia|蜕皮动物|Ecdysozoa|总群|560|animal|ancestral|蜕皮,角质结构|包含节肢动物与线虫等',
    'nematoda|ecdysozoa|线虫门|Nematoda|门|525|animal|ancestral|蜕皮,线形体制|具有多样生活方式的无脊椎类群',
    'caenorhabditis|nematoda|秀丽隐杆线虫|Caenorhabditis elegans|种|0|animal|extant|细胞谱系,模式动物|发育和神经科学的模式动物',
    'insecta|arthropoda|昆虫纲|Insecta|纲|400|animal|ancestral|六足,变态|多样陆地及淡水动物',
    'lepidoptera|insecta|鳞翅目|Lepidoptera|目|190|animal|ancestral|鳞翅,完全变态|包括蝴蝶及蛾类',
    'danaus|lepidoptera|黑脉金斑蝶|Danaus plexippus|种|0|animal|extant|迁徙,警戒色|长距离迁徙研究的代表蝴蝶',
    'diptera|insecta|双翅目|Diptera|目|245|animal|ancestral|单对功能翅,完全变态|包括蝇与蚊等昆虫',
    'drosophila|diptera|黑腹果蝇|Drosophila melanogaster|种|0|animal|extant|遗传学,模式动物|经典遗传学与发育生物学模式生物',
    'spiralia|protostomia|螺旋卵裂动物|Spiralia|总群|550|animal|ancestral|多样胚胎发育,海洋谱系|原口动物中的重要演化支系',
    'mollusca|spiralia|软体动物门|Mollusca|门|530|animal|ancestral|外套膜,多样体制|包含贝类、腹足类与头足类',
    'octopus|mollusca|普通章鱼|Octopus vulgaris|种|0|animal|extant|腕足,复杂行为|头足类神经与行为研究代表物种',
    'echinodermata|deuterostomia|棘皮动物门|Echinodermata|门|520|animal|ancestral|水管系统,次生辐射对称|包含海星与海胆等海洋动物',
    'asterias|echinodermata|普通海星|Asterias rubens|种|0|animal|extant|管足,再生|典型海洋棘皮动物',
    'chondrichthyes|gnathostomata|软骨鱼纲|Chondrichthyes|纲|420|vertebrate|ancestral|软骨骨骼,有颌|包含鲨和鳐等',
    'carcharodon|chondrichthyes|大白鲨|Carcharodon carcharias|种|0|vertebrate|extant|大型捕食,感知系统|软骨鱼中的代表物种',
    'actinopterygii|gnathostomata|辐鳍鱼纲|Actinopterygii|纲|420|vertebrate|ancestral|鳍条,水生多样|包含多数现生鱼类',
    'danio|actinopterygii|斑马鱼|Danio rerio|种|0|vertebrate|extant|透明胚胎,模式脊椎动物|发育生物学模式脊椎动物',
    'lissamphibia|tetrapoda|现生两栖类|Lissamphibia|总群|320|vertebrate|ancestral|变态发育,皮肤呼吸|现生蛙类、蝾螈与蚓螈所在支系',
    'xenopus|lissamphibia|热带爪蟾|Xenopus tropicalis|种|0|vertebrate|extant|胚胎发育,模式动物|发育研究中的模式脊椎动物',
    'theropoda|dinosauria|兽脚类恐龙|Theropoda|总群|230|vertebrate|ancestral|羽毛演化,后肢运动|包含非鸟兽脚类和鸟类谱系',
    'avialae|theropoda|鸟翼类|Avialae|总群|160|vertebrate|ancestral|羽毛,飞行形态|包含早期鸟翼类化石与现代鸟类',
    'monotremata|mammalia|单孔目|Monotremata|目|180|mammal|ancestral|产卵,哺乳|现生哺乳动物中卵生的一支',
    'ornithorhynchus|monotremata|鸭嘴兽|Ornithorhynchus anatinus|种|0|mammal|extant|产卵,电感受|现生单孔类代表',
    'metatheria|mammalia|后兽类|Metatheria|总群|125|mammal|ancestral|育幼策略,哺乳|有袋类所属的哺乳动物支系',
    'macropus|metatheria|东部灰大袋鼠|Macropus giganteus|种|0|mammal|extant|育儿袋,跳跃运动|现生有袋类代表',
    'cetartiodactyla|eutheria|鲸偶蹄目|Cetartiodactyla|目|80|mammal|ancestral|水陆适应,形态分化|鲸类与偶蹄类属于这一共同谱系',
    'hylobatidae|hominoidea|长臂猿科|Hylobatidae|科|18|primate|ancestral|臂行,树栖|与人科共享较早共同祖先的类人猿分支',
    'hylobates|hylobatidae|白掌长臂猿|Hylobates lar|种|0|primate|extant|臂行,鸣唱|现生小型类人猿之一'
  ];
  rows.forEach(line=>{
    const [id,parent,zh,latin,rank,age,clade,status,traits,summary]=line.split('|');
    if(byId.has(id))throw new Error('Duplicate curated taxon: '+id);
    const n={id,parent,zh,latin,rank,ageMa:Number(age),clade,status,traits:traits.split(','),summary,
      confidence:'medium',sources:status==='extinct'?['pbdb','opentree']:['col','gbif','opentree','timetree']};
    taxa.push(n);byId.set(id,n);
  });
  window.EVO_TAXA=taxa;
  window.EVO_CURATION={edition:'2026-11',kind:'pedagogical',note:'教学近似数据；非逐节点核验的科学树'};
})();