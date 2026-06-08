## 2026-06-04 - O(N*M) Render Bottlenecks in Grid
**Learning:** Performing multiple `Math.min`/`Math.max` calls inside nested cell-rendering loops in React for bounds checking creates massive O(N*M) CPU bottlenecks, significantly dropping scroll and render framerates.
**Action:** Always pre-calculate geometric bounds (e.g., selection bounds or presence boxes) outside the grid rendering loops using `useMemo`.
## 2026-06-04 - Grid Event Delegation
**Learning:** Attaching inline `onMouseDown` and `onMouseEnter` event handlers to every `<td>` in an O(N*M) grid rendering pipeline creates massive memory overhead and slows down React's render phase.
**Action:** Always implement event delegation on the parent component (e.g., `<table />`) and use `e.target.closest('td[data-row][data-col]')` to interpret the events rather than binding listeners to every single cell.
## 2026-06-04 - Grid Re-renders on Hover
**Learning:** Using React state (`isHovered`) combined with `onMouseEnter`/`onMouseLeave` in a dense grid element (`EnhancedCell`) causes massive O(N*M) React re-renders when simply moving the mouse across the spreadsheet, severely tanking performance.
**Action:** Offload transient visual interactions like hover styling completely to the browser's CSS engine using Tailwind's `hover:` pseudo-classes (e.g., `hover:bg-white/5`) rather than managing them via React state.
