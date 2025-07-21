module.exports = {
  extends: ['expo', '@react-native'],
  rules: {
    // Disable some rules that might cause issues
    '@typescript-eslint/no-unused-vars': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
  },
};