// eslint.config.js
import antfu from '@antfu/eslint-config'

export default antfu({
}, {
  rules: {
    'global': 'off',
    'no-console': 'off',
    'node/prefer-global/process': 'off',
    'no-unused-vars': 'off',
    'unused-imports/no-unused-vars': 'off',
  },
})
