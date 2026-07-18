(() => {
  const rows = `
luca||生命共同祖先|LUCA|共同祖先|4000|life|ancestral|✦
bacteria|luca|细菌域|Bacteria|域|3800|bacteria|ancestral|🦠
archaea|luca|古菌域|Archaea|域|3700|archaea|ancestral|🧫
eukaryota|luca|真核生物|Eukaryota|域|2100|eukaryota|ancestral|◉
archaeplastida|eukaryota|原始色素体生物|Archaeplastida|总群|1600|plant|ancestral|🌱
viridiplantae|archaeplastida|绿色植物|Viridiplantae|界|1000|plant|ancestral|🌿
embryophyta|viridiplantae|陆生植物|Embryophyta|总群|470|plant|ancestral|🌾
tracheophyta|embryophyta|维管植物|Tracheophyta|门|425|plant|ancestral|🌿
spermatophyta|tracheophyta|种子植物|Spermatophyta|总群|365|plant|ancestral|🌰
angiosperms|spermatophyta|被子植物|Angiospermae|总群|140|plant|ancestral|🌸
brassicaceae|angiosperms|十字花科|Brassicaceae|科|50|plant|ancestral|🌼
arabidopsis|brassicaceae|拟南芥|Arabidopsis thaliana|种|0|plant|extant|🌼
opisthokonta|eukaryota|后鞭毛生物|Opisthokonta|总群|1100|eukaryota|ancestral|◌
fungi|opisthokonta|真菌界|Fungi|界|900|fungi|ancestral|🍄
ascomycota|fungi|子囊菌门|Ascomycota|门|500|fungi|ancestral|🍄
saccharomyces|ascomycota|酿酒酵母|Saccharomyces cerevisiae|种|0|fungi|extant|🧪
metazoa|opisthokonta|动物界|Metazoa|界|700|animal|ancestral|🐾
bilateria|metazoa|两侧对称动物|Bilateria|总群|620|animal|ancestral|↔
protostomia|bilateria|原口动物|Protostomia|总群|590|animal|ancestral|◆
arthropoda|protostomia|节肢动物门|Arthropoda|门|540|animal|ancestral|🦋
deuterostomia|bilateria|后口动物|Deuterostomia|总群|580|animal|ancestral|◆
chordata|deuterostomia|脊索动物门|Chordata|门|540|vertebrate|ancestral|〰
vertebrata|chordata|脊椎动物|Vertebrata|总群|520|vertebrate|ancestral|🐟
gnathostomata|vertebrata|有颌类|Gnathostomata|总群|440|vertebrate|ancestral|🐠
sarcopterygii|gnathostomata|肉鳍鱼类|Sarcopterygii|总群|420|vertebrate|ancestral|🐟
tetrapodomorpha|sarcopterygii|四足形类|Tetrapodomorpha|总群|390|vertebrate|ancestral|🐟
tiktaalik|tetrapodomorpha|提塔利克鱼|Tiktaalik roseae|种|375|vertebrate|extinct|🐟
tetrapoda|tetrapodomorpha|四足动物|Tetrapoda|总群|365|vertebrate|ancestral|🐾
amniota|tetrapoda|羊膜动物|Amniota|总群|320|vertebrate|ancestral|🥚
sauropsida|amniota|蜥形纲|Sauropsida|总群|315|vertebrate|ancestral|◆
dinosauria|sauropsida|恐龙总目|Dinosauria|总群|235|vertebrate|ancestral|🦖
tyrannosaurus|dinosauria|霸王龙|Tyrannosaurus rex|种|68|vertebrate|extinct|🦖
aves|dinosauria|鸟类|Aves|纲|150|vertebrate|ancestral|🪶
archaeopteryx|aves|始祖鸟|Archaeopteryx lithographica|种|150|vertebrate|extinct|🪶
galliformes|aves|鸡形目|Galliformes|目|85|vertebrate|ancestral|🐔
gallus|galliformes|原鸡|Gallus gallus|种|0|vertebrate|extant|🐔
synapsida|amniota|合弓纲|Synapsida|总群|315|mammal|ancestral|◆
mammalia|synapsida|哺乳纲|Mammalia|纲|225|mammal|ancestral|🐘
eutheria|mammalia|真兽类|Eutheria|总群|125|mammal|ancestral|◆
carnivora|eutheria|食肉目|Carnivora|目|55|mammal|ancestral|🐾
canidae|carnivora|犬科|Canidae|科|40|mammal|ancestral|🐺
canis|canidae|灰狼|Canis lupus|种|0|mammal|extant|🐺
felidae|carnivora|猫科|Felidae|科|25|mammal|ancestral|🐈
felis|felidae|家猫|Felis catus|种|0|mammal|extant|🐈
cetacea|eutheria|鲸下目|Cetacea|下目|50|mammal|ancestral|🐋
balaenoptera|cetacea|蓝鲸|Balaenoptera musculus|种|0|mammal|extant|🐋
rodentia|eutheria|啮齿目|Rodentia|目|60|mammal|ancestral|🐁
mus|rodentia|小家鼠|Mus musculus|种|0|mammal|extant|🐁
primates|eutheria|灵长目|Primates|目|65|primate|ancestral|🐒
hominoidea|primates|人猿总科|Hominoidea|总科|20|primate|ancestral|🦧
hominidae|hominoidea|人科|Hominidae|科|14|primate|ancestral|◆
ponginae|hominidae|猩猩亚科|Ponginae|亚科|12|primate|ancestral|🦧
pongo|ponginae|婆罗洲猩猩|Pongo pygmaeus|种|0|primate|extant|🦧
homininae|hominidae|人亚科|Homininae|亚科|10|primate|ancestral|◆
gorillini|homininae|大猩猩族|Gorillini|族|8.5|primate|ancestral|🦍
gorilla|gorillini|西部大猩猩|Gorilla gorilla|种|0|primate|extant|🦍
hominini|homininae|人族|Hominini|族|7.5|human|ancestral|◆
panina|hominini|黑猩猩亚族|Panina|亚族|7|human|ancestral|🐵
pan|panina|黑猩猩|Pan troglodytes|种|0|human|extant|🐵
hominina|hominini|人亚族|Hominina|亚族|7|human|ancestral|🧑
australopithecus|hominina|南方古猿|Australopithecus afarensis|种|3.9|human|extinct|🦴
homo|hominina|人属|Homo|属|2.8|human|ancestral|🧑
neanderthal|homo|尼安德特人|Homo neanderthalensis|种|0.4|human|extinct|🧔
sapiens|homo|智人|Homo sapiens|种|0|human|extant|🧑`.trim();
  const special = {
    luca:['细胞生命,遗传系统','所有现生细胞生命可追溯到的共同祖先概念。','medium'],
    bacteria:['原核细胞,代谢多样','覆盖极其多样的原核生物谱系。','high'],
    archaea:['原核细胞,极端环境适应','与真核生物具有重要的深层亲缘联系。','high'],
    eukaryota:['细胞核,细胞器','拥有细胞核与复杂细胞器的生命谱系。','medium'],
    arabidopsis:['模式植物,小型基因组','植物遗传与发育研究的重要模式物种。','high'],
    saccharomyces:['发酵,模式真核生物','广泛用于发酵工业与细胞生物学研究。','high'],
    tiktaalik:['镶嵌特征,可活动颈部','展示鱼类向四足动物过渡特征的近缘化石类群。','high'],
    archaeopteryx:['羽毛,牙齿与长尾','具有鸟类与非鸟恐龙特征的侏罗纪化石类群。','medium'],
    pan:['工具使用,复杂社会','并非人类祖先，而是与人类共享共同祖先的姐妹谱系。','high'],
    australopithecus:['两足行走,较小脑容量','早期人族代表性化石，不等于现代人的确定直系祖先。','high'],
    neanderthal:['寒冷适应,基因交流','欧亚古人类，与部分现代人祖先发生过基因交流。','high'],
    sapiens:['符号文化,全球扩散','现生人类是生命之树上众多现生分支之一。','high']
  };
  const ranges={tiktaalik:[375,375],tyrannosaurus:[68,66],archaeopteryx:[150,148],australopithecus:[3.9,2.9],neanderthal:[.4,.04]};
  const source = id => ranges[id]?['pbdb','opentree']:['col','gbif','opentree','timetree'];
  const taxa=rows.split('\n').map(line=>{const [id,parent,zh,latin,rank,ageMa,clade,status,emoji]=line.split('|'),s=special[id]||['代表性状,谱系特征',`${zh}是生命之树中的代表性类群节点。`,'high'],r=ranges[id];return {id,parent:parent||null,zh,latin,rank,ageMa:+ageMa,clade,status,emoji,traits:s[0].split(','),summary:s[1],confidence:s[2],sources:source(id),...(r?{firstMa:r[0],lastMa:r[1]}:{})};});
  const groups=[['bacteria','细菌聚合支系',28,3600],['archaea','古菌聚合支系',10,3400],['viridiplantae','植物聚合支系',4,900]];
  let i=1; for(const [parent,zh,count,start] of groups)for(let j=1;j<=count;j++,i++)taxa.push({id:`survey-${i}`,parent,zh:`${zh} ${j}`,latin:`Survey clade ${i}`,rank:'支系',ageMa:Math.max(1,start-j*25),clade:parent,status:'ancestral',emoji:'•',traits:['聚合节点'],summary:'用于表示尚未展开的分类支系。',confidence:'medium',sources:['col','opentree']});
  window.EVO_TAXA=taxa.slice(0,106);
})();
