import chalk from 'chalk'

function parse(str: string, ...args: any) {
  let i = 0
  return str.replace(/%s/g, () => args[i++])
}

export default class Logger {
  static logSuccess = (message: string, ...args: any[]): void => {
    console.log(chalk.green.italic(`✅ ${parse(message, ...args)}`))
  }

  static logInput = (message: string, ...args: any[]): void => {
    console.log(chalk.cyan.underline(`📩 ${parse(message, args)}`))
  }

  static logError = (message: string, ...args: any[]): void => {
    console.error(chalk.red(message))
  }

  static logProgress = (message: string, ...args: any[]): void => {
    console.error(chalk.yellow(`🚧 ${parse(message, args)}...`))
  }

  static logDebug = (message: string): void => {
    console.error(
      chalk.bgMagenta('**************************************************'),
    )
    console.log(message)
    console.error(
      chalk.bgMagenta('**************************************************'),
    )
  }

	static logInfo = (message: string, ...args: any[]): void => {
		console.log(chalk.blue(`ℹ️ ${parse(message, args)}`))
	}
}
