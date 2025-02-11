// https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore
export const isEmpty = obj => [Object, Array].includes((obj || {}).constructor) && !Object.entries((obj || {})).length
