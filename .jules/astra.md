## 2024-06-17 - Safe Parsing for AI Output Data

**Learning:** When using `JSON.parse` on LLM outputs, relying on implicit truthiness or shape assumptions can cause silent downstream errors. If an LLM returns well-formed JSON that doesn't match the expected schema (e.g., missing the core `textResponse` property), standard `JSON.parse` will succeed but the app logic will fail later when accessing undefined properties.
**Action:** Always validate the structure of the parsed object immediately after `JSON.parse()`. Check that the result is a non-null object and explicitly check for required fields using the `'in'` operator (e.g., `!parsedResponse || typeof parsedResponse !== 'object' || !('textResponse' in parsedResponse)`). Throw an error if validation fails to trigger fallback mechanisms cleanly.

## 2024-05-18 - Formula Generation AI Quality Improvements
**Learning:** Found contradictory instructions in the system prompt for formula generation ("Respond with ONLY the formula... If multiple formulas are needed, provide them as a JSON array"). The downstream logic expected a single formula string, so returning an array would cause silent failures or unhandled promise rejections downstream. Unchecked AI generation calls also lacked timeouts, leaving the client vulnerable to hanging promises.
**Action:** Always ensure that prompt instructions strictly match the expected output format downstream. Add explicit output validation (e.g., checking for `=`) and wrap model calls in `Promise.race` with a `setTimeout` to prevent indefinite hangs.
