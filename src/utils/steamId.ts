/** SteamID64 数字部分位数（不含前缀 S），与 ACC entrylist 一致 */
export const STEAM_ID_DIGIT_LEN = 17

const STEAM_ID_PATTERN = /^S\d{17}$/

/** 提取用户输入中的连续数字位数（忽略可选的 S/s 前缀及其余非数字字符） */
export function getSteamIdDigitCount(raw: string | undefined | null): number {
  const t = (raw ?? '').trim()
  if (!t) return 0
  let body = t
  if (/^[sS]/.test(body)) {
    body = body.slice(1).trim()
  }
  return body.replace(/\D/g, '').length
}

/** 已输入内容且数字位数不足 17（且非空） */
export function isSteamIdTooShort(raw: string | undefined | null): boolean {
  const n = getSteamIdDigitCount(raw)
  return n > 0 && n < STEAM_ID_DIGIT_LEN
}

/** 数字位数超过 17 */
export function isSteamIdTooLong(raw: string | undefined | null): boolean {
  return getSteamIdDigitCount(raw) > STEAM_ID_DIGIT_LEN
}

/**
 * 规范为 entrylist 格式：大写 S + 17 位数字。
 * 用户可只填数字或带 s/S 前缀；含空格等非数字字符会去掉后再判断位数。
 * 无法得到恰好 17 位数字时返回 trim 后的原文，便于校验报错。
 */
export function normalizeSteamId(raw: string): string {
  const t = raw.trim()
  if (!t) return ''
  let body = t
  if (/^[sS]/.test(body)) {
    body = body.slice(1).trim()
  }
  const digits = body.replace(/\D/g, '')
  if (digits.length === STEAM_ID_DIGIT_LEN) {
    return 'S' + digits
  }
  return t
}

/** 空字符串合法（空槽）；非空则须为 S + 17 位数字 */
export function isValidSteamId(raw: string): boolean {
  const t = raw.trim()
  if (!t) return true
  return STEAM_ID_PATTERN.test(normalizeSteamId(t))
}

/** 比较两名车手是否为同一 SteamID（已规范化） */
export function steamIdsEqual(a: string, b: string): boolean {
  return normalizeSteamId(a) === normalizeSteamId(b)
}

/** 已填写 SteamID 但不合法时用于列表/表单红色提醒；空字符串不视为错误 */
export function isDriverSteamIdInvalid(playerID: string | undefined | null): boolean {
  const t = (playerID ?? '').trim()
  if (!t) return false
  return !isValidSteamId(t)
}

/** 手动添加/编辑车手：须非空且为 S + 17 位数字 */
export function requireValidSteamIdForDriver(
  raw: string | undefined | null
):
  | { ok: true; normalized: string }
  | { ok: false; reason: 'empty' }
  | { ok: false; reason: 'invalid'; normalized: string } {
  const t = (raw ?? '').trim()
  if (!t) return { ok: false, reason: 'empty' }
  const normalized = normalizeSteamId(t)
  if (!STEAM_ID_PATTERN.test(normalized)) {
    return { ok: false, reason: 'invalid', normalized }
  }
  return { ok: true, normalized }
}
