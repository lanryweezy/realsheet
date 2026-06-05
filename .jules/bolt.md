## 2026-06-04 - O(N*M) Render Bottlenecks in Grid
**Learning:** Performing multiple `Math.min`/`Math.max` calls inside nested cell-rendering loops in React for bounds checking creates massive O(N*M) CPU bottlenecks, significantly dropping scroll and render framerates.
**Action:** Always pre-calculate geometric bounds (e.g., selection bounds or presence boxes) outside the grid rendering loops using `useMemo`.
