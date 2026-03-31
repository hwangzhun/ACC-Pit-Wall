import { ref, computed } from 'vue'
import type { FieldDescription } from './fieldDescriptions'
import { fieldDescriptions } from './fieldDescriptions'
import { t as translate } from './locales'

export type Language = 'zh' | 'en'

// 当前语言状态
export const currentLanguage = ref<Language>('zh')

// 获取当前语言
export const getCurrentLanguage = () => currentLanguage.value

// 设置语言
export const setLanguage = (lang: Language) => {
  currentLanguage.value = lang
}

// 切换语言
export const toggleLanguage = () => {
  currentLanguage.value = currentLanguage.value === 'zh' ? 'en' : 'zh'
}

// 获取字段注释
export const getFieldDescription = (
  configName: keyof typeof fieldDescriptions,
  fieldName: string
): string => {
  const descriptions = fieldDescriptions[configName]
  if (!descriptions) {
    return ''
  }

  const fieldDesc = descriptions[fieldName] as FieldDescription
  if (!fieldDesc) {
    return ''
  }

  return fieldDesc[currentLanguage.value]
}

// 获取字段注释的响应式版本
export const useFieldDescription = (
  configName: keyof typeof fieldDescriptions,
  fieldName: string
) => {
  return computed(() => getFieldDescription(configName, fieldName))
}

// 导出语言状态和设置函数
export const useLanguage = () => {
  return {
    currentLanguage: computed(() => currentLanguage.value),
    setLanguage,
    toggleLanguage
  }
}

// 翻译函数
export const t = (key: string): string => {
  return translate(key, currentLanguage.value)
}

// 响应式翻译函数
export const useTranslation = () => {
  return {
    t: (key: string) => computed(() => translate(key, currentLanguage.value)),
    currentLanguage: computed(() => currentLanguage.value)
  }
}
