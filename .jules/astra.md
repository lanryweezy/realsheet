## 2024-06-17 - Safe Parsing for AI Output Data

**Learning:** When using `JSON.parse` on LLM outputs, relying on implicit truthiness or shape assumptions can cause silent downstream errors. If an LLM returns well-formed JSON that doesn't match the expected schema (e.g., missing the core `textResponse` property), standard `JSON.parse` will succeed but the app logic will fail later when accessing undefined properties.
**Action:** Always validate the structure of the parsed object immediately after `JSON.parse()`. Check that the result is a non-null object and explicitly check for required fields using the `'in'` operator (e.g., `!parsedResponse || typeof parsedResponse !== 'object' || !('textResponse' in parsedResponse)`). Throw an error if validation fails to trigger fallback mechanisms cleanly.

## 2024-05-18 - Formula Generation AI Quality Improvements
**Learning:** Found contradictory instructions in the system prompt for formula generation ("Respond with ONLY the formula... If multiple formulas are needed, provide them as a JSON array"). The downstream logic expected a single formula string, so returning an array would cause silent failures or unhandled promise rejections downstream. Unchecked AI generation calls also lacked timeouts, leaving the client vulnerable to hanging promises.
**Action:** Always ensure that prompt instructions strictly match the expected output format downstream. Add explicit output validation (e.g., checking for `=`) and wrap model calls in `Promise.race` with a `setTimeout` to prevent indefinite hangs.

## 2024-06-19 - Serverless Endpoint Timeout Resilience
**Learning:** External AI calls (e.g., `model.generateContent()`) in serverless endpoints without explicit timeouts are vulnerable to indefinite hanging if the LLM provider experiences latency spikes or unresponsiveness. This is a critical resilience flaw because standard serverless environments (like Vercel functions) have maximum execution times that result in generic 504 errors, providing poor UX and making debugging difficult.
**Action:** Always wrap external AI model generation calls in a `Promise.race` alongside a `setTimeout` promise (e.g., 10-15 seconds) to enforce a strict timeout. This guarantees the application fails fast, logs the specific error ('AI generation timed out'), and can trigger appropriate client-side fallback mechanisms or graceful degradation.
## 2024-06-20 - Preventing Resource Leaks in Serverless AI Calls
**Learning:** In serverless environments, wrapping a long-running AI API call (like `model.generateContent`) in a `Promise.race` with a `setTimeout` provides a necessary timeout boundary. However, if the main generation promise resolves *before* the timeout expires, the background `setTimeout` keeps the process alive, causing a resource leak and potentially hitting serverless execution limits.
**Action:** Always capture the `timeoutId` when setting up a fallback promise, and place the `Promise.race` inside a `try/finally` block that explicitly calls `clearTimeout(timeoutId)` to clean up resources regardless of which promise resolves first.
## 2024-07-25 - Context Bloat from Reusing Complex Agent Endpoints for Simple Text Tasks
**Learning:** Reusing the primary `analyzeDataViaAPI` endpoint (which injects the heavy "NexAgent" multi-tool system prompt) for simple AI functions like `=CLASSIFY()` or `=EXTRACT()` leads to massive context bloat and token waste. This also creates instructional conflicts because the model is primed for complex workbook edits rather than simple text classification or generation.
**Action:** Always route simple, single-turn text generation tasks to a lightweight, targeted endpoint like `generateContentViaAPI`. Reserve heavy, tool-enabled endpoints solely for tasks requiring reasoning or data manipulation.

## 2024-11-20 - Ensure AI API Resilience with Exponential Backoff
**Learning:** External AI calls may fail due to temporary network issues, provider latency, or rate limiting (e.g., HTTP 429). Without retry logic, these transient failures disrupt the user experience and break feature availability.
**Action:** Always wrap standard `fetch` API calls to AI services with a helper like `fetchWithRetry` that implements a retry loop and exponential backoff, ensuring failure resilience on 429 and >= 500 status codes while letting the application fail gracefully on permanent errors.
