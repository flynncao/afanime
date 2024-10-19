import type { AnimeContext, AnimeConversation } from '#root/types/index.js'

type ValidationFn = (input: string) => boolean

type consequenceFn = (arg0: AniConversationContext, arg1: string) => any
type promptRecord = Record<string, string> & { error: string }
export interface AniConversationContext {
  conversation: AnimeConversation
  context: AnimeContext
}
interface Step {
  parameter: string
  validationFn: ValidationFn
  prompts: promptRecord
  consequence?: consequenceFn
}
class AniConversation {
  private readonly steps: Step[]
  private currentStepIndex: number = 0
  private data: Record<string, string> = {}
  private readonly gCtx: AniConversationContext

  constructor(steps: Step[], gCtx: AniConversationContext) {
    this.steps = steps
    this.gCtx = gCtx
  }

  async start() {
    let running = true
    do {
      await this.processHinter()
      const typedCtx = await this.gCtx.conversation.waitFor(':text')
      const message = typedCtx?.update.message?.text
      if (!message)
        continue
      const res = await this.processInput(message)
      running = !res.done
      if (res.message) {
        await this.gCtx.context.reply(res.message)
      }
    } while (running)
  }

  async processHinter() {
    const currentStep = this.steps[this.currentStepIndex]
    if (currentStep.prompts.hint) {
      await this.gCtx.context.reply(currentStep.prompts.hint, { parse_mode: 'MarkdownV2' })
    }
    else {
      await this.gCtx.context.reply(`请输入要修改${this.steps[this.currentStepIndex].parameter}的值:`, { parse_mode: 'MarkdownV2' })
    }
  }

  async processAsyncConsequence() {
    const currentStep = this.steps[this.currentStepIndex]
    if (currentStep.consequence) {
      currentStep.consequence(this.gCtx, this.data[this.steps[this.currentStepIndex].parameter])
    }
  }

  async processInput(userInput: string): Promise<{ done: boolean, message: string | null }> {
    if (userInput === '/exit') {
      return { done: true, message: '退出成功' }
    }
    const currentStep = this.steps[this.currentStepIndex]
    // validate input
    if (currentStep.validationFn(userInput)) {
      this.data[currentStep.parameter] = userInput
      await this.processAsyncConsequence()
      this.currentStepIndex++
      if (this.currentStepIndex >= this.steps.length) {
        return { done: true, message: '所有步骤均已完成' }
      }
      else {
        return { done: false, message: null }
      }
      // Extra-hint is not needed
    }
    else {
      return { done: false, message: currentStep.prompts.error }
    }
  }
}

export class AniConversationBuilder {
  private steps: Step[] = []
  private globalContext: AniConversationContext = {
    conversation: {} as AnimeConversation,
    context: {} as AnimeContext,
  }

  addContext(conversation: AnimeConversation, context: AnimeContext): this {
    this.globalContext = { conversation, context }
    return this
  }

  addStep(parameter: string, validationFn: ValidationFn, prompts: promptRecord, consequence: consequenceFn): this {
    this.steps.push({ parameter, validationFn, prompts, consequence })
    return this
  }

  build() {
    return new AniConversation(this.steps, this.globalContext)
  }
}
