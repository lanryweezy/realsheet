# RealSheet - Code Quality Tools

## 📋 Overview

RealSheet uses ESLint and Prettier to maintain high code quality, consistency, and best practices across the codebase.

---

## 🛠️ Tools Configured

### ESLint
**Purpose:** Static code analysis for identifying problematic patterns and enforcing best practices

**Configuration:** `.eslintrc.json`

**Rules Enabled:**
- TypeScript recommended rules
- React recommended rules
- React Hooks rules
- Prettier compatibility

**Key Rules:**
```json
{
  "react/react-in-jsx-scope": "off",  // Not needed in React 17+
  "react/prop-types": "off",          // Using TypeScript instead
  "@typescript-eslint/no-unused-vars": "warn",
  "@typescript-eslint/no-explicit-any": "warn",
  "no-console": ["warn", { "allow": ["warn", "error"] }],
  "prefer-const": "warn",
  "eqeqeq": ["error", "smart"]
}
```

### Prettier
**Purpose:** Code formatting for consistent style

**Configuration:** `.prettierrc`

**Settings:**
```json
{
  "semi": true,              // Add semicolons
  "trailingComma": "es5",    // Trailing commas where valid in ES5
  "singleQuote": true,       // Use single quotes
  "printWidth": 100,         // Max line length
  "tabWidth": 2,             // 2 spaces for indentation
  "useTabs": false,          // Spaces, not tabs
  "bracketSpacing": true,    // Spaces in object literals
  "arrowParens": "always"    // Always use parens in arrow functions
}
```

---

## 📝 NPM Scripts

### Linting
```bash
# Run ESLint
npm run lint

# Run ESLint and auto-fix issues
npm run lint:fix

# Run TypeScript type checking
npm run type-check
```

### Formatting
```bash
# Format all code with Prettier
npm run format

# Check if files are formatted (CI/CD)
npm run format:check
```

---

## 🚀 Usage Guide

### For Developers

**Before Committing:**
```bash
# 1. Format your code
npm run format

# 2. Fix linting issues
npm run lint:fix

# 3. Check types
npm run type-check

# 4. Build to ensure everything works
npm run build
```

**During Development:**
- Install ESLint and Prettier extensions in your IDE
- Enable "Format on Save" in your IDE settings
- ESLint errors will show in real-time

### IDE Setup

#### VS Code (Recommended)

**Extensions:**
1. ESLint (dbaeumer.vscode-eslint)
2. Prettier - Code formatter (esbenp.prettier-vscode)

**Settings (settings.json):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "typescript",
    "typescriptreact"
  ]
}
```

---

## 📊 Code Quality Standards

### TypeScript

**Do:**
- ✅ Use explicit types when beneficial
- ✅ Use interfaces for object shapes
- ✅ Use type aliases for unions
- ✅ Avoid `any` - use `unknown` if needed
- ✅ Use optional chaining (`?.`) and nullish coalescing (`??`)

**Don't:**
- ❌ Use `any` unless absolutely necessary
- ❌ Use type assertions without need
- ❌ Mix optional and required props inconsistently

### React

**Do:**
- ✅ Use functional components with hooks
- ✅ Use descriptive component names
- ✅ Keep components small and focused
- ✅ Use TypeScript for props and state
- ✅ Use React.memo for performance where needed

**Don't:**
- ❌ Use class components (unless necessary)
- ❌ Create components that are too large (>200 lines)
- ❌ Use prop-types (use TypeScript instead)

### Code Style

**Example:**
```typescript
// ✅ Good
interface UserProps {
  id: string;
  name: string;
  email?: string;
}

const UserCard: React.FC<UserProps> = ({ id, name, email }) => {
  const handleClick = useCallback(() => {
    console.log('Clicked:', id);
  }, [id]);

  return (
    <div onClick={handleClick}>
      <h3>{name}</h3>
      {email && <p>{email}</p>}
    </div>
  );
};

// ❌ Bad - Avoid any, missing types
const UserCard = ({ id, name, email }: any) => {
  return <div>{name}</div>;
};
```

---

## 🔧 Configuration Files

### .eslintrc.json
```json
{
  "root": true,
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": [
    "@typescript-eslint",
    "react",
    "react-hooks"
  ],
  "rules": {
    // Custom rules
  }
}
```

### .prettierrc
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

### .prettierignore
```
node_modules
dist
build
.env
*.md
```

---

## 🎯 CI/CD Integration

### GitHub Actions Example

```yaml
name: Code Quality

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run type-check
```

### Vercel Deployment

Code quality checks run automatically before deployment:
1. `npm run lint` - Must pass
2. `npm run type-check` - Must pass
3. `npm run build` - Must succeed

---

## 📈 Metrics

### Code Quality Goals

| Metric | Target | Current |
|--------|--------|---------|
| ESLint Errors | 0 | 0 ✅ |
| ESLint Warnings | < 10 | 0 ✅ |
| TypeScript Errors | 0 | 0 ✅ |
| Code Coverage | > 80% | TBD |

---

## 🐛 Common Issues & Solutions

### ESLint: 'React' was used before it was defined

**Solution:** This rule is disabled in our config. If you see this, make sure you're using React 17+ and the rule is off.

### Prettier: Insert semicolons / Remove semicolons

**Solution:** Run `npm run format` to auto-fix. Our config requires semicolons.

### TypeScript: Implicit 'any' type

**Solution:** Add explicit type annotation:
```typescript
// ❌ Bad
const data = fetchData();

// ✅ Good
const data: UserData = fetchData();
```

### ESLint: Missing displayName

**Solution:** Add displayName to components or disable rule if using TypeScript:
```typescript
// In .eslintrc.json
"react/display-name": "off"
```

---

## 📚 Resources

- [ESLint Documentation](https://eslint.org/docs/)
- [Prettier Documentation](https://prettier.io/docs/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [React ESLint Plugin](https://www.npmjs.com/package/eslint-plugin-react)

---

## 🔄 Updating Rules

To add or modify ESLint rules:

1. Edit `.eslintrc.json`
2. Run `npm run lint` to test
3. Document changes in this file

To modify Prettier settings:

1. Edit `.prettierrc`
2. Run `npm run format` to apply
3. Update documentation

---

**Last Updated:** February 24, 2026  
**Version:** 1.0  
**Maintained By:** Development Team
