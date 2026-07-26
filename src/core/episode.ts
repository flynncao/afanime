/**
 * Pure episode/title matching logic — no I/O, no grammY, no mongoose.
 */

export function extractEpisodeNumber(inputString: string): number {
  const regex = /\b(\d{2})(?:v2)?(?:END)?\b/g
  const match = inputString.match(regex)
  const rawNum = match ? String(match[0]) : null
  if (!rawNum)
    return Number.NaN
  if (rawNum.includes('END'))
    return Number(rawNum.slice(0, rawNum.indexOf('END')))

  else if (/v\d+/.test(rawNum))
    return Number(rawNum.slice(0, rawNum.indexOf('v')))

  else
    return Number(rawNum)
}

export function normalizedAnimeTitle(inputString: string): string {
  /* eslint-disable regexp/no-dupe-characters-character-class */
  /* eslint-disable regexp/no-obscure-range */
  const reg = /[\s【】!！・「」.。-（）/\\［］『』×☆★♪]/g
  return inputString.replace(reg, '')
}

/**
 * A feed item title matches when it contains every pipe-separated component
 * of the phantom pattern (comma-separated accepted too) and no blacklisted
 * translator group name.
 */
export function titleMatches(title: string, phantomPattern: string, blacklist: string[] = []): boolean {
  let pattern = phantomPattern
  if (!pattern.includes('|') && pattern.includes(','))
    pattern = pattern.replaceAll(',', '|')
  const normalizedText = normalizedAnimeTitle(title)
  const matchesPattern = pattern
    .split('|')
    .map(component => normalizedAnimeTitle(component.trim()))
    .every(component => normalizedText.includes(component))
  if (!matchesPattern)
    return false
  return !blacklist.some(substring => title.includes(substring))
}
