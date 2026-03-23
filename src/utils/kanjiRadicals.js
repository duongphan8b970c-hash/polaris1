/**
 * Complete 214 Kangxi Radicals mapping
 * Maps radical number to radical character, stroke count, and meaning
 */
export const KANGXI_RADICALS = {
  1:   { radical: '一', stroke: 1, meaning: 'one' },
  2:   { radical: '丨', stroke: 1, meaning: 'line' },
  3:   { radical: '丶', stroke: 1, meaning: 'dot' },
  4:   { radical: '丿', stroke: 1, meaning: 'slash' },
  5:   { radical: '乙', stroke: 1, meaning: 'second' },
  6:   { radical: '亅', stroke: 1, meaning: 'hook' },
  7:   { radical: '二', stroke: 2, meaning: 'two' },
  8:   { radical: '亠', stroke: 2, meaning: 'lid' },
  9:   { radical: '人', stroke: 2, meaning: 'person' },
  10:  { radical: '儿', stroke: 2, meaning: 'legs' },
  11:  { radical: '入', stroke: 2, meaning: 'enter' },
  12:  { radical: '八', stroke: 2, meaning: 'eight' },
  13:  { radical: '冂', stroke: 2, meaning: 'wide' },
  14:  { radical: '冖', stroke: 2, meaning: 'cover' },
  15:  { radical: '冫', stroke: 2, meaning: 'ice' },
  16:  { radical: '几', stroke: 2, meaning: 'table' },
  17:  { radical: '凵', stroke: 2, meaning: 'receptacle' },
  18:  { radical: '刀', stroke: 2, meaning: 'knife' },
  19:  { radical: '力', stroke: 2, meaning: 'power' },
  20:  { radical: '勺', stroke: 2, meaning: 'wrap' },
  21:  { radical: '匕', stroke: 2, meaning: 'spoon' },
  22:  { radical: '匚', stroke: 2, meaning: 'box' },
  23:  { radical: '匸', stroke: 2, meaning: 'hiding' },
  24:  { radical: '十', stroke: 2, meaning: 'ten' },
  25:  { radical: '卜', stroke: 2, meaning: 'divination' },
  26:  { radical: '卩', stroke: 2, meaning: 'seal' },
  27:  { radical: '厂', stroke: 2, meaning: 'cliff' },
  28:  { radical: '厶', stroke: 2, meaning: 'private' },
  29:  { radical: '又', stroke: 2, meaning: 'again' },
  30:  { radical: '口', stroke: 3, meaning: 'mouth' },
  31:  { radical: '囗', stroke: 3, meaning: 'enclosure' },
  32:  { radical: '土', stroke: 3, meaning: 'earth' },
  33:  { radical: '士', stroke: 3, meaning: 'scholar' },
  34:  { radical: '夂', stroke: 3, meaning: 'go' },
  35:  { radical: '夊', stroke: 3, meaning: 'go slowly' },
  36:  { radical: '夕', stroke: 3, meaning: 'evening' },
  37:  { radical: '大', stroke: 3, meaning: 'big' },
  38:  { radical: '女', stroke: 3, meaning: 'woman' },
  39:  { radical: '子', stroke: 3, meaning: 'child' },
  40:  { radical: '宀', stroke: 3, meaning: 'roof' },
  41:  { radical: '寸', stroke: 3, meaning: 'inch' },
  42:  { radical: '小', stroke: 3, meaning: 'small' },
  43:  { radical: '尢', stroke: 3, meaning: 'lame' },
  44:  { radical: '尸', stroke: 3, meaning: 'corpse' },
  45:  { radical: '屮', stroke: 3, meaning: 'sprout' },
  46:  { radical: '山', stroke: 3, meaning: 'mountain' },
  47:  { radical: '巛', stroke: 3, meaning: 'river' },
  48:  { radical: '工', stroke: 3, meaning: 'work' },
  49:  { radical: '己', stroke: 3, meaning: 'oneself' },
  50:  { radical: '巾', stroke: 3, meaning: 'turban' },
  51:  { radical: '干', stroke: 3, meaning: 'dry' },
  52:  { radical: '幺', stroke: 3, meaning: 'young' },
  53:  { radical: '广', stroke: 3, meaning: 'dotted cliff' },
  54:  { radical: '廴', stroke: 3, meaning: 'long stride' },
  55:  { radical: '廾', stroke: 3, meaning: 'two hands' },
  56:  { radical: '弋', stroke: 3, meaning: 'shoot' },
  57:  { radical: '弓', stroke: 3, meaning: 'bow' },
  58:  { radical: '彐', stroke: 3, meaning: 'snout' },
  59:  { radical: '彡', stroke: 3, meaning: 'bristle' },
  60:  { radical: '彳', stroke: 3, meaning: 'step' },
  61:  { radical: '心', stroke: 4, meaning: 'heart' },
  62:  { radical: '戈', stroke: 4, meaning: 'halberd' },
  63:  { radical: '戶', stroke: 4, meaning: 'door' },
  64:  { radical: '手', stroke: 4, meaning: 'hand' },
  65:  { radical: '支', stroke: 4, meaning: 'branch' },
  66:  { radical: '攴', stroke: 4, meaning: 'strike' },
  67:  { radical: '文', stroke: 4, meaning: 'script' },
  68:  { radical: '斗', stroke: 4, meaning: 'dipper' },
  69:  { radical: '斤', stroke: 4, meaning: 'axe' },
  70:  { radical: '方', stroke: 4, meaning: 'square' },
  71:  { radical: '无', stroke: 4, meaning: 'not' },
  72:  { radical: '日', stroke: 4, meaning: 'sun' },
  73:  { radical: '曰', stroke: 4, meaning: 'say' },
  74:  { radical: '月', stroke: 4, meaning: 'moon' },
  75:  { radical: '木', stroke: 4, meaning: 'tree' },
  76:  { radical: '欠', stroke: 4, meaning: 'lack' },
  77:  { radical: '止', stroke: 4, meaning: 'stop' },
  78:  { radical: '歹', stroke: 4, meaning: 'death' },
  79:  { radical: '殳', stroke: 4, meaning: 'weapon' },
  80:  { radical: '毋', stroke: 4, meaning: 'do not' },
  81:  { radical: '比', stroke: 4, meaning: 'compare' },
  82:  { radical: '毛', stroke: 4, meaning: 'fur' },
  83:  { radical: '氏', stroke: 4, meaning: 'clan' },
  84:  { radical: '气', stroke: 4, meaning: 'steam' },
  85:  { radical: '水', stroke: 4, meaning: 'water' },
  86:  { radical: '火', stroke: 4, meaning: 'fire' },
  87:  { radical: '爪', stroke: 4, meaning: 'claw' },
  88:  { radical: '父', stroke: 4, meaning: 'father' },
  89:  { radical: '爻', stroke: 4, meaning: 'mix' },
  90:  { radical: '爿', stroke: 4, meaning: 'half tree trunk' },
  91:  { radical: '片', stroke: 4, meaning: 'slice' },
  92:  { radical: '牙', stroke: 4, meaning: 'fang' },
  93:  { radical: '牛', stroke: 4, meaning: 'cow' },
  94:  { radical: '犬', stroke: 4, meaning: 'dog' },
  95:  { radical: '玄', stroke: 5, meaning: 'dark' },
  96:  { radical: '玉', stroke: 5, meaning: 'jade' },
  97:  { radical: '瓜', stroke: 5, meaning: 'melon' },
  98:  { radical: '瓦', stroke: 5, meaning: 'tile' },
  99:  { radical: '甘', stroke: 5, meaning: 'sweet' },
  100: { radical: '生', stroke: 5, meaning: 'life' },
  101: { radical: '用', stroke: 5, meaning: 'use' },
  102: { radical: '田', stroke: 5, meaning: 'field' },
  103: { radical: '疋', stroke: 5, meaning: 'bolt of cloth' },
  104: { radical: '疒', stroke: 5, meaning: 'sickness' },
  105: { radical: '癶', stroke: 5, meaning: 'footsteps' },
  106: { radical: '白', stroke: 5, meaning: 'white' },
  107: { radical: '皮', stroke: 5, meaning: 'skin' },
  108: { radical: '皿', stroke: 5, meaning: 'dish' },
  109: { radical: '目', stroke: 5, meaning: 'eye' },
  110: { radical: '矛', stroke: 5, meaning: 'spear' },
  111: { radical: '矢', stroke: 5, meaning: 'arrow' },
  112: { radical: '石', stroke: 5, meaning: 'stone' },
  113: { radical: '示', stroke: 5, meaning: 'spirit' },
  114: { radical: '禸', stroke: 5, meaning: 'track' },
  115: { radical: '禾', stroke: 5, meaning: 'grain' },
  116: { radical: '穴', stroke: 5, meaning: 'cave' },
  117: { radical: '立', stroke: 5, meaning: 'stand' },
  118: { radical: '竹', stroke: 6, meaning: 'bamboo' },
  119: { radical: '米', stroke: 6, meaning: 'rice' },
  120: { radical: '糸', stroke: 6, meaning: 'thread' },
  121: { radical: '缶', stroke: 6, meaning: 'jar' },
  122: { radical: '网', stroke: 6, meaning: 'net' },
  123: { radical: '羊', stroke: 6, meaning: 'sheep' },
  124: { radical: '羽', stroke: 6, meaning: 'feather' },
  125: { radical: '老', stroke: 6, meaning: 'old' },
  126: { radical: '而', stroke: 6, meaning: 'and' },
  127: { radical: '耒', stroke: 6, meaning: 'plow' },
  128: { radical: '耳', stroke: 6, meaning: 'ear' },
  129: { radical: '聿', stroke: 6, meaning: 'brush' },
  130: { radical: '肉', stroke: 6, meaning: 'meat' },
  131: { radical: '臣', stroke: 6, meaning: 'official' },
  132: { radical: '自', stroke: 6, meaning: 'self' },
  133: { radical: '至', stroke: 6, meaning: 'arrive' },
  134: { radical: '臼', stroke: 6, meaning: 'mortar' },
  135: { radical: '舌', stroke: 6, meaning: 'tongue' },
  136: { radical: '舛', stroke: 6, meaning: 'oppose' },
  137: { radical: '舟', stroke: 6, meaning: 'boat' },
  138: { radical: '艮', stroke: 6, meaning: 'stopping' },
  139: { radical: '色', stroke: 6, meaning: 'color' },
  140: { radical: '艸', stroke: 6, meaning: 'grass' },
  141: { radical: '虍', stroke: 6, meaning: 'tiger' },
  142: { radical: '虫', stroke: 6, meaning: 'insect' },
  143: { radical: '血', stroke: 6, meaning: 'blood' },
  144: { radical: '行', stroke: 6, meaning: 'walk' },
  145: { radical: '衣', stroke: 6, meaning: 'clothes' },
  146: { radical: '襾', stroke: 6, meaning: 'cover' },
  147: { radical: '見', stroke: 7, meaning: 'see' },
  148: { radical: '角', stroke: 7, meaning: 'horn' },
  149: { radical: '言', stroke: 7, meaning: 'speech' },
  150: { radical: '谷', stroke: 7, meaning: 'valley' },
  151: { radical: '豆', stroke: 7, meaning: 'bean' },
  152: { radical: '豕', stroke: 7, meaning: 'pig' },
  153: { radical: '豸', stroke: 7, meaning: 'badger' },
  154: { radical: '貝', stroke: 7, meaning: 'shell' },
  155: { radical: '赤', stroke: 7, meaning: 'red' },
  156: { radical: '走', stroke: 7, meaning: 'run' },
  157: { radical: '足', stroke: 7, meaning: 'foot' },
  158: { radical: '身', stroke: 7, meaning: 'body' },
  159: { radical: '車', stroke: 7, meaning: 'cart' },
  160: { radical: '辛', stroke: 7, meaning: 'bitter' },
  161: { radical: '辰', stroke: 7, meaning: 'morning' },
  162: { radical: '辵', stroke: 7, meaning: 'walk' },
  163: { radical: '邑', stroke: 7, meaning: 'city' },
  164: { radical: '酉', stroke: 7, meaning: 'wine' },
  165: { radical: '釆', stroke: 7, meaning: 'distinguish' },
  166: { radical: '里', stroke: 7, meaning: 'village' },
  167: { radical: '金', stroke: 8, meaning: 'gold' },
  168: { radical: '長', stroke: 8, meaning: 'long' },
  169: { radical: '門', stroke: 8, meaning: 'gate' },
  170: { radical: '阜', stroke: 8, meaning: 'mound' },
  171: { radical: '隶', stroke: 8, meaning: 'slave' },
  172: { radical: '隹', stroke: 8, meaning: 'short-tailed bird' },
  173: { radical: '雨', stroke: 8, meaning: 'rain' },
  174: { radical: '青', stroke: 8, meaning: 'blue' },
  175: { radical: '非', stroke: 8, meaning: 'wrong' },
  176: { radical: '面', stroke: 9, meaning: 'face' },
  177: { radical: '革', stroke: 9, meaning: 'leather' },
  178: { radical: '韋', stroke: 9, meaning: 'tanned leather' },
  179: { radical: '韭', stroke: 9, meaning: 'leek' },
  180: { radical: '音', stroke: 9, meaning: 'sound' },
  181: { radical: '頁', stroke: 9, meaning: 'page' },
  182: { radical: '風', stroke: 9, meaning: 'wind' },
  183: { radical: '飛', stroke: 9, meaning: 'fly' },
  184: { radical: '食', stroke: 9, meaning: 'eat' },
  185: { radical: '首', stroke: 9, meaning: 'head' },
  186: { radical: '香', stroke: 9, meaning: 'fragrant' },
  187: { radical: '馬', stroke: 10, meaning: 'horse' },
  188: { radical: '骨', stroke: 10, meaning: 'bone' },
  189: { radical: '高', stroke: 10, meaning: 'tall' },
  190: { radical: '髟', stroke: 10, meaning: 'long hair' },
  191: { radical: '鬥', stroke: 10, meaning: 'fight' },
  192: { radical: '鬯', stroke: 10, meaning: 'sacrificial wine' },
  193: { radical: '鬲', stroke: 10, meaning: 'cauldron' },
  194: { radical: '鬼', stroke: 10, meaning: 'ghost' },
  195: { radical: '魚', stroke: 11, meaning: 'fish' },
  196: { radical: '鳥', stroke: 11, meaning: 'bird' },
  197: { radical: '鹵', stroke: 11, meaning: 'salt' },
  198: { radical: '鹿', stroke: 11, meaning: 'deer' },
  199: { radical: '麥', stroke: 11, meaning: 'wheat' },
  200: { radical: '麻', stroke: 11, meaning: 'hemp' },
  201: { radical: '黃', stroke: 12, meaning: 'yellow' },
  202: { radical: '黍', stroke: 12, meaning: 'millet' },
  203: { radical: '黑', stroke: 12, meaning: 'black' },
  204: { radical: '黹', stroke: 12, meaning: 'embroidery' },
  205: { radical: '黽', stroke: 13, meaning: 'frog' },
  206: { radical: '鼎', stroke: 13, meaning: 'tripod' },
  207: { radical: '鼓', stroke: 13, meaning: 'drum' },
  208: { radical: '鼠', stroke: 13, meaning: 'rat' },
  209: { radical: '鼻', stroke: 14, meaning: 'nose' },
  210: { radical: '齊', stroke: 14, meaning: 'even' },
  211: { radical: '齒', stroke: 15, meaning: 'tooth' },
  212: { radical: '龍', stroke: 16, meaning: 'dragon' },
  213: { radical: '龜', stroke: 16, meaning: 'turtle' },
  214: { radical: '龠', stroke: 17, meaning: 'flute' },
}

