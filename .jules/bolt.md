## 2024-05-27 - Grid Performance Fix
**Learning:** `npm run lint:fix` makes destructive changes globally in this codebase, breaking things like `services/formulaService.ts` by blindly transforming `let` to `const`.
**Action:** Do not use `npm run lint:fix`. Validate optimizations with `npm run build` or `npm run type-check`. And for React specific things, memoization in lists only works if object and function references are stable. So extract inline objects `{}` into module-level variables (e.g. `EMPTY_STYLE = {}`) and wrap inline functions in `useCallback`.
