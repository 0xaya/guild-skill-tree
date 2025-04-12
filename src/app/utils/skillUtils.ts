import Papa from "papaparse";
import { Skill, SkillLevel } from "../types/skill";

// 材料名の配列（CSVヘッダーから取得する際に使用）
const MATERIAL_COLUMNS = [
  "記憶の書",
  "剛力Ⅰ",
  "剛力Ⅱ",
  "剛力Ⅲ",
  "鉄壁Ⅰ",
  "鉄壁Ⅱ",
  "鉄壁Ⅲ",
  "魔道Ⅰ",
  "魔道Ⅱ",
  "魔道Ⅲ",
  "精微Ⅰ",
  "精微Ⅱ",
  "精微Ⅲ",
  "疾風Ⅰ",
  "疾風Ⅱ",
  "疾風Ⅲ",
  "救済Ⅰ",
  "救済Ⅱ",
  "救済Ⅲ",
];

// スキル系統別の色定義
export const SKILL_COLORS = {
  strength: "#FF6B6B", // 腕力系統（赤系）
  vitality: "#FFA07A", // 体力系統（オレンジ系）
  agility: "#4DB6AC", // 速さ系統（青緑で明るめ）
  intelligence: "#9370DB", // 知力系統（紫系）
  dexterity: "#6A5ACD", // 器用系統（濃い青紫系）
  mind: "#87CEEB", // 精神系統（水色系）
  core: "#0066CC", // コア（青系）
};

// カテゴリ名のマッピング
export const CATEGORY_MAPPING: { [key: string]: keyof typeof SKILL_COLORS } = {
  "腕力系統": "strength",
  "体力系統": "vitality",
  "速さ系統": "agility",
  "知力系統": "intelligence",
  "器用系統": "dexterity",
  "精神系統": "mind",
  "コア": "core", // コアは独自の色を使用
};

