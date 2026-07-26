// Deterministic env for tests: getConfig() must never depend on a local .env.
process.env.BOT_TOKEN ||= 'test-token'
process.env.GROUP_CHAT_ID ||= '-1001234567890'
process.env.MONGO_DB_URL ||= 'mongodb://localhost:27017/afanime-test'
process.env.REAL_SEARCH_URI ||= 'https://realsearch.example.test'
process.env.TRANSLATOR_BLACK_LIST = ''
