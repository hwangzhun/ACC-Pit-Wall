import { computed } from 'vue'
import { currentLanguage } from './index'
import { TRACK_NAMES } from '../types/defaults'
import { getNationalityFlagIso, nationalities, carModels } from '../data/mappings'

// 车型名称映射（与 src/data/mappings.ts 中 carModels 的 id 一致）
const carModelTranslations: Record<number, { zh: string; en: string }> = {
  0: { zh: '保时捷 991 GT3 R', en: 'Porsche 991 GT3 R' },
  1: { zh: '梅赛德斯-AMG GT3', en: 'Mercedes-AMG GT3' },
  2: { zh: '法拉利 488 GT3', en: 'Ferrari 488 GT3' },
  3: { zh: '奥迪 R8 LMS', en: 'Audi R8 LMS' },
  4: { zh: '兰博基尼 Huracan GT3', en: 'Lamborghini Huracán GT3' },
  5: { zh: '迈凯伦 650S GT3', en: 'McLaren 650S GT3' },
  6: { zh: '日产 GT-R Nismo GT3 2018', en: 'Nissan GT-R Nismo GT3 2018' },
  7: { zh: '宝马 M6 GT3', en: 'BMW M6 GT3' },
  8: { zh: '宾利 Continental GT3 2018', en: 'Bentley Continental GT3 2018' },
  9: { zh: '保时捷 991II GT3 Cup', en: 'Porsche 991 II GT3 Cup' },
  10: { zh: '日产 GT-R Nismo GT3 2017', en: 'Nissan GT-R Nismo GT3 2017' },
  11: { zh: '宾利 Continental GT3 2016', en: 'Bentley Continental GT3 2016' },
  12: { zh: '阿斯顿·马丁 V12 Vantage GT3', en: 'Aston Martin V12 Vantage GT3' },
  13: { zh: '兰博基尼 Gallardo R-EX', en: 'Lamborghini Gallardo R-EX' },
  14: { zh: '捷豹 G3', en: 'Jaguar G3' },
  15: { zh: '雷克萨斯 RC F GT3', en: 'Lexus RC F GT3' },
  16: { zh: '兰博基尼 Huracan Evo (2019)', en: 'Lamborghini Huracán Evo (2019)' },
  17: { zh: '本田 NSX GT3', en: 'Honda NSX GT3' },
  18: { zh: '兰博基尼 Huracan SuperTrofeo', en: 'Lamborghini Huracán Super Trofeo' },
  19: { zh: '奥迪 R8 LMS Evo (2019)', en: 'Audi R8 LMS Evo (2019)' },
  20: { zh: '阿斯顿·马丁 V8 Vantage (2019)', en: 'Aston Martin V8 Vantage (2019)' },
  21: { zh: '本田 NSX Evo (2019)', en: 'Honda NSX Evo (2019)' },
  22: { zh: '迈凯伦 720S GT3 (2019)', en: 'McLaren 720S GT3 (2019)' },
  23: { zh: '保时捷 911II GT3 R (2019)', en: 'Porsche 911 II GT3 R (2019)' },
  24: { zh: '法拉利 488 GT3 Evo 2020', en: 'Ferrari 488 GT3 Evo 2020' },
  25: { zh: '梅赛德斯-AMG GT3 2020', en: 'Mercedes-AMG GT3 2020' },
  26: { zh: '法拉利 488 Challenge Evo', en: 'Ferrari 488 Challenge Evo' },
  27: { zh: '宝马 M2 CS Racing', en: 'BMW M2 CS Racing' },
  28: { zh: '保时捷 911 GT3 Cup (Type 992)', en: 'Porsche 911 GT3 Cup (Type 992)' },
  29: { zh: '兰博基尼 Huracán Super Trofeo EVO2', en: 'Lamborghini Huracán Super Trofeo EVO2' },
  30: { zh: '宝马 M4 GT3', en: 'BMW M4 GT3' },
  31: { zh: '奥迪 R8 LMS GT3 evo II', en: 'Audi R8 LMS GT3 Evo II' },
  32: { zh: '法拉利 296 GT3', en: 'Ferrari 296 GT3' },
  33: { zh: '兰博基尼 Huracan Evo2', en: 'Lamborghini Huracán Evo2' },
  34: { zh: '保时捷 992 GT3 R', en: 'Porsche 992 GT3 R' },
  35: { zh: '迈凯伦 720S GT3 Evo 2023', en: 'McLaren 720S GT3 Evo 2023' },
  36: { zh: '福特 Mustang GT3', en: 'Ford Mustang GT3' },
  50: { zh: '阿尔卑斯 A110 GT4', en: 'Alpine A110 GT4' },
  51: { zh: '阿斯顿·马丁 V8 Vantage GT4', en: 'Aston Martin V8 Vantage GT4' },
  52: { zh: '奥迪 R8 LMS GT4', en: 'Audi R8 LMS GT4' },
  53: { zh: '宝马 M4 GT4', en: 'BMW M4 GT4' },
  55: { zh: '雪佛兰 Camaro GT4', en: 'Chevrolet Camaro GT4' },
  56: { zh: '吉内塔 G55 GT4', en: 'Ginetta G55 GT4' },
  57: { zh: 'KTM X-Bow GT4', en: 'KTM X-Bow GT4' },
  58: { zh: '玛莎拉蒂 MC GT4', en: 'Maserati MC GT4' },
  59: { zh: '迈凯伦 570S GT4', en: 'McLaren 570S GT4' },
  60: { zh: '梅赛德斯-AMG GT4', en: 'Mercedes-AMG GT4' },
  61: { zh: '保时捷 718 Cayman GT4', en: 'Porsche 718 Cayman GT4' },
  80: { zh: '奥迪 R8 LMS GT2', en: 'Audi R8 LMS GT2' },
  82: { zh: 'KTM XBOW GT2', en: 'KTM X-Bow GT2' },
  83: { zh: '玛莎拉蒂 MC20 GT2', en: 'Maserati MC20 GT2' },
  84: { zh: '梅赛德斯 AMG GT2', en: 'Mercedes-AMG GT2' },
  85: { zh: '保时捷 911 GT2 RS CS Evo', en: 'Porsche 911 GT2 RS CS Evo' },
  86: { zh: '保时捷 935', en: 'Porsche 935' },
}