// スキルIDとその座標をマッピングするための定義
// 配置調整 Ver.8 (二次スキル反時計回り, 三次スキル半径拡大)
export const SKILL_POSITIONS: { [key: string]: { x: number; y: number; radius?: number; color?: string } } = {
  // 中心
  core: { x: 400, y: 400, radius: 67.5 },

  // 一次スキル (半径 約90)
  "11": { x: 400, y: 310, color: SKILL_COLORS.strength }, // 90度（真上）
  "12": {
    x: 400 + 90 * Math.sin(Math.PI * 0.372),
    y: 400 - 90 * Math.cos(Math.PI * 0.372),
    color: SKILL_COLORS.vitality,
  }, // 67度
  "13": {
    x: 400 + 90 * Math.sin(Math.PI * 0.628),
    y: 400 - 90 * Math.cos(Math.PI * 0.628),
    color: SKILL_COLORS.agility,
  }, // 113度
  "14": { x: 400, y: 490, color: SKILL_COLORS.intelligence }, // 240度
  "15": {
    x: 400 + 90 * Math.sin(Math.PI * 1.372),
    y: 400 - 90 * Math.cos(Math.PI * 1.372),
    color: SKILL_COLORS.dexterity,
  }, // 247度
  "16": { x: 400 + 90 * Math.sin(Math.PI * 1.628), y: 400 - 90 * Math.cos(Math.PI * 1.628), color: SKILL_COLORS.mind }, // 293度

  // 二次スキル (半径 約190) - 反時計回り 30度ごと
  "21": { x: 400, y: 210, color: SKILL_COLORS.strength }, // 90度（真上）
  "212": {
    x: 400 + 190 * Math.sin(Math.PI * 1.8),
    y: 400 - 190 * Math.cos(Math.PI * 1.8),
    color: SKILL_COLORS.strength,
  }, // 324度
  "211": {
    x: 400 + 190 * Math.sin(Math.PI * 1.65),
    y: 400 - 190 * Math.cos(Math.PI * 1.65),
    color: SKILL_COLORS.intelligence,
  }, // 297度
  "210": { x: 210, y: 400, color: SKILL_COLORS.intelligence }, // 180度（真左）
  "29": {
    x: 400 + 190 * Math.sin(Math.PI * 1.35),
    y: 400 - 190 * Math.cos(Math.PI * 1.35),
    color: SKILL_COLORS.dexterity,
  }, // 243度
  "28": {
    x: 400 + 190 * Math.sin(Math.PI * 1.2),
    y: 400 - 190 * Math.cos(Math.PI * 1.2),
    color: SKILL_COLORS.dexterity,
  }, // 216度
  "27": { x: 400, y: 590, color: SKILL_COLORS.mind }, // 270度（真下）
  "26": {
    x: 400 + 190 * Math.sin(Math.PI * 0.8),
    y: 400 - 190 * Math.cos(Math.PI * 0.8),
    color: SKILL_COLORS.vitality,
  }, // 144度
  "25": {
    x: 400 + 190 * Math.sin(Math.PI * 0.65),
    y: 400 - 190 * Math.cos(Math.PI * 0.65),
    color: SKILL_COLORS.agility,
  }, // 117度
  "24": { x: 590, y: 400, color: SKILL_COLORS.strength }, // 0度（真右）
  "23": {
    x: 400 + 190 * Math.sin(Math.PI * 0.35),
    y: 400 - 190 * Math.cos(Math.PI * 0.35),
    color: SKILL_COLORS.vitality,
  }, // 63度
  "22": {
    x: 400 + 190 * Math.sin(Math.PI * 0.2),
    y: 400 - 190 * Math.cos(Math.PI * 0.2),
    color: SKILL_COLORS.vitality,
  }, // 36度

  // 三次スキル (半径 約320) - 等間隔 15度ごと
  "31": { x: 400, y: 80, color: SKILL_COLORS.strength }, // 90度
  "32": {
    x: 400 + 320 * Math.sin(Math.PI * 0.111),
    y: 400 - 320 * Math.cos(Math.PI * 0.111),
    color: SKILL_COLORS.strength,
  }, // 20度
  "33": {
    x: 400 + 320 * Math.sin(Math.PI * 0.211),
    y: 400 - 320 * Math.cos(Math.PI * 0.211),
    color: SKILL_COLORS.vitality,
  }, // 38度
  "34": {
    x: 400 + 320 * Math.sin(Math.PI * 0.289),
    y: 400 - 320 * Math.cos(Math.PI * 0.289),
    color: SKILL_COLORS.agility,
  }, // 52度
  "35": {
    x: 400 + 320 * Math.sin(Math.PI * 0.367),
    y: 400 - 320 * Math.cos(Math.PI * 0.367),
    color: SKILL_COLORS.intelligence,
  }, // 66度
  "36": {
    x: 400 + 320 * Math.sin(Math.PI * 0.433),
    y: 400 - 320 * Math.cos(Math.PI * 0.433),
    color: SKILL_COLORS.agility,
  }, // 78度
  "37": { x: 710, y: 400, color: SKILL_COLORS.strength }, // 0 deg
  "38": {
    x: 400 + 320 * Math.sin(Math.PI * 0.567),
    y: 400 - 320 * Math.cos(Math.PI * 0.567),
    color: SKILL_COLORS.intelligence,
  }, // 102度
  "39": {
    x: 400 + 320 * Math.sin(Math.PI * 0.633),
    y: 400 - 320 * Math.cos(Math.PI * 0.633),
    color: SKILL_COLORS.vitality,
  }, // 114度
  "310": {
    x: 400 + 320 * Math.sin(Math.PI * 0.711),
    y: 400 - 320 * Math.cos(Math.PI * 0.711),
    color: SKILL_COLORS.intelligence,
  }, // 128度
  "311": {
    x: 400 + 320 * Math.sin(Math.PI * 0.789),
    y: 400 - 320 * Math.cos(Math.PI * 0.789),
    color: SKILL_COLORS.intelligence,
  }, // 142度
  "312": {
    x: 400 + 320 * Math.sin(Math.PI * 0.889),
    y: 400 - 320 * Math.cos(Math.PI * 0.889),
    color: SKILL_COLORS.intelligence,
  }, // 160度
  "313": { x: 400, y: 720, color: SKILL_COLORS.mind }, // -90 deg
  "314": {
    x: 400 + 320 * Math.sin(Math.PI * 1.111),
    y: 400 - 320 * Math.cos(Math.PI * 1.111),
    color: SKILL_COLORS.dexterity,
  }, // 200度
  "315": {
    x: 400 + 320 * Math.sin(Math.PI * 1.211),
    y: 400 - 320 * Math.cos(Math.PI * 1.211),
    color: SKILL_COLORS.dexterity,
  }, // 218度
  "316": {
    x: 400 + 320 * Math.sin(Math.PI * 1.289),
    y: 400 - 320 * Math.cos(Math.PI * 1.289),
    color: SKILL_COLORS.strength,
  }, // 232度
  "317": {
    x: 400 + 320 * Math.sin(Math.PI * 1.367),
    y: 400 - 320 * Math.cos(Math.PI * 1.367),
    color: SKILL_COLORS.intelligence,
  }, // 246度
  "318": {
    x: 400 + 320 * Math.sin(Math.PI * 1.433),
    y: 400 - 320 * Math.cos(Math.PI * 1.433),
    color: SKILL_COLORS.mind,
  }, // 258度
  "319": { x: 90, y: 400, color: SKILL_COLORS.intelligence }, // -180 deg
  "320": {
    x: 400 + 320 * Math.sin(Math.PI * 1.567),
    y: 400 - 320 * Math.cos(Math.PI * 1.567),
    color: SKILL_COLORS.intelligence,
  }, // 282度
  "321": {
    x: 400 + 320 * Math.sin(Math.PI * 1.633),
    y: 400 - 320 * Math.cos(Math.PI * 1.633),
    color: SKILL_COLORS.intelligence,
  }, // 294度
  "322": {
    x: 400 + 320 * Math.sin(Math.PI * 1.711),
    y: 400 - 320 * Math.cos(Math.PI * 1.711),
    color: SKILL_COLORS.strength,
  }, // 308度
  "323": {
    x: 400 + 320 * Math.sin(Math.PI * 1.789),
    y: 400 - 320 * Math.cos(Math.PI * 1.789),
    color: SKILL_COLORS.strength,
  }, // 322度
  "324": {
    x: 400 + 320 * Math.sin(Math.PI * 1.889),
    y: 400 - 320 * Math.cos(Math.PI * 1.889),
    color: SKILL_COLORS.strength,
  }, // 340度
};

