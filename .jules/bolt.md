## 2026-06-04 - O(N*M) Render Bottlenecks in Grid
**Learning:** Performing multiple `Math.min`/`Math.max` calls inside nested cell-rendering loops in React for bounds checking creates massive O(N*M) CPU bottlenecks, significantly dropping scroll and render framerates.
**Action:** Always pre-calculate geometric bounds (e.g., selection bounds or presence boxes) outside the grid rendering loops using `useMemo`.
## 2026-06-04 - Grid Event Delegation
**Learning:** Attaching inline `onMouseDown` and `onMouseEnter` event handlers to every `<td>` in an O(N*M) grid rendering pipeline creates massive memory overhead and slows down React's render phase.
**Action:** Always implement event delegation on the parent component (e.g., `<table />`) and use `e.target.closest('td[data-row][data-col]')` to interpret the events rather than binding listeners to every single cell.
## 2026-06-04 - Grid Re-renders on Hover
**Learning:** Using React state (`isHovered`) combined with `onMouseEnter`/`onMouseLeave` in a dense grid element (`EnhancedCell`) causes massive O(N*M) React re-renders when simply moving the mouse across the spreadsheet, severely tanking performance.
**Action:** Offload transient visual interactions like hover styling completely to the browser's CSS engine using Tailwind's `hover:` pseudo-classes (e.g., `hover:bg-white/5`) rather than managing them via React state.
## 2026-06-15 - O(N*M) Rendering Bottlenecks in Grid columns
**Learning:** Calculating  but failing to use  to slice the columns mapped in the Grid's rows leads to all columns rendering regardless of the horizontal scroll position, resulting in an O(N*M) DOM footprint and lag. When implementing column virtualization in a `table-layout: fixed` HTML structure, using `colSpan` on spacer cells breaks the horizontal scrolling width.
**Action:** Always fully virtualize columns by mapping over a slice of `data.columns`. Instead of `colSpan`, calculate aggregate hidden pixel widths (`leftSpacerWidth`, `rightSpacerWidth`) and insert a single empty `<col>` element with matching empty `<th>`/`<td>` cells.
## 2026-06-04 - O(N*M) Rendering Bottlenecks in Grid columns
**Learning:** Calculating `startCol` but failing to use `endCol` to slice the columns mapped in the Grid's rows leads to all columns rendering regardless of the horizontal scroll position, resulting in an O(N*M) DOM footprint and lag. When implementing column virtualization in a `table-layout: fixed` HTML structure, using `colSpan` on spacer cells breaks the horizontal scrolling width.
**Action:** Always fully virtualize columns by mapping over a slice of `data.columns`. Instead of `colSpan`, calculate aggregate hidden pixel widths (`leftSpacerWidth`, `rightSpacerWidth`) and insert a single empty `<col>` element with matching empty `<th>`/`<td>` cells.