// 车手等级映射
const driverCategoryTranslations: Record<number, { zh: string; en: string }> = {
  0: { zh: '铂金', en: 'Platinum' },
  1: { zh: '黄金', en: 'Gold' },
  2: { zh: '白银', en: 'Silver' },
  3: { zh: '青铜', en: 'Bronze' },
}

// 杯赛类别映射
const cupCategoryTranslations: Record<number, { zh: string; en: string }> = {
  0: { zh: 'GT3', en: 'GT3' },
  1: { zh: 'GT4', en: 'GT4' },
  2: { zh: 'GTC', en: 'GTC' },
  3: { zh: 'TCX', en: 'TCX' },
}

// 国籍映射（与 src/data/mappings.ts 中 nationalities 的 id 一致）
const nationalityTranslations: Record<number, { zh: string; en: string }> = {
  0: { zh: '任意', en: 'Any' },
  1: { zh: '意大利', en: 'Italy' },
  2: { zh: '德国', en: 'Germany' },
  3: { zh: '法国', en: 'France' },
  4: { zh: '西班牙', en: 'Spain' },
  5: { zh: '英国', en: 'Great Britain' },
  6: { zh: '匈牙利', en: 'Hungary' },
  7: { zh: '比利时', en: 'Belgium' },
  8: { zh: '瑞士', en: 'Switzerland' },
  9: { zh: '奥地利', en: 'Austria' },
  10: { zh: '俄罗斯', en: 'Russia' },
  11: { zh: '泰国', en: 'Thailand' },
  12: { zh: '荷兰', en: 'Netherlands' },
  13: { zh: '波兰', en: 'Poland' },
  14: { zh: '阿根廷', en: 'Argentina' },
  15: { zh: '摩纳哥', en: 'Monaco' },
  16: { zh: '爱尔兰', en: 'Ireland' },
  17: { zh: '巴西', en: 'Brazil' },
  18: { zh: '南非', en: 'South Africa' },
  19: { zh: '波多黎各', en: 'Puerto Rico' },
  20: { zh: '斯洛伐克', en: 'Slovakia' },
  21: { zh: '阿曼', en: 'Oman' },
  22: { zh: '希腊', en: 'Greece' },
  23: { zh: '沙特阿拉伯', en: 'Saudi Arabia' },
  24: { zh: '挪威', en: 'Norway' },
  25: { zh: '土耳其', en: 'Turkey' },
  26: { zh: '韩国', en: 'South Korea' },
  27: { zh: '黎巴嫩', en: 'Lebanon' },
  28: { zh: '亚美尼亚', en: 'Armenia' },
  29: { zh: '墨西哥', en: 'Mexico' },
  30: { zh: '瑞典', en: 'Sweden' },
  31: { zh: '芬兰', en: 'Finland' },
  32: { zh: '丹麦', en: 'Denmark' },
  33: { zh: '克罗地亚', en: 'Croatia' },
  34: { zh: '加拿大', en: 'Canada' },
  35: { zh: '中国', en: 'China' },
  36: { zh: '葡萄牙', en: 'Portugal' },
  37: { zh: '新加坡', en: 'Singapore' },
  38: { zh: '印度尼西亚', en: 'Indonesia' },
  39: { zh: '美国', en: 'USA' },
  40: { zh: '新西兰', en: 'New Zealand' },
  41: { zh: '澳大利亚', en: 'Australia' },
  42: { zh: '圣马力诺', en: 'San Marino' },
  43: { zh: '阿联酋', en: 'United Arab Emirates' },
  44: { zh: '卢森堡', en: 'Luxembourg' },
  45: { zh: '科威特', en: 'Kuwait' },
  47: { zh: '哥伦比亚', en: 'Colombia' },
  48: { zh: '日本', en: 'Japan' },
  49: { zh: '安道尔', en: 'Andorra' },
  50: { zh: '阿塞拜疆', en: 'Azerbaijan' },
  51: { zh: '保加利亚', en: 'Bulgaria' },
  52: { zh: '古巴', en: 'Cuba' },
  53: { zh: '捷克共和国', en: 'Czech Republic' },
  54: { zh: '爱沙尼亚', en: 'Estonia' },
  55: { zh: '格鲁吉亚', en: 'Georgia' },
  56: { zh: '印度', en: 'India' },
  57: { zh: '以色列', en: 'Israel' },
  58: { zh: '牙买加', en: 'Jamaica' },
  59: { zh: '拉脱维亚', en: 'Latvia' },
  60: { zh: '立陶宛', en: 'Lithuania' },
  61: { zh: '澳门', en: 'Macau' },
  62: { zh: '马来西亚', en: 'Malaysia' },
  63: { zh: '尼泊尔', en: 'Nepal' },
  64: { zh: '新喀里多尼亚', en: 'New Caledonia' },
  65: { zh: '尼日利亚', en: 'Nigeria' },
  66: { zh: '北爱尔兰', en: 'Northern Ireland' },
  67: { zh: '巴布亚新几内亚', en: 'Papua New Guinea' },
  68: { zh: '菲律宾', en: 'Philippines' },
  69: { zh: '卡塔尔', en: 'Qatar' },
  70: { zh: '罗马尼亚', en: 'Romania' },
  71: { zh: '苏格兰', en: 'Scotland' },
  72: { zh: '塞尔维亚', en: 'Serbia' },
  73: { zh: '斯洛文尼亚', en: 'Slovenia' },
  75: { zh: '乌克兰', en: 'Ukraine' },
  76: { zh: '委内瑞拉', en: 'Venezuela' },
  77: { zh: '威尔士', en: 'Wales' },
  78: { zh: '伊朗', en: 'Iran' },
  79: { zh: '巴林', en: 'Bahrain' },
  80: { zh: '津巴布韦', en: 'Zimbabwe' },
  82: { zh: '智利', en: 'Chile' },
  83: { zh: '乌拉圭', en: 'Uruguay' },
  84: { zh: '马达加斯加', en: 'Madagascar' },
}

