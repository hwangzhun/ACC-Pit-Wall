/** ACC 车手简称最多 3 个字符 */
export const SHORT_NAME_MAX_LEN = 3

/**
 * 根据姓氏生成默认简称：
 * - 拉丁字母开头：从姓氏中顺序取字母，至多 3 个并转大写
 * - 否则（如中文）：取姓氏第一个 Unicode 字符
 */
export function defaultShortNameFromLastName(lastName: string): string {
  const s = lastName.trim()
  if (!s) return ''
  if (/[A-Za-z]/.test(s[0])) {
    let out = ''
    for (const ch of s) {
      if (/[A-Za-z]/.test(ch)) out += ch.toUpperCase()
      if (out.length >= SHORT_NAME_MAX_LEN) break
    }
    return out
  }
  const first = [...s][0]
  return first ?? ''
}

/** 输入约束：最多 3 个字符，拉丁字母统一大写 */
export function normalizeShortNameInput(value: string): string {
  const chars = [...value]
  return chars
    .slice(0, SHORT_NAME_MAX_LEN)
    .map((c) => (/[a-zA-Z]/.test(c) ? c.toUpperCase() : c))
    .join('')
}
