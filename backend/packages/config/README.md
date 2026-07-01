# @devos/config

Общие конфиги для monorepo: TypeScript, ESLint.

## Экспорты

```json
"@devos/config/tsconfig/base.json"
"@devos/config/tsconfig/node.json"
"@devos/config/tsconfig/react.json"
"@devos/config/eslint/base.js"
"@devos/config/eslint/react.js"
"@devos/config/eslint/node.js"
```

## Использование

`tsconfig.json`:
```json
{ "extends": "@devos/config/tsconfig/react.json" }
```

`eslint.config.js`:
```js
import react from '@devos/config/eslint/react.js';
export default react;
```