/**
 * Lookup table mapping common kanji to their Kangxi radical character.
 * Used as a fallback when Jisho API doesn't provide radical information.
 */
const KANJI_TO_RADICAL = {
  // 一 (one)
  '一': '一', '七': '一', '三': '一', '上': '一', '下': '一', '不': '一', '世': '一',
  '丘': '一', '且': '一', '丕': '一',

  // 人 (person) — includes 亻 (ninben)
  '人': '人', '今': '人', '他': '人', '仕': '人', '代': '人', '以': '人', '仮': '人',
  '件': '人', '任': '人', '休': '人', '会': '人', '住': '人', '体': '人', '作': '人',
  '使': '人', '例': '人', '供': '人', '係': '人', '信': '人', '俳': '人', '候': '人',
  '健': '人', '側': '人', '停': '人', '像': '人', '億': '人',
  '全': '人', '何': '人', '保': '人', '修': '人', '個': '人', '倒': '人', '偉': '人',
  '傾': '人', '僧': '人', '儀': '人', '化': '人', '位': '人', '低': '人', '付': '人',
  '仲': '人', '価': '人', '仁': '人', '介': '人', '伝': '人', '伸': '人',
  '依': '人', '俗': '人', '便': '人', '倣': '人', '借': '人', '優': '人',
  '兄': '儿', '元': '儿', '充': '儿', '先': '儿', '光': '儿', '克': '儿', '児': '儿',

  // 口 (mouth)
  '口': '口', '古': '口', '可': '口', '台': '口', '右': '口', '号': '口', '向': '口',
  '君': '口', '味': '口', '呼': '口', '命': '口', '和': '口', '唱': '口', '問': '口',
  '品': '口', '員': '口', '商': '口', '善': '口', '嘆': '口', '回': '囗', '国': '囗',
  '困': '囗', '図': '囗', '団': '囗', '囲': '囗', '固': '囗', '喜': '口', '営': '口',
  '周': '口', '吹': '口', '告': '口', '史': '口', '合': '口', '吸': '口', '同': '口',
  '名': '口', '各': '口', '句': '口', '否': '口', '吐': '口', '吟': '口', '唐': '口',

  // 土 (earth)
  '土': '土', '地': '土', '坂': '土', '城': '土', '基': '土', '場': '土', '境': '土',
  '増': '土', '壊': '土', '塩': '土', '型': '土', '堂': '土', '報': '土', '坊': '土',
  '均': '土', '堅': '土', '域': '土', '塔': '土', '塁': '土',

  // 女 (woman)
  '女': '女', '好': '女', '如': '女', '妹': '女', '姉': '女', '姫': '女', '娘': '女',
  '婚': '女', '嫁': '女', '妻': '女', '妙': '女', '委': '女', '始': '女',
  '姿': '女', '嬉': '女', '媛': '女', '母': '毋', '毎': '毋',

  // 子 (child)
  '子': '子', '学': '子', '字': '子', '存': '子', '孝': '子', '季': '子',
  '孤': '子', '孫': '子',

  // 宀 (roof)
  '家': '宀', '室': '宀', '宮': '宀', '宿': '宀', '安': '宀', '宇': '宀', '完': '宀',
  '客': '宀', '容': '宀', '密': '宀', '富': '宀', '寒': '宀', '寝': '宀', '審': '宀',
  '寺': '寸', '対': '寸', '将': '寸', '専': '寸',

  // 山 (mountain)
  '山': '山', '岩': '山', '岸': '山', '島': '山', '峰': '山', '崎': '山', '嵐': '山',
  '峡': '山', '岡': '山',

  // 心 (heart) — includes 忄 (risshinben)
  '心': '心', '志': '心', '忘': '心', '思': '心', '悲': '心', '想': '心', '愛': '心',
  '意': '心', '感': '心', '憎': '心', '快': '心', '性': '心', '情': '心', '惑': '心',
  '恋': '心', '恐': '心', '恥': '心', '悩': '心', '慣': '心', '懐': '心', '念': '心',
  '忍': '心', '忠': '心', '患': '心', '悔': '心', '悟': '心', '慌': '心', '慎': '心',
  '憶': '心', '応': '心', '怒': '心', '怖': '心', '恵': '心',

  // 手 (hand) — includes 扌 (tehen)
  '手': '手', '打': '手', '投': '手', '押': '手', '拾': '手', '持': '手', '指': '手',
  '接': '手', '援': '手', '摘': '手', '擁': '手', '拝': '手', '払': '手', '折': '手',
  '技': '手', '批': '手', '拡': '手', '掃': '手', '捜': '手', '探': '手', '描': '手',
  '操': '手', '択': '手', '担': '手', '掘': '手', '推': '手', '控': '手', '握': '手',

  // 日 (sun)
  '日': '日', '旧': '日', '早': '日', '明': '日', '時': '日', '晩': '日', '曜': '日',
  '暗': '日', '暖': '日', '昨': '日', '春': '日', '映': '日', '暑': '日', '昼': '日',
  '景': '日', '暮': '日', '易': '日', '昔': '日', '普': '日', '是': '日', '最': '日',
  '暁': '日', '晴': '日', '昭': '日', '旬': '日',

  // 月 (moon)
  '月': '月', '朝': '月', '期': '月', '服': '月', '朗': '月', '望': '月',

  // 木 (tree)
  '木': '木', '本': '木', '末': '木', '林': '木', '森': '木', '机': '木', '板': '木',
  '枚': '木', '枝': '木', '松': '木', '柔': '木', '柿': '木', '梅': '木', '棒': '木',
  '楼': '木', '槽': '木', '棚': '木', '棟': '木', '棺': '木', '構': '木', '様': '木',
  '横': '木', '極': '木', '植': '木', '検': '木', '権': '木', '模': '木', '桜': '木',
  '柱': '木', '根': '木', '橋': '木', '樹': '木', '校': '木', '椅': '木', '格': '木',
  '楽': '木', '業': '木', '標': '木', '棄': '木', '梶': '木',
  '梁': '木', '桃': '木', '栄': '木', '梗': '木', '栗': '木', '朴': '木', '株': '木',
  '桑': '木', '槐': '木',

  // 水 (water) — includes 氵 (sanzui)
  '水': '水', '氷': '水', '泉': '水', '池': '水', '汚': '水', '泣': '水', '泳': '水',
  '洗': '水', '波': '水', '泊': '水', '活': '水', '海': '水', '港': '水', '温': '水',
  '渡': '水', '満': '水', '洪': '水', '潮': '水', '液': '水', '没': '水', '泡': '水',
  '清': '水', '潔': '水', '漫': '水', '源': '水', '流': '水', '湖': '水', '深': '水',
  '湯': '水', '漢': '水', '漁': '水', '浮': '水', '浜': '水', '漂': '水', '泥': '水',
  '浦': '水', '洞': '水', '浴': '水', '添': '水', '減': '水', '渉': '水', '濁': '水',
  '況': '水', '河': '水', '浸': '水', '湾': '水', '沖': '水', '洒': '水', '滑': '水',
  '泰': '水', '浅': '水', '淡': '水', '淵': '水', '混': '水', '注': '水', '沸': '水',
  '沿': '水', '消': '水', '澄': '水', '激': '水', '測': '水', '準': '水',

  // 火 (fire) — includes 灬 (renkka)
  '火': '火', '灯': '火', '炭': '火', '炉': '火', '煙': '火', '熱': '火', '燃': '火',
  '焼': '火', '炎': '火', '照': '火', '灰': '火', '点': '火', '烈': '火',
  '炊': '火', '煮': '火', '然': '火', '焦': '火', '無': '火',

  // 言 (speech)
  '言': '言', '話': '言', '語': '言', '読': '言', '記': '言', '説': '言', '訓': '言',
  '訪': '言', '誰': '言', '議': '言', '認': '言', '証': '言', '詞': '言', '詩': '言',
  '詰': '言', '訴': '言', '設': '言', '試': '言', '訳': '言', '詳': '言', '詠': '言',
  '調': '言', '諸': '言', '諭': '言', '謝': '言', '謙': '言', '謹': '言',
  '講': '言', '誤': '言', '警': '言', '誉': '言', '該': '言', '諾': '言', '誘': '言',
  '請': '言', '論': '言', '誕': '言', '課': '言', '誌': '言', '評': '言', '許': '言',
  '訂': '言',

  // 金 (gold/metal)
  '金': '金', '銀': '金', '鉄': '金', '銅': '金', '鐘': '金', '錠': '金', '錦': '金',
  '針': '金', '鋭': '金', '鍵': '金', '鏡': '金', '録': '金', '鉛': '金', '鎖': '金',
  '銃': '金', '鍛': '金', '錬': '金', '铁': '金', '铜': '金',

  // 食 (eat)
  '食': '食', '飯': '食', '飲': '食', '飼': '食', '飾': '食', '飽': '食', '飢': '食',

  // 魚 (fish)
  '魚': '魚', '鯉': '魚', '鮭': '魚', '鮫': '魚', '鯨': '魚', '鯛': '魚', '鰻': '魚',
  '鱒': '魚', '鮪': '魚',

  // 鳥 (bird)
  '鳥': '鳥', '鶏': '鳥', '鴨': '鳥', '鷹': '鳥', '鷲': '鳥', '鶴': '鳥', '鴛': '鳥',
  '鸚': '鳥', '鵬': '鳥',

  // 馬 (horse)
  '馬': '馬', '駅': '馬', '駆': '馬', '騎': '馬', '験': '馬', '騒': '馬',

  // 車 (cart)
  '車': '車', '軍': '車', '転': '車', '軽': '車', '輸': '車', '輪': '車', '軌': '車',
  '較': '車', '载': '車',

  // 門 (gate)
  '門': '門', '間': '門', '開': '門', '閉': '門', '関': '門', '閣': '門', '閲': '門',

  // 雨 (rain)
  '雨': '雨', '雪': '雨', '雷': '雨', '霧': '雨', '霜': '雨', '電': '雨', '雲': '雨',
  '露': '雨', '霞': '雨',

  // 山 (mountain) — continued
  '峠': '山', '崖': '山', '嶺': '山', '岳': '山',

  // 田 (field)
  '田': '田', '男': '田', '町': '田', '甲': '田', '由': '田', '申': '田', '留': '田',
  '番': '田', '画': '田', '異': '田', '略': '田', '畑': '田', '畳': '田',

  // 目 (eye)
  '目': '目', '眼': '目', '睡': '目', '盲': '目', '眉': '目', '督': '目',
  '盾': '目', '省': '目', '相': '目',

  // 竹 (bamboo)
  '竹': '竹', '笑': '竹', '答': '竹', '算': '竹', '節': '竹', '箱': '竹', '筆': '竹',
  '筒': '竹', '符': '竹', '第': '竹', '管': '竹', '等': '竹', '篤': '竹', '範': '竹',

  // 糸 (thread)
  '糸': '糸', '紙': '糸', '細': '糸', '終': '糸', '結': '糸', '絵': '糸', '給': '糸',
  '経': '糸', '続': '糸', '縁': '糸', '線': '糸', '織': '糸', '緑': '糸', '統': '糸',
  '絶': '糸', '緊': '糸', '緒': '糸', '縫': '糸', '紅': '糸', '素': '糸', '綿': '糸',
  '練': '糸', '総': '糸', '縮': '糸', '絡': '糸', '紡': '糸', '紛': '糸', '績': '糸',

  // 石 (stone)
  '石': '石', '砂': '石', '碑': '石', '磁': '石', '確': '石', '硬': '石',
  '研': '石', '砕': '石', '磨': '石', '礎': '石',

  // 足 (foot)
  '足': '足', '踏': '足', '跡': '足', '路': '足', '距': '足', '跳': '足',

  // 艸/草 (grass) — includes 艹
  '草': '艸', '花': '艸', '芸': '艸', '若': '艸', '英': '艸', '荒': '艸', '荷': '艸',
  '菊': '艸', '落': '艸', '葉': '艸', '蒸': '艸', '藤': '艸', '薄': '艸', '薬': '艸',
  '蓮': '艸', '茶': '艸', '芽': '艸', '苦': '艸', '苗': '艸', '菜': '艸', '著': '艸',
  '蔵': '艸', '薫': '艸', '萌': '艸', '茎': '艸', '苔': '艸', '芋': '艸',

  // 虫 (insect)
  '虫': '虫', '蛇': '虫', '蜂': '虫', '蝶': '虫', '蚊': '虫', '蟹': '虫', '蛙': '虫',

  // 貝 (shell)
  '貝': '貝', '財': '貝', '貨': '貝', '買': '貝', '費': '貝', '貯': '貝', '贈': '貝',
  '購': '貝', '賞': '貝', '資': '貝', '賃': '貝', '貿': '貝', '貸': '貝', '賛': '貝',

  // 立 (stand)
  '立': '立', '站': '立', '童': '立', '端': '立', '競': '立',

  // 木-related (merged into main 木 section above)

  // 米 (rice)
  '米': '米', '粉': '米', '粒': '米', '精': '米', '糖': '米', '糧': '米',

  // 示 (spirit) — includes 礻 (shimesuhen)
  '示': '示', '社': '示', '神': '示', '祭': '示', '福': '示', '礼': '示', '祈': '示',
  '禁': '示', '祖': '示',

  // 衣 (clothes) — includes 衤 (koromohen)
  '衣': '衣', '裁': '衣', '裏': '衣', '補': '衣', '装': '衣', '製': '衣', '複': '衣',
  '被': '衣', '袋': '衣',

  // 行 (walk)
  '行': '行', '術': '行', '街': '行', '衛': '行', '衝': '行',

  // 禾 (grain)
  '禾': '禾', '秋': '禾', '科': '禾', '種': '禾', '稲': '禾', '穀': '禾',
  '程': '禾', '税': '禾', '稼': '禾', '移': '禾', '積': '禾', '穂': '禾',

  // 頁 (page)
  '頁': '頁', '頭': '頁', '顔': '頁', '題': '頁', '頂': '頁', '顧': '頁', '頼': '頁',
  '頑': '頁', '順': '頁', '頻': '頁', '類': '頁',

  // 阜 (mound) — includes 阝 (kozato-hen, oozato)
  '阿': '阜', '院': '阜', '除': '阜', '陸': '阜', '階': '阜', '陽': '阜', '降': '阜',
  '限': '阜', '隊': '阜', '際': '阜', '隣': '阜', '障': '阜',

  // 邑 (city) — includes 阝 right (mura)
  '郡': '邑', '部': '邑', '郵': '邑', '都': '邑', '郷': '邑',

  // 走 (run)
  '走': '走', '起': '走', '超': '走', '越': '走',

  // 辵 (walk) — includes 辶 (shinnyou)
  '道': '辵', '進': '辵', '送': '辵', '返': '辵', '追': '辵', '遠': '辵', '近': '辵',
  '通': '辵', '速': '辵', '連': '辵', '運': '辵', '過': '辵', '違': '辵', '遊': '辵',
  '遅': '辵', '辺': '辵', '迎': '辵', '退': '辵', '途': '辵', '選': '辵', '適': '辵',
  '迷': '辵', '逃': '辵', '逆': '辵', '達': '辵', '遭': '辵', '遷': '辵',

  // 攴 (strike) — includes 攵 (bokunyuu)
  '教': '攴', '政': '攴', '故': '攴', '救': '攴', '敗': '攴', '敵': '攴', '整': '攴',
  '散': '攴', '数': '攴', '敬': '攴', '敷': '攴',

  // 力 (power)
  '力': '力', '加': '力', '助': '力', '努': '力', '勉': '力', '動': '力', '勝': '力',
  '働': '力', '勤': '力', '勢': '力', '勇': '力', '劣': '力', '効': '力',

  // 刀 (knife) — includes 刂 (rittou)
  '刀': '刀', '切': '刀', '分': '刀', '刷': '刀', '判': '刀', '別': '刀', '初': '刀',
  '制': '刀', '剣': '刀', '剰': '刀', '副': '刀', '創': '刀', '刻': '刀', '前': '刀',
  '割': '刀', '剤': '刀',

  // 二 (two)
  '二': '二', '亜': '二', '互': '二', '五': '二', '亘': '二',

  // 八 (eight)
  '八': '八', '六': '八', '公': '八', '共': '八', '典': '八', '具': '八', '兵': '八',
  '兼': '八',

  // 入 (enter)
  '入': '入', '内': '入',

  // 十 (ten)
  '十': '十', '千': '十', '午': '十', '卒': '十', '南': '十', '博': '十', '協': '十',
  '単': '十', '升': '十', '卓': '十',

  // 大 (big)
  '大': '大', '天': '大', '太': '大', '夫': '大', '失': '大', '奇': '大', '奈': '大',
  '奥': '大', '奮': '大', '奉': '大', '奔': '大', '契': '大',

  // 工 (work)
  '工': '工', '左': '工', '巧': '工', '巨': '工', '差': '工',

  // 己 (oneself)
  '己': '己', '巳': '己', '巴': '己', '改': '己',

  // 巾 (cloth/turban)
  '巾': '巾', '市': '巾', '布': '巾', '帆': '巾', '帯': '巾', '帰': '巾',
  '席': '巾', '帽': '巾', '幕': '巾', '帳': '巾', '幣': '巾', '幅': '巾',

  // 干 (dry)
  '干': '干', '年': '干', '幸': '干', '平': '干',

  // 广 (dotted cliff/wide roof)
  '広': '广', '店': '广', '府': '广', '度': '广', '座': '广', '庫': '广', '庭': '广',
  '康': '广', '廃': '广', '廊': '广', '底': '广', '序': '广',

  // 廴 (long stride)
  '廷': '廴', '建': '廴', '延': '廴',

  // 弓 (bow)
  '弓': '弓', '引': '弓', '弟': '弓', '弦': '弓', '弧': '弓', '張': '弓', '強': '弓',
  '弱': '弓', '弾': '弓',

  // 彡 (bristle/hair)
  '形': '彡', '影': '彡', '彩': '彡', '彫': '彡', '彰': '彡',

  // 彳 (step)
  '彼': '彳', '往': '彳', '征': '彳', '後': '彳', '御': '彳', '律': '彳', '徳': '彳',
  '微': '彳', '徒': '彳', '得': '彳', '従': '彳', '徴': '彳', '復': '彳',

  // 戈 (halberd)
  '戈': '戈', '戒': '戈', '我': '戈', '武': '戈', '威': '戈', '戦': '戈', '歳': '戈',
  '戯': '戈', '戻': '戈', '成': '戈',

  // 戸 (door)
  '戸': '戶', '房': '戶', '所': '戶', '扇': '戶', '扉': '戶',

  // 文 (script/literature)
  '文': '文', '斑': '文',

  // 斤 (axe)
  '斤': '斤', '斥': '斤', '断': '斤', '新': '斤', '斬': '斤', '斯': '斤',

  // 方 (direction/square)
  '方': '方', '放': '方', '旅': '方', '族': '方', '旗': '方', '施': '方', '旋': '方',

  // 欠 (lack/yawn)
  '欠': '欠', '次': '欠', '歌': '欠', '欲': '欠', '欺': '欠', '欧': '欠', '歓': '欠',
  '款': '欠',

  // 止 (stop)
  '止': '止', '正': '止', '歩': '止', '歴': '止', '此': '止',

  // 毛 (fur/hair)
  '毛': '毛', '毫': '毛',

  // 气 (steam/spirit)
  '気': '气', '汽': '气',

  // 爪 (claw)
  '爪': '爪', '争': '爪', '爵': '爪',

  // 片 (slice)
  '片': '片', '版': '片', '牌': '片',

  // 牛 (cow/bull)
  '牛': '牛', '牧': '牛', '物': '牛', '特': '牛', '牲': '牛',

  // 犬 (dog) — includes 犭 (kemono-hen)
  '犬': '犬', '犯': '犬', '狗': '犬', '独': '犬', '猫': '犬', '猟': '犬', '猛': '犬',
  '獣': '犬', '狭': '犬', '猿': '犬', '狸': '犬', '狼': '犬',

  // 玉 (jade/jewel) — includes 王 (ruler)
  '玉': '玉', '王': '玉', '球': '玉', '理': '玉', '班': '玉', '現': '玉', '珍': '玉',
  '環': '玉', '宝': '玉',

  // 生 (life/birth)
  '生': '生', '産': '生',

  // 用 (use)
  '用': '用',

  // 白 (white)
  '白': '白', '的': '白', '百': '白', '皆': '白', '皇': '白',

  // 皮 (skin)
  '皮': '皮',

  // 皿 (dish/plate)
  '皿': '皿', '盆': '皿', '盛': '皿', '益': '皿', '盤': '皿', '監': '皿', '盟': '皿',
  '盗': '皿',

  // 矢 (arrow)
  '矢': '矢', '知': '矢', '医': '矢', '矩': '矢',

  // 穴 (cave/hole)
  '穴': '穴', '空': '穴', '突': '穴', '窓': '穴', '窮': '穴', '窒': '穴', '穿': '穴',
  '究': '穴', '窃': '穴',

  // 羊 (sheep)
  '羊': '羊', '美': '羊', '義': '羊', '羨': '羊', '群': '羊', '羞': '羊',

  // 羽 (feather/wing)
  '羽': '羽', '習': '羽', '翻': '羽', '翼': '羽',

  // 耳 (ear)
  '耳': '耳', '聞': '耳', '聴': '耳', '聖': '耳', '職': '耳', '聡': '耳',

  // 肉 (flesh/meat) — written as 月 (nikuzuki) in compounds; group all under 月
  '肉': '月', '肌': '月', '胸': '月', '腸': '月', '臓': '月', '肺': '月', '脳': '月',
  '脚': '月', '腕': '月', '背': '月', '腹': '月', '胃': '月', '膚': '月',

  // 自 (self)
  '自': '自', '臭': '自',

  // 色 (color)
  '色': '色', '艶': '色',

  // 見 (see)
  '見': '見', '視': '見', '親': '見', '観': '見', '規': '見', '覚': '見', '覧': '見',

  // 角 (horn/corner)
  '角': '角', '解': '角', '触': '角',

  // 酉 (sake/rooster)
  '酉': '酉', '酒': '酉', '酸': '酉', '酢': '酉', '醒': '酉', '配': '酉', '酔': '酉',
  '醸': '酉',

  // 長 (long)
  '長': '長',

  // 隹 (short-tailed bird)
  '隹': '隹', '雄': '隹', '雌': '隹', '集': '隹', '雑': '隹', '難': '隹', '雇': '隹',
  '雅': '隹',

  // 青 (blue/green)
  '青': '青', '靖': '青',

  // 音 (sound)
  '音': '音',

  // 骨 (bone)
  '骨': '骨', '骸': '骨',

  // 高 (tall/high)
  '高': '高',

  // 鬼 (ghost/demon)
  '鬼': '鬼', '魂': '鬼', '魅': '鬼', '魔': '鬼',

  // 鹿 (deer)
  '鹿': '鹿', '麗': '鹿',
}

/**
 * Detect radical from kanji character using a lookup table.
 * This is a fallback when Jisho API doesn't provide radical information.
 * @param {string} kanji - The kanji character to look up
 * @returns {string|null} - The radical character, or null if not found
 */
export function detectRadicalFromKanji(kanji) {
  if (!kanji || typeof kanji !== 'string') return null
  const char = kanji.trim()[0]
  if (!char) return null
  return KANJI_TO_RADICAL[char] || null
}
