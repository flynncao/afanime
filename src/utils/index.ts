// https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore
export const isEmpty = (obj: unknown) => [Object, Array].includes(((obj || {}) as object).constructor as any) && !Object.entries((obj || {})).length
