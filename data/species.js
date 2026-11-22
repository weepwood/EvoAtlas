/**
 * EvoAtlas representative species catalogue (2026-11).
 *
 * These are REAL scientific names deliberately curated for exploratory
 * navigation, not generated placeholder clades. Existing LUCA/root chronology
 * and ageMa are pedagogical coordinates: never interpret a taxonomic parent
 * here as a proven direct ancestor or a calibrated divergence estimate.
 *
 * Scientific name spellings and higher-level placement are editorial entries.
 * Source mapping to CoL/GBIF/OTT IDs and release-level verification is still
 * pending. Do not describe this file as a verified live API extraction.
 * Learn more: docs/species-catalogue.md.
 */
(() => {
  'use strict';
  const taxonomy = `
basidiomycota|fungi|担子菌门|Basidiomycota|门|490|fungi
marchantiophyta|embryophyta|苔类植物|Marchantiophyta|门|430|plant
polypodiopsida|tracheophyta|蕨类植物|Polypodiopsida|纲|380|plant
pinopsida|spermatophyta|松柏纲|Pinopsida|纲|310|plant
ginkgoopsida|spermatophyta|银杏纲|Ginkgoopsida|纲|310|plant
cycadopsida|spermatophyta|苏铁纲|Cycadopsida|纲|310|plant
poaceae|angiosperms|禾本科|Poaceae|科|75|plant
fabaceae|angiosperms|豆科|Fabaceae|科|75|plant
rosaceae|angiosperms|蔷薇科|Rosaceae|科|70|plant
solanaceae|angiosperms|茄科|Solanaceae|科|70|plant
asteraceae|angiosperms|菊科|Asteraceae|科|60|plant
malvaceae|angiosperms|锦葵科|Malvaceae|科|70|plant
rutaceae|angiosperms|芸香科|Rutaceae|科|70|plant
lamiaceae|angiosperms|唇形科|Lamiaceae|科|65|plant
cucurbitaceae|angiosperms|葫芦科|Cucurbitaceae|科|65|plant
coleoptera|insecta|鞘翅目|Coleoptera|目|255|animal
hymenoptera|insecta|膜翅目|Hymenoptera|目|235|animal
orthoptera|insecta|直翅目|Orthoptera|目|245|animal
arachnida|arthropoda|蛛形纲|Arachnida|纲|440|animal
malacostraca|arthropoda|软甲纲|Malacostraca|纲|430|animal
branchiopoda|arthropoda|鳃足纲|Branchiopoda|纲|410|animal
archosauria|sauropsida|主龙类|Archosauria|总群|250|vertebrate
squamata|sauropsida|有鳞目|Squamata|目|195|vertebrate
testudines|sauropsida|龟鳖目|Testudines|目|210|vertebrate
crocodylia|archosauria|鳄目|Crocodylia|目|85|vertebrate
passeriformes|aves|雀形目|Passeriformes|目|60|vertebrate
anseriformes|aves|雁形目|Anseriformes|目|70|vertebrate
accipitriformes|aves|鹰形目|Accipitriformes|目|60|vertebrate
strigiformes|aves|鸮形目|Strigiformes|目|60|vertebrate
sphenisciformes|aves|企鹅目|Sphenisciformes|目|60|vertebrate
ursidae|carnivora|熊科|Ursidae|科|20|mammal
mustelidae|carnivora|鼬科|Mustelidae|科|24|mammal
phocidae|carnivora|海豹科|Phocidae|科|21|mammal
chiroptera|eutheria|翼手目|Chiroptera|目|55|mammal
perissodactyla|eutheria|奇蹄目|Perissodactyla|目|55|mammal
proboscidea|eutheria|长鼻目|Proboscidea|目|55|mammal
lagomorpha|eutheria|兔形目|Lagomorpha|目|55|mammal
ruminantia|cetartiodactyla|反刍亚目|Ruminantia|亚目|50|mammal
  `.trim();

  const species = `
cyanobacteriota|念珠藻|Nostoc commune
cyanobacteriota|铜绿微囊藻|Microcystis aeruginosa
cyanobacteriota|海洋原绿球藻|Prochlorococcus marinus
cyanobacteriota|集胞藻 PCC 7942|Synechococcus elongatus
cyanobacteriota|多变鱼腥藻|Anabaena variabilis
pseudomonadota|肠炎沙门氏菌|Salmonella enterica
pseudomonadota|霍乱弧菌|Vibrio cholerae
pseudomonadota|铜绿假单胞菌|Pseudomonas aeruginosa
pseudomonadota|豌豆根瘤菌|Rhizobium leguminosarum
pseudomonadota|鼠疫耶尔森菌|Yersinia pestis
pseudomonadota|脑膜炎奈瑟菌|Neisseria meningitidis
pseudomonadota|普氏立克次体|Rickettsia prowazekii
pseudomonadota|嗜肺军团菌|Legionella pneumophila
pseudomonadota|醋酸杆菌|Acetobacter aceti
pseudomonadota|肺炎克雷伯菌|Klebsiella pneumoniae
bacillota|金黄色葡萄球菌|Staphylococcus aureus
bacillota|化脓性链球菌|Streptococcus pyogenes
bacillota|肉毒梭菌|Clostridium botulinum
bacillota|嗜酸乳杆菌|Lactobacillus acidophilus
bacillota|单核细胞增生李斯特菌|Listeria monocytogenes
bacillota|炭疽芽孢杆菌|Bacillus anthracis
bacillota|粪肠球菌|Enterococcus faecalis
bacillota|肺炎链球菌|Streptococcus pneumoniae
euryarchaeota|海洋甲烷球菌|Methanococcus maripaludis
euryarchaeota|詹氏甲烷暖球菌|Methanocaldococcus jannaschii
euryarchaeota|火山盐盒菌|Haloferax volcanii
euryarchaeota|嗜盐菌|Halobacterium salinarum
euryarchaeota|巴克甲烷八叠球菌|Methanosarcina barkeri
euryarchaeota|编码热球菌|Thermococcus kodakarensis
ascomycota|粗糙脉孢菌|Neurospora crassa
ascomycota|黑曲霉|Aspergillus niger
ascomycota|烟曲霉|Aspergillus fumigatus
ascomycota|白色念珠菌|Candida albicans
ascomycota|裂殖酵母|Schizosaccharomyces pombe
ascomycota|黑孢块菌|Tuber melanosporum
ascomycota|羊肚菌|Morchella esculenta
ascomycota|尖孢镰刀菌|Fusarium oxysporum
ascomycota|麦角菌|Claviceps purpurea
ascomycota|里氏木霉|Trichoderma reesei
ascomycota|巴斯德毕赤酵母（旧称）|Saccharomyces paradoxus
ascomycota|粪生粪壳菌|Sordaria fimicola
ascomycota|灰葡萄孢|Botrytis cinerea
ascomycota|蛹虫草|Cordyceps militaris
basidiomycota|双孢蘑菇|Agaricus bisporus
basidiomycota|毒蝇伞|Amanita muscaria
basidiomycota|毒鹅膏|Amanita phalloides
basidiomycota|平菇|Pleurotus ostreatus
basidiomycota|香菇|Lentinula edodes
basidiomycota|灵芝|Ganoderma lucidum
basidiomycota|灰盖鬼伞|Coprinopsis cinerea
basidiomycota|玉米黑粉菌|Ustilago maydis
basidiomycota|禾柄锈菌|Puccinia graminis
basidiomycota|新型隐球菌|Cryptococcus neoformans
basidiomycota|裂褶菌|Schizophyllum commune
basidiomycota|云芝|Trametes versicolor
basidiomycota|毛木耳|Auricularia auricula-judae
viridiplantae|莱茵衣藻|Chlamydomonas reinhardtii
viridiplantae|卡氏团藻|Volvox carteri
viridiplantae|石莼|Ulva lactuca
viridiplantae|普通小球藻|Chlorella vulgaris
viridiplantae|盐生杜氏藻|Dunaliella salina
rhodophyta|皱波角叉菜|Chondrus crispus
rhodophyta|条斑紫菜|Pyropia yezoensis
rhodophyta|掌状红皮藻|Palmaria palmata
bryophyta|泥炭藓|Sphagnum palustre
bryophyta|葫芦藓|Funaria hygrometrica
bryophyta|金发藓|Polytrichum commune
bryophyta|灰藓|Hypnum cupressiforme
bryophyta|银叶真藓|Bryum argenteum
marchantiophyta|地钱|Marchantia polymorpha
marchantiophyta|浮萍地钱|Riccia fluitans
polypodiopsida|欧洲蕨|Pteridium aquilinum
polypodiopsida|铁线蕨|Adiantum capillus-veneris
polypodiopsida|肾蕨|Nephrolepis exaltata
polypodiopsida|雄鳞毛蕨|Dryopteris filix-mas
polypodiopsida|满江红|Azolla filiculoides
polypodiopsida|槐叶苹|Salvinia molesta
pinopsida|欧洲赤松|Pinus sylvestris
pinopsida|辐射松|Pinus radiata
pinopsida|意大利石松|Pinus pinea
pinopsida|欧洲云杉|Picea abies
pinopsida|欧洲冷杉|Abies alba
pinopsida|黎巴嫩雪松|Cedrus libani
pinopsida|欧洲落叶松|Larix decidua
pinopsida|北美红杉|Sequoia sempervirens
pinopsida|巨杉|Sequoiadendron giganteum
pinopsida|欧洲红豆杉|Taxus baccata
ginkgoopsida|银杏|Ginkgo biloba
cycadopsida|苏铁|Cycas revoluta
cycadopsida|墨西哥泽米铁|Zamia furfuracea
poaceae|水稻|Oryza sativa
poaceae|普通小麦|Triticum aestivum
poaceae|玉米|Zea mays
poaceae|大麦|Hordeum vulgare
poaceae|燕麦|Avena sativa
poaceae|高粱|Sorghum bicolor
poaceae|甘蔗|Saccharum officinarum
poaceae|龙头竹|Bambusa vulgaris
poaceae|谷子|Setaria italica
poaceae|黍|Panicum miliaceum
poaceae|二穗短柄草|Brachypodium distachyon
fabaceae|豌豆|Pisum sativum
fabaceae|大豆|Glycine max
fabaceae|菜豆|Phaseolus vulgaris
fabaceae|花生|Arachis hypogaea
fabaceae|蒺藜苜蓿|Medicago truncatula
fabaceae|蚕豆|Vicia faba
fabaceae|鹰嘴豆|Cicer arietinum
fabaceae|小扁豆|Lens culinaris
fabaceae|白三叶|Trifolium repens
fabaceae|白羽扇豆|Lupinus albus
fabaceae|银荆|Acacia dealbata
rosaceae|苹果|Malus domestica
rosaceae|欧洲梨|Pyrus communis
rosaceae|桃|Prunus persica
rosaceae|欧洲甜樱桃|Prunus avium
rosaceae|欧洲李|Prunus domestica
rosaceae|野草莓|Fragaria vesca
rosaceae|犬蔷薇|Rosa canina
rosaceae|欧洲覆盆子|Rubus idaeus
rosaceae|枇杷|Eriobotrya japonica
rosaceae|欧洲山楂|Crataegus monogyna
solanaceae|番茄|Solanum lycopersicum
solanaceae|马铃薯|Solanum tuberosum
solanaceae|茄子|Solanum melongena
solanaceae|辣椒|Capsicum annuum
solanaceae|烟草|Nicotiana tabacum
solanaceae|矮牵牛|Petunia axillaris
solanaceae|秘鲁酸浆|Physalis peruviana
solanaceae|曼陀罗|Datura stramonium
solanaceae|颠茄|Atropa belladonna
asteraceae|向日葵|Helianthus annuus
asteraceae|莴苣|Lactuca sativa
asteraceae|蒲公英|Taraxacum officinale
asteraceae|黄花蒿|Artemisia annua
asteraceae|菊苣|Cichorium intybus
asteraceae|雏菊|Bellis perennis
asteraceae|金盏花|Calendula officinalis
brassicaceae|甘蓝|Brassica oleracea
brassicaceae|白菜型油菜|Brassica rapa
brassicaceae|油菜|Brassica napus
brassicaceae|萝卜|Raphanus sativus
brassicaceae|荠菜|Capsella bursa-pastoris
brassicaceae|山葵|Eutrema japonicum
brassicaceae|琴叶拟南芥|Arabidopsis lyrata
brassicaceae|白芥|Sinapis alba
malvaceae|陆地棉|Gossypium hirsutum
malvaceae|可可|Theobroma cacao
malvaceae|朱槿|Hibiscus rosa-sinensis
malvaceae|黄秋葵|Abelmoschus esculentus
rutaceae|甜橙|Citrus sinensis
rutaceae|柠檬|Citrus limon
rutaceae|橘|Citrus reticulata
rutaceae|柚|Citrus maxima
lamiaceae|留兰香|Mentha spicata
lamiaceae|罗勒|Ocimum basilicum
lamiaceae|迷迭香|Salvia rosmarinus
lamiaceae|薰衣草|Lavandula angustifolia
lamiaceae|百里香|Thymus vulgaris
cucurbitaceae|黄瓜|Cucumis sativus
cucurbitaceae|甜瓜|Cucumis melo
cucurbitaceae|西瓜|Citrullus lanatus
cucurbitaceae|西葫芦|Cucurbita pepo
cucurbitaceae|瓠瓜|Lagenaria siceraria
cnidaria|海月水母|Aurelia aurita
cnidaria|普通水螅|Hydra vulgaris
cnidaria|星海葵|Nematostella vectensis
cnidaria|红海葵|Actinia equina
cnidaria|鹿角珊瑚|Acropora palmata
cnidaria|僧帽水母|Physalia physalis
nematoda|人蛔虫|Ascaris lumbricoides
nematoda|马来丝虫|Brugia malayi
nematoda|旋毛虫|Trichinella spiralis
nematoda|太平洋隐杆线虫|Pristionchus pacificus
nematoda|十二指肠钩虫|Ancylostoma duodenale
nematoda|粪类圆线虫|Strongyloides stercoralis
mollusca|双斑章鱼|Octopus bimaculoides
mollusca|大蓝章鱼|Octopus cyanea
mollusca|欧洲乌贼|Sepia officinalis
mollusca|欧洲枪乌贼|Loligo vulgaris
mollusca|大王乌贼|Architeuthis dux
mollusca|贻贝|Mytilus edulis
mollusca|红鲍|Haliotis rufescens
mollusca|葡萄蜗牛|Helix pomatia
mollusca|加州海兔|Aplysia californica
mollusca|光滑双脐螺|Biomphalaria glabrata
echinodermata|紫海胆|Strongylocentrotus purpuratus
echinodermata|欧洲紫海胆|Paracentrotus lividus
echinodermata|福氏海星|Asterias forbesi
echinodermata|赭色海星|Pisaster ochraceus
echinodermata|黑海参|Holothuria atra
lepidoptera|凤蝶|Papilio machaon
lepidoptera|黑凤蝶|Papilio polyxenes
lepidoptera|菜粉蝶|Pieris rapae
lepidoptera|红蛱蝶|Vanessa atalanta
lepidoptera|小红蛱蝶|Vanessa cardui
lepidoptera|大蓝闪蝶|Morpho menelaus
lepidoptera|家蚕|Bombyx mori
lepidoptera|烟草天蛾|Manduca sexta
lepidoptera|黑脉蛱蝶|Heliconius melpomene
lepidoptera|眼蝶|Bicyclus anynana
diptera|拟果蝇|Drosophila simulans
diptera|雅库巴果蝇|Drosophila yakuba
diptera|冈比亚按蚊|Anopheles gambiae
diptera|埃及伊蚊|Aedes aegypti
diptera|库蚊|Culex pipiens
diptera|家蝇|Musca domestica
diptera|丝光绿蝇|Lucilia sericata
diptera|地中海实蝇|Ceratitis capitata
coleoptera|七星瓢虫|Coccinella septempunctata
coleoptera|黄粉虫|Tenebrio molitor
coleoptera|赤拟谷盗|Tribolium castaneum
coleoptera|山松大小蠹|Dendroctonus ponderosae
coleoptera|异色瓢虫|Harmonia axyridis
coleoptera|白蜡窄吉丁|Agrilus planipennis
hymenoptera|西方蜜蜂|Apis mellifera
hymenoptera|地熊蜂|Bombus terrestris
hymenoptera|北美熊蜂|Bombus impatiens
hymenoptera|红林蚁|Formica rufa
hymenoptera|红火蚁|Solenopsis invicta
hymenoptera|切叶蚁|Atta cephalotes
hymenoptera|寄生蜂|Nasonia vitripennis
hymenoptera|亚洲大胡蜂|Vespa mandarinia
orthoptera|东亚飞蝗|Locusta migratoria
orthoptera|沙漠蝗|Schistocerca gregaria
orthoptera|双斑蟋蟀|Gryllus bimaculatus
orthoptera|家蟋蟀|Acheta domesticus
orthoptera|绿螽斯|Tettigonia viridissima
arachnida|十字园蛛|Araneus diadematus
arachnida|黑寡妇蛛|Latrodectus mactans
arachnida|西部寡妇蛛|Latrodectus hesperus
arachnida|狼蛛|Lycosa tarantula
arachnida|肩突硬蜱|Ixodes scapularis
arachnida|疥螨|Sarcoptes scabiei
arachnida|二斑叶螨|Tetranychus urticae
malacostraca|欧洲绿蟹|Carcinus maenas
malacostraca|美洲螯龙虾|Homarus americanus
malacostraca|克氏原螯虾|Procambarus clarkii
malacostraca|斑节对虾|Penaeus monodon
malacostraca|南美白对虾|Litopenaeus vannamei
malacostraca|鼠妇|Armadillidium vulgare
malacostraca|淡水钩虾|Gammarus pulex
branchiopoda|大型溞|Daphnia magna
branchiopoda|卤虫|Artemia salina
chondrichthyes|鲸鲨|Rhincodon typus
chondrichthyes|无沟双髻鲨|Sphyrna mokarran
chondrichthyes|鼬鲨|Galeocerdo cuvier
chondrichthyes|公牛鲨|Carcharhinus leucas
chondrichthyes|巨蝠鲼|Mobula birostris
chondrichthyes|棘鳐|Raja clavata
chondrichthyes|小齿锯鳐|Pristis pectinata
chondrichthyes|欧洲银鲛|Chimaera monstrosa
actinopterygii|大西洋鲑|Salmo salar
actinopterygii|虹鳟|Oncorhynchus mykiss
actinopterygii|北极红点鲑|Salvelinus alpinus
actinopterygii|大西洋鳕|Gadus morhua
actinopterygii|大西洋蓝鳍金枪鱼|Thunnus thynnus
actinopterygii|黄鳍金枪鱼|Thunnus albacares
actinopterygii|剑鱼|Xiphias gladius
actinopterygii|大海马|Hippocampus kuda
actinopterygii|条纹海马|Hippocampus erectus
actinopterygii|眼斑双锯鱼|Amphiprion ocellaris
actinopterygii|神仙鱼|Pterophyllum scalare
actinopterygii|孔雀鱼|Poecilia reticulata
actinopterygii|暹罗斗鱼|Betta splendens
actinopterygii|青鳉|Oryzias latipes
actinopterygii|红鳍东方鲀|Takifugu rubripes
actinopterygii|鲤|Cyprinus carpio
actinopterygii|金鱼|Carassius auratus
actinopterygii|欧洲鳗鲡|Anguilla anguilla
actinopterygii|电鳗|Electrophorus electricus
actinopterygii|白斑狗鱼|Esox lucius
actinopterygii|大西洋鲱|Clupea harengus
actinopterygii|尼罗罗非鱼|Oreochromis niloticus
sarcopterygii|矛尾鱼|Latimeria chalumnae
sarcopterygii|非洲肺鱼|Protopterus annectens
lissamphibia|欧洲林蛙|Rana temporaria
lissamphibia|沼泽蛙|Pelophylax ridibundus
lissamphibia|非洲爪蟾|Xenopus laevis
lissamphibia|墨西哥钝口螈|Ambystoma mexicanum
lissamphibia|虎纹钝口螈|Ambystoma tigrinum
lissamphibia|火蝾螈|Salamandra salamandra
lissamphibia|冠蝾螈|Triturus cristatus
lissamphibia|欧洲蟾蜍|Bufo bufo
lissamphibia|染色箭毒蛙|Dendrobates tinctorius
squamata|科莫多巨蜥|Varanus komodoensis
squamata|美洲鬣蜥|Iguana iguana
squamata|高冠变色龙|Chamaeleo calyptratus
squamata|球蟒|Python regius
squamata|缅甸蟒|Python bivittatus
squamata|印度眼镜蛇|Naja naja
squamata|眼镜王蛇|Ophiophagus hannah
squamata|黑曼巴蛇|Dendroaspis polylepis
squamata|西部菱背响尾蛇|Crotalus atrox
squamata|大壁虎|Gekko gecko
squamata|鬃狮蜥|Pogona vitticeps
squamata|绿变色蜥|Anolis carolinensis
testudines|绿海龟|Chelonia mydas
testudines|蠵龟|Caretta caretta
testudines|棱皮龟|Dermochelys coriacea
testudines|希腊陆龟|Testudo graeca
testudines|红耳龟|Trachemys scripta
testudines|沙漠地鼠龟|Gopherus agassizii
crocodylia|尼罗鳄|Crocodylus niloticus
crocodylia|湾鳄|Crocodylus porosus
crocodylia|密西西比短吻鳄|Alligator mississippiensis
crocodylia|恒河鳄|Gavialis gangeticus
crocodylia|眼镜凯门鳄|Caiman crocodilus
galliformes|雉鸡|Phasianus colchicus
galliformes|火鸡|Meleagris gallopavo
galliformes|日本鹌鹑|Coturnix japonica
galliformes|蓝孔雀|Pavo cristatus
passeriformes|渡鸦|Corvus corax
passeriformes|美洲乌鸦|Corvus brachyrhynchos
passeriformes|家麻雀|Passer domesticus
passeriformes|大山雀|Parus major
passeriformes|蓝山雀|Cyanistes caeruleus
passeriformes|欧亚鸲|Erithacus rubecula
passeriformes|乌鸫|Turdus merula
passeriformes|紫翅椋鸟|Sturnus vulgaris
passeriformes|斑胸草雀|Taeniopygia guttata
passeriformes|金丝雀|Serinus canaria
passeriformes|家燕|Hirundo rustica
passeriformes|喜鹊|Pica pica
passeriformes|苍头燕雀|Fringilla coelebs
passeriformes|白冠带鹀|Zonotrichia leucophrys
anseriformes|绿头鸭|Anas platyrhynchos
anseriformes|灰雁|Anser anser
anseriformes|疣鼻天鹅|Cygnus olor
anseriformes|加拿大黑雁|Branta canadensis
anseriformes|鸳鸯|Aix galericulata
accipitriformes|金雕|Aquila chrysaetos
accipitriformes|白头海雕|Haliaeetus leucocephalus
accipitriformes|普通鵟|Buteo buteo
accipitriformes|苍鹰|Accipiter gentilis
accipitriformes|欧亚兀鹫|Gyps fulvus
accipitriformes|赤鸢|Milvus milvus
strigiformes|雕鸮|Bubo bubo
strigiformes|仓鸮|Tyto alba
strigiformes|灰林鸮|Strix aluco
strigiformes|纵纹腹小鸮|Athene noctua
sphenisciformes|帝企鹅|Aptenodytes forsteri
sphenisciformes|王企鹅|Aptenodytes patagonicus
sphenisciformes|阿德利企鹅|Pygoscelis adeliae
sphenisciformes|非洲企鹅|Spheniscus demersus
monotremata|短吻针鼹|Tachyglossus aculeatus
monotremata|西部长吻针鼹|Zaglossus bruijnii
metatheria|树袋熊|Phascolarctos cinereus
metatheria|普通袋熊|Vombatus ursinus
metatheria|袋獾|Sarcophilus harrisii
metatheria|北美负鼠|Didelphis virginiana
metatheria|红大袋鼠|Macropus rufus
metatheria|刷尾负鼠|Trichosurus vulpecula
metatheria|蜜袋鼯|Petaurus breviceps
metatheria|东方袋鼬|Dasyurus viverrinus
canidae|赤狐|Vulpes vulpes
canidae|郊狼|Canis latrans
canidae|金豺|Canis aureus
canidae|非洲野犬|Lycaon pictus
canidae|豺|Cuon alpinus
canidae|北极狐|Vulpes lagopus
felidae|狮|Panthera leo
felidae|虎|Panthera tigris
felidae|豹|Panthera pardus
felidae|美洲豹|Panthera onca
felidae|猎豹|Acinonyx jubatus
felidae|美洲狮|Puma concolor
felidae|欧亚猞猁|Lynx lynx
felidae|短尾猫|Lynx rufus
felidae|虎猫|Leopardus pardalis
felidae|豹猫|Prionailurus bengalensis
ursidae|棕熊|Ursus arctos
ursidae|北极熊|Ursus maritimus
ursidae|美洲黑熊|Ursus americanus
ursidae|大熊猫|Ailuropoda melanoleuca
ursidae|眼镜熊|Tremarctos ornatus
ursidae|马来熊|Helarctos malayanus
mustelidae|欧亚水獭|Lutra lutra
mustelidae|海獭|Enhydra lutris
mustelidae|伶鼬|Mustela nivalis
mustelidae|欧亚獾|Meles meles
mustelidae|狼獾|Gulo gulo
mustelidae|美洲水貂|Neogale vison
phocidae|港海豹|Phoca vitulina
phocidae|灰海豹|Halichoerus grypus
phocidae|南象海豹|Mirounga leonina
phocidae|环斑海豹|Pusa hispida
rodentia|褐家鼠|Rattus norvegicus
rodentia|黑家鼠|Rattus rattus
rodentia|豚鼠|Cavia porcellus
rodentia|水豚|Hydrochoerus hydrochaeris
rodentia|欧亚红松鼠|Sciurus vulgaris
rodentia|东部灰松鼠|Sciurus carolinensis
rodentia|欧亚河狸|Castor fiber
rodentia|北美河狸|Castor canadensis
rodentia|阿尔卑斯旱獭|Marmota marmota
rodentia|中国仓鼠|Cricetulus griseus
rodentia|金仓鼠|Mesocricetus auratus
rodentia|长尾毛丝鼠|Chinchilla lanigera
rodentia|裸鼹鼠|Heterocephalus glaber
rodentia|沙漠更格卢鼠|Dipodomys deserti
primates|恒河猴|Macaca mulatta
primates|食蟹猴|Macaca fascicularis
primates|阿努比斯狒狒|Papio anubis
primates|山魈|Mandrillus sphinx
primates|长尾绿猴|Chlorocebus pygerythrus
primates|普通狨|Callithrix jacchus
primates|普通松鼠猴|Saimiri sciureus
primates|环尾狐猴|Lemur catta
primates|维氏冕狐猴|Propithecus verreauxi
primates|眼镜猴|Tarsius tarsier
primates|三条纹夜猴|Aotus trivirgatus
ponginae|苏门答腊猩猩|Pongo abelii
gorillini|东部大猩猩|Gorilla beringei
panina|倭黑猩猩|Pan paniscus
hylobatidae|银长臂猿|Hylobates moloch
cetacea|抹香鲸|Physeter macrocephalus
cetacea|虎鲸|Orcinus orca
cetacea|宽吻海豚|Tursiops truncatus
cetacea|普通海豚|Delphinus delphis
cetacea|长吻飞旋海豚|Stenella longirostris
cetacea|座头鲸|Megaptera novaeangliae
cetacea|长须鲸|Balaenoptera physalus
cetacea|小须鲸|Balaenoptera acutorostrata
cetacea|北大西洋露脊鲸|Eubalaena glacialis
cetacea|灰鲸|Eschrichtius robustus
cetacea|一角鲸|Monodon monoceros
cetacea|白鲸|Delphinapterus leucas
cetacea|柯氏喙鲸|Ziphius cavirostris
ruminantia|家牛|Bos taurus
ruminantia|美洲野牛|Bison bison
ruminantia|绵羊|Ovis aries
ruminantia|山羊|Capra hircus
ruminantia|长颈鹿|Giraffa camelopardalis
ruminantia|马鹿|Cervus elaphus
ruminantia|驼鹿|Alces alces
ruminantia|驯鹿|Rangifer tarandus
ruminantia|霍加狓|Okapia johnstoni
cetartiodactyla|野猪|Sus scrofa
cetartiodactyla|单峰骆驼|Camelus dromedarius
chiroptera|马来大狐蝠|Pteropus vampyrus
chiroptera|黑狐蝠|Pteropus alecto
chiroptera|小棕蝠|Myotis lucifugus
chiroptera|大鼠耳蝠|Myotis myotis
chiroptera|普通吸血蝠|Desmodus rotundus
chiroptera|大菊头蝠|Rhinolophus ferrumequinum
chiroptera|大棕蝠|Eptesicus fuscus
perissodactyla|家马|Equus caballus
perissodactyla|山斑马|Equus zebra
perissodactyla|平原斑马|Equus quagga
perissodactyla|印度犀|Rhinoceros unicornis
perissodactyla|黑犀|Diceros bicornis
perissodactyla|南美貘|Tapirus terrestris
perissodactyla|马来貘|Tapirus indicus
proboscidea|非洲草原象|Loxodonta africana
proboscidea|非洲森林象|Loxodonta cyclotis
proboscidea|亚洲象|Elephas maximus
lagomorpha|欧洲兔|Oryctolagus cuniculus
lagomorpha|欧洲野兔|Lepus europaeus
lagomorpha|雪兔|Lepus timidus
lagomorpha|美洲鼠兔|Ochotona princeps
  `.trim();

  const taxa = window.EVO_TAXA;
  if (!Array.isArray(taxa)) throw new Error('EvoAtlas base taxonomy was not loaded');
  const ids = new Set(taxa.map(n=>n.id));
  const names = new Set(taxa.filter(n=>n.rank==='种').map(n=>n.latin.toLowerCase()));
  const reference = new Map(taxa.map(n=>[n.id,n]));
  const list = input => input.split('\n').map(line=>line.trim()).filter(Boolean);

  for (const row of list(taxonomy)) {
    const [id,parent,zh,latin,rank,age,clade]=row.split('|');
    if(ids.has(id)||!reference.has(parent)) throw new Error('Invalid taxonomic parent or duplicate: '+id);
    const parentNode=reference.get(parent);
    const ageMa=Number(age);
    if(!(ageMa>0 && ageMa<=parentNode.ageMa)) throw new Error('Invalid teaching chronology: '+id);
    const node={
      id,parent,zh,latin,rank,ageMa,clade,status:'ancestral',
      summary:'分类学上的代表性支系，不代表已经验证的分化年代或唯一系统发育拓扑。',
      confidence:'low',traits:['分类示意'],sources:['col','gbif','opentree'],
      evidenceState:'pending-review'
    };
    taxa.push(node);ids.add(id);reference.set(id,node);
  }

  // Name-first, versioned editorial snapshot; no invented divergence time for
  // extant species. No species-specific traits are inferred from group labels.
  for (const row of list(species)) {
    const [parent,zh,latin]=row.split('|');
    if(!reference.has(parent)) throw new Error('Missing species parent '+parent+': '+latin);
    if(!/^[A-Z][a-z-]+ [a-z][a-z-]+$/.test(latin))
      throw new Error('Invalid binomial scientific name: '+latin);
    if(names.has(latin.toLowerCase())) throw new Error('Repeated species name: '+latin);
    const id='catalog-'+latin.toLowerCase().replace(/[^a-z]+/g,'-');
    if(ids.has(id)) throw new Error('Repeated ID '+id);
    const p=reference.get(parent);
    taxa.push({
      id,parent,zh,latin,rank:'种',ageMa:0,
      clade:p.clade||'eukaryota',status:'extant',
      summary:'收录于 '+p.zh+' 的代表性物种。学名、接受名状态和更精细的支系关系仍需逐条核对。',
      confidence:'low',traits:[],sources:['col','gbif','opentree'],
      evidenceState:'pending-review'
    });
    ids.add(id);names.add(latin.toLowerCase());
  }

  // Crocodilians and dinosaurs share the archosaur branch (a polytomy here
  // means unresolved navigation, not a resolved research phylogeny).
  const dinosaur=reference.get('dinosauria');
  if(dinosaur) dinosaur.parent='archosauria';

  window.EVO_SPECIES_CATALOGUE={
    version:'2026-11',kind:'name-first editorial snapshot',
    addedSpecies:list(species).length,addedClades:list(taxonomy).length,
    taxonomyVerified:false
  };
})();