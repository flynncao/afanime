import { createApi } from 'unsplash-js'
import 'dotenv/config'

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY!,
  fetch,
})

export default unsplash