// スキルの親子関係を定義（前提条件）
// ユーザー修正に基づきコメントを更新
const SKILL_PARENTS: { [key: string]: string[] } = {
  // 中央から一次スキル
  "11": ["core"],
  "12": ["core"],
  "13": ["core"],
  "14": ["core"],
  "15": ["core"],
  "16": ["core"],
  // 一次スキルから二次スキル
  "21": ["11"], // HPⅡ ← 腕力Ⅰ
  "212": ["21"], // 物理クリ率Ⅱ ← HPⅡ
  "22": ["23"], // HPⅠ ← 防御力Ⅰ
  "23": ["12"], // 防御力Ⅰ ← 体力Ⅰ
  "24": ["25"], // 物理スキル威力Ⅰ ← 攻撃速度Ⅰ
  "25": ["13"], // 攻撃速度Ⅰ ← 速さⅠ
  "26": ["27"], // HPⅢ ← 魔法スキル威力Ⅰ
  "27": ["14"], // 魔法スキル威力Ⅰ ← 知力Ⅰ
  "28": ["29"], // 攻撃速度Ⅱ ← 物理クリ率Ⅰ
  "29": ["15"], // 物理クリ率Ⅰ ← 器用Ⅰ
  "210": ["211"], // 詠唱速度Ⅰ ← MPⅠ
  "211": ["16"], // MPⅠ ← 精神Ⅰ
  // 二次スキルから三次スキル
  "31": ["21"], // 攻撃速度Ⅲ ← HPⅡ
  "324": ["31"], // 物理スキル威力Ⅱ ← 攻撃速度Ⅲ
  "323": ["212"], // 腕力Ⅱ ← 物理クリ率Ⅱ
  "322": ["323"], // 無双 ← 腕力Ⅱ

  "32": ["22"], // 体力Ⅱ ← HPⅠ
  "33": ["32"], // 不死 ← 体力Ⅱ
  "35": ["23"], // MPⅡ ← 防御力Ⅰ
  "34": ["35"], // EXP獲得率 ← MPⅡ

  "36": ["24"], // 速さⅡ ← 物理スキル威力Ⅰ
  "37": ["36"], // 明鏡 ← 速さⅡ
  "38": ["39"], // 詠唱速度Ⅱ ← 防御力Ⅱ
  "39": ["25"], // 防御力Ⅱ ← 攻撃速度Ⅰ

  "310": ["26"], // 魔法スキル威力Ⅱ ← HPⅢ
  "311": ["312"], // 深淵 ← 知力Ⅱ
  "312": ["313"], // 知力Ⅱ ← MPⅢ
  "313": ["27"], // MPⅢ ← 魔法スキル威力Ⅰ

  "314": ["28"], // 器用Ⅱ ← 攻撃速度Ⅱ
  "315": ["314"], // 専心 ← 器用Ⅱ
  "316": ["317"], // 物理クリ倍率 ← 魔法クリ率Ⅰ
  "317": ["29"], // 魔法クリ率Ⅰ ← 物理クリ率Ⅰ

  "318": ["210"], // 精神Ⅱ ← 詠唱速度Ⅰ
  "319": ["318"], // 求道 ← 精神Ⅱ
  "320": ["321"], // 魔法クリ倍率 ← 魔法クリ率Ⅱ
  "321": ["211"], // 魔法クリ率Ⅱ ← MPⅠ
};

// スキルの接続情報を生成
export const SKILL_CONNECTIONS = Object.entries(SKILL_PARENTS).flatMap(([childId, parentIds]) =>
  parentIds.map(parentId => ({
    source: parentId,
    target: childId,
  }))
);

// CSVからスキルデータをロードして処理する
export const loadSkillsFromCSV = async (): Promise<Skill[]> => {
  try {
    const response = await fetch("/data/skills.sv");
    const csvData = await response.text();

    const result = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
    });

    const skillsMap: { [key: string]: Skill } = {};

    // 各行をループして処理
    result.data.forEach((row: any) => {
      const skillId = row["No"];
      if (!skillId) return;
      const skillName = row["スキル名"];
      if (!skillName) return;

      const levelMatch = skillName.match(/Lv(\d+)$/);
      const level = levelMatch ? parseInt(levelMatch[1], 10) : 1;

      const materials: { [key: string]: number } = {};
      MATERIAL_COLUMNS.forEach(mat => {
        const value = row[mat] ? parseInt(row[mat], 10) : 0;
        if (value > 0) {
          materials[mat] = value;
        }
      });

      const skillLevel: SkillLevel = {
        level,
        guildCoins: parseInt(row["ギルドコイン"] || "0", 10),
        materials,
      };

      const baseName = skillName.replace(/Lv\d+$/, "");

      if (skillsMap[skillId]) {
        skillsMap[skillId].levels.push(skillLevel);
      } else {
        const parentIds = SKILL_PARENTS[skillId] || [];
        const position = SKILL_POSITIONS[skillId] || { x: Math.random() * 600 + 100, y: Math.random() * 600 + 100 };

        skillsMap[skillId] = {
          id: skillId,
          name: baseName,
          category: row["系統"] || "不明",
          type: row["タイプ"] === "アクティブ" ? "アクティブ" : "パッシブ",
          description: row["説明"] || "",
          requiredRank: parseInt(row["必要ランク"] || "1", 10),
          levels: [skillLevel],
          x: position.x,
          y: position.y,
          parentIds,
        };
      }
    });

    Object.values(skillsMap).forEach(skill => {
      skill.levels.sort((a, b) => a.level - b.level);
    });

    const coreNode: Skill = {
      id: "core",
      name: "コア",
      category: "コア",
      type: "パッシブ",
      description: "スキルツリーの中心",
      requiredRank: 1,
      levels: [{ level: 1, guildCoins: 0, materials: {} }],
      x: SKILL_POSITIONS["core"]?.x || 400,
      y: SKILL_POSITIONS["core"]?.y || 400,
      parentIds: [],
    };

    const existingSkillIds = new Set(["core", ...Object.keys(skillsMap)]);
    Object.values(skillsMap).forEach(skill => {
      skill.parentIds = skill.parentIds?.filter(parentId => existingSkillIds.has(parentId));
    });

    return [coreNode, ...Object.values(skillsMap)];
  } catch (error) {
    console.error("Failed to load skills:", error);
    return [];
  }
};