export function getNationalityLocalizedName(id: number): string {
  const lang = currentLanguage.value
  return nationalityTranslations[id]?.[lang] ?? nationalities[id] ?? `Nationality ${id}`
}

/** 国籍下拉：文案随界面语言变化，国旗与 data/mappings 一致 */
export function getNationalitySelectOptionsI18n(): Array<{
  value: number
  name: string
  flagIso: string | null
}> {
  const lang = currentLanguage.value
  return Object.keys(nationalities)
    .map((k) => {
      const v = Number(k)
      return {
        value: v,
        name: nationalityTranslations[v]?.[lang] ?? nationalities[v] ?? `Nationality ${v}`,
        flagIso: getNationalityFlagIso(v),
      }
    })
    .sort((a, b) => a.value - b.value)
}

export function getCarLocalizedName(id: number): string {
  const lang = currentLanguage.value
  return carModelTranslations[id]?.[lang] ?? carModels[id] ?? `Car ${id}`
}

/** 参赛名单「强制车型」下拉：`id - 名称`，随界面语言变化（已含 filterable 时按 label 搜索） */
export function getCarModelSelectOptionsForEntry(): Array<{ value: number; label: string }> {
  const lang = currentLanguage.value
  return Object.keys(carModels)
    .map((k) => {
      const v = Number(k)
      const name = carModelTranslations[v]?.[lang] ?? carModels[v] ?? `Car ${v}`
      return { value: v, label: `${v} - ${name}` }
    })
    .sort((a, b) => a.value - b.value)
}

