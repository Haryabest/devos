import node from '@devos/config/eslint/node.js';
export default [
  ...node,
  {
    rules: {
      // NestJS relies heavily on decorators; unused params in DI patterns are common.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
];