// スキルがアンロックされているかチェックする
export const isSkillUnlocked = (
  skill: Skill,
  selectedSkills: { [key: string]: number },
  guildRank: number
): boolean => {
  // ランク要件チェックを再度有効化
  if (skill.levels[0] && skill.levels[0].level === 1 && skill.requiredRank > guildRank) {
    // Lv1取得時のランクチェックのみ行う（仮）
    // 実際には次のレベルのランクをチェックする必要があるかもしれない
    // return false;
  }

  if (skill.id === "core") {
    return true;
  }

  if (!skill.parentIds || skill.parentIds.length === 0) {
    console.warn(`Skill ${skill.id} (${skill.name}) has no parent IDs defined or available after filtering.`);
    // 親が定義されていないスキルも、 일단 true にして表示はされるようにする
    return true;
  }

  return skill.parentIds.some(parentId => (selectedSkills[parentId] || 0) > 0);
};

// スキルツリー内のレベル指定スキルの総コストを計算
export const calculateTotalCost = (
  skills: Skill[],
  selectedSkills: { [key: string]: number }
): { coins: number; materials: { [key: string]: number } } => {
  let totalCoins = 0;
  const totalMaterials: { [key: string]: number } = {};

  skills.forEach(skill => {
    const selectedLevel = selectedSkills[skill.id] || 0;
    if (selectedLevel <= 0) return;

    for (let i = 0; i < selectedLevel; i++) {
      if (skill.levels[i]) {
        totalCoins += skill.levels[i].guildCoins;
        Object.entries(skill.levels[i].materials).forEach(([matName, amount]) => {
          totalMaterials[matName] = (totalMaterials[matName] || 0) + amount;
        });
      }
    }
  });

  return { coins: totalCoins, materials: totalMaterials };
};

// リソース要件を計算する
export const calculateResourceNeeds = (
  skills: Skill[],
  selectedSkills: { [key: string]: number }
): { coins: number; materials: { [key: string]: number } } => {
  return calculateTotalCost(skills, selectedSkills);
};

export type SkillCategory = "攻撃" | "防御" | "支援" | "特殊" | "コア";

export const SKILL_CATEGORY_COLORS: Record<SkillCategory, string> = {
  攻撃: "#f87171", // 赤
  防御: "#60a5fa", // 青
  支援: "#34d399", // 緑
  特殊: "#fbbf24", // 黄
  コア: "#f472b6", // ピンク
} as const;
