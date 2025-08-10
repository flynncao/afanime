// export function extractEpisodeNumber(inputString: string) {

//   // Define the regular expression pattern to match episode numbers
//   const regex = /\b(\d+)(?:END)?\b/g

//   // Use the match method on the input string to find the first match
//   const match = inputString.match(regex)

//   // Return the matched episode number without "END" suffix
//   return match ? Number.parseInt(match[0], 10) : null
// }

export function extractEpisodeNumber(inputString: string) {
  const regex = /\b(\d{2})(?:v2)?(?:END)?\b/g
  const match = inputString.match(regex)
  const rawNum = match ? String(match[0]) : null
  if (!rawNum)
    return Number.NaN
  if (rawNum.includes('END'))
    return Number(rawNum.slice(0, rawNum.indexOf('END')))

  else if (rawNum.match(/v\d+/))
    return Number(rawNum.slice(0, rawNum.indexOf('v')))

  else
    return Number(rawNum)
}

export function objToString(obj: any) {
  return JSON.stringify(obj, null, 2)
}

export function normalizedAnimeTitle(inputString: string): string {
  /* eslint-disable regexp/no-dupe-characters-character-class */
  /* eslint-disable regexp/no-obscure-range */
  const reg = /[\s【】!！・「」.。-（）/\\［］『』×☆★♪]/g
  return inputString.replace(reg, '')
}
