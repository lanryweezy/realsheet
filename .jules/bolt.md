## 2026-06-04 - O(N*M) Render Bottlenecks in Grid
**Learning:** Performing multiple `Math.min`/`Math.max` calls inside nested cell-rendering loops in React for bounds checking creates massive O(N*M) CPU bottlenecks, significantly dropping scroll and render framerates.
**Action:** Always pre-calculate geometric bounds (e.g., selection bounds or presence boxes) outside the grid rendering loops using `useMemo`.
## 2026-06-04 - Grid Event Delegation
**Learning:** Attaching inline `onMouseDown` and `onMouseEnter` event handlers to every `<td>` in an O(N*M) grid rendering pipeline creates massive memory overhead and slows down React's render phase.
**Action:** Always implement event delegation on the parent component (e.g., `<table />`) and use `e.target.closest('td[data-row][data-col]')` to interpret the events rather than binding listeners to every single cell.
## 2026-06-04 - Grid Re-renders on Hover
**Learning:** Using React state (`isHovered`) combined with `onMouseEnter`/`onMouseLeave` in a dense grid element (`EnhancedCell`) causes massive O(N*M) React re-renders when simply moving the mouse across the spreadsheet, severely tanking performance.
**Action:** Offload transient visual interactions like hover styling completely to the browser's CSS engine using Tailwind's `hover:` pseudo-classes (e.g., `hover:bg-white/5`) rather than managing them via React state.
## 2026-06-05 - Missing Column Virtualization in Grid
**Learning:** Virtualizing rows (`visibleRange.startRow`, `endRow`) without also virtualizing columns causes `O(V_N * M)` renders, where `M` is the total number of columns. When total columns are large (e.g. 26 or more), this introduces a major rendering bottleneck for every scroll event.
**Action:** When implementing list/grid virtualization, always ensure both dimensions (Rows * Columns) are virtualized (`O(V_N * V_M)`). Use empty spacer elements (e.g. `colSpan`) to maintain fixed layouts when slicing grid data.
## 2026-06-05 - Context Provider Memoization
**Learning:** Passing a new object directly into a Context Provider's `value` prop (e.g., `value={{ theme, setTheme }}`) causes the reference to change on *every* render of the Provider. This triggers cascading re-renders in all downstream consumers, even if the actual state values haven't changed.
**Action:** Always wrap Context Provider values in `useMemo` and memoize any stable setter functions with `useCallback` to ensure reference stability and prevent unnecessary application-wide re-renders.
## 2026-06-05 - Fixed-Table Column Virtualization Pitfall
**Learning:** In a `table-layout: fixed` HTML structure, using `colSpan` on spacer cells (`<th>`, `<td>`) to substitute unrendered virtual columns breaks the table layout when horizontally scrolled. The table engine treats a `colSpan` cell as occupying subsequent `<col>` definitions, causing visible columns to collapse into the wrong defined widths.
**Action:** When virtualizing columns in an HTML `<table>`, calculate the aggregate hidden pixel width, insert a single empty `<col>` representing that width, and match it with exactly one empty `<th>`/`<td>` spacer cell that has NO `colSpan` attribute.
