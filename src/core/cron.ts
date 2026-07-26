// https://stackoverflow.com/questions/14203122/create-a-regular-expression-for-cron-statement
// Six-field (seconds-first) cron expressions, as used by the `cron` package.
// eslint-disable-next-line regexp/no-unused-capturing-group
const CRON_REGEX = /^((\*\/)?([0-5]?\d)(([,\-/])([0-5]?\d))*|\*)\s+((\*\/)?([0-5]?\d)(([,\-/])([0-5]?\d))*|\*)\s+((\*\/)?((2[0-3]|1\d|\d))(([,\-/])(2[0-3]|1\d|\d))*|\*)\s+((\*\/)?([1-9]|[12]\d|3[01])(([,\-/])([1-9]|[12]\d|3[01]))*|\*)\s+((\*\/)?([1-9]|1[0-2])(([,\-/])([1-9]|1[0-2]))*|\*|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))\s+((\*\/)?[0-6](([,\-/])[0-6])*|\*|(sun|mon|tue|wed|thu|fri|sat))\s*$|@(annually|yearly|monthly|weekly|daily|hourly|reboot)$/

export function isValidCronExpr(input: string): boolean {
  return CRON_REGEX.test(input)
}