/** BOP 车型下拉：`名称 (ID: n)`，随界面语言变化 */
export function getCarModelSelectOptionsForBop(): Array<{ value: number; label: string }> {
  const lang = currentLanguage.value
  return Object.keys(carModels)
    .map((k) => {
      const v = Number(k)
      const name = carModelTranslations[v]?.[lang] ?? carModels[v] ?? `Car ${v}`
      return { value: v, label: `${name} (ID: ${v})` }
    })
    .sort((a, b) => a.value - b.value)
}

// 获取当前语言的计算属性
export const useCarModelName = (modelId: number) => {
  return computed(() => getCarLocalizedName(modelId))
}

export const useDriverCategoryName = (categoryId: number) => {
  return computed(() => {
    const lang = currentLanguage.value
    return driverCategoryTranslations[categoryId]?.[lang] || `Category ${categoryId}`
  })
}

export const useCupCategoryName = (categoryId: number) => {
  return computed(() => {
    const lang = currentLanguage.value
    return cupCategoryTranslations[categoryId]?.[lang] || `Cup ${categoryId}`
  })
}

export const useNationalityName = (nationalityId: number) => {
  return computed(() => getNationalityLocalizedName(nationalityId))
}

export const useTrackName = (trackId: string) => {
  return computed(() => {
    const lang = currentLanguage.value
    return TRACK_NAMES[trackId]?.[lang] || trackId
  })
}

// 获取车型列表（用于下拉选择）
export const getCarModelOptions = () => {
  const lang = currentLanguage.value
  return Object.keys(carModels)
    .map((k) => {
      const id = Number(k)
      return {
        value: id,
        label: carModelTranslations[id]?.[lang] ?? carModels[id] ?? `Car ${id}`,
      }
    })
    .sort((a, b) => a.value - b.value)
}

// 获取车手等级列表
export const getDriverCategoryOptions = () => {
  const lang = currentLanguage.value
  return Object.entries(driverCategoryTranslations).map(([id, names]) => ({
    value: parseInt(id),
    label: names[lang]
  }))
}

// 获取杯赛类别列表
export const getCupCategoryOptions = () => {
  const lang = currentLanguage.value
  return Object.entries(cupCategoryTranslations).map(([id, names]) => ({
    value: parseInt(id),
    label: names[lang]
  }))
}

// 获取国籍列表
export const getNationalityOptions = () => {
  const lang = currentLanguage.value
  return Object.keys(nationalities)
    .map((k) => {
      const id = Number(k)
      return {
        value: id,
        label: nationalityTranslations[id]?.[lang] ?? nationalities[id] ?? `Nationality ${id}`,
      }
    })
    .sort((a, b) => a.value - b.value)
}

// 获取赛道列表（与 TRACK_NAMES 一致）
export const getTrackOptions = () => {
  const lang = currentLanguage.value
  return Object.entries(TRACK_NAMES).map(([id, names]) => ({
    value: id,
    label: names[lang]
  }))
}
