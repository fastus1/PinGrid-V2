module.exports = {
    env: {
        node: true,
        es2022: true,
    },
    extends: [
        'eslint:recommended',
        'prettier', // Must be last to override other configs
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    rules: {
        // Error prevention
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'no-console': 'off', // Allow console in Node.js

        // Code style
        'prefer-const': 'error',
        'no-var': 'error',
        'eqeqeq': ['error', 'always'],

        // Async best practices
        'no-async-promise-executor': 'error',
        'require-await': 'warn',
    },
};
