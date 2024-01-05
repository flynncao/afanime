export function extractEpisodeNumber(inputString: string) {
  // Define the regular expression pattern to match episode numbers
  const regex = /\b(\d+)(?:END)?\b/g

  // Use the match method on the input string to find the first match
  const match = inputString.match(regex)

  // Return the matched episode number without "END" suffix
  return match ? Number.parseInt(match[0], 10) : null
}
