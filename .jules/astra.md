## 2024-06-16 - Safe Parsing and Output Validation
**Learning:** Raw `JSON.parse` operations on LLM outputs pose a silent failure risk if the parsed JSON does not match the expected structural contract. Even if `catch` blocks exist for `JSON.parse` failures, they often do not capture logic errors caused by successfully parsed but architecturally invalid structures.
**Action:** Always validate the structure of the parsed object (e.g., verifying `typeof` and checking for expected fields like `textResponse` or `fields`) immediately following `JSON.parse` to ensure fallback mechanisms trigger reliably.

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

## 2024-07-26 - Exponential Backoff for AI API Resilience
**Learning:** Client-side AI API requests are vulnerable to transient errors such as rate limits (429) or temporary server errors (5xx). Without retry logic, these transient failures result in immediate poor user experiences and failed AI operations.
**Action:** Always wrap external AI API calls in a retry helper like `fetchWithRetry` that implements exponential backoff. This ensures transient issues are automatically mitigated, increasing resilience. Do not apply this logic to health check endpoints, which should fail fast to accurately reflect immediate service availability.

## 2024-07-27 - Context Blowout from Unbounded Array Inputs to Prompts
**Learning:** Functions like AI formulas (e.g., `=INFER`, `=FORECAST`, `=ANALYZE`) often take unbounded data ranges (like full spreadsheet columns or matrices) as inputs. Feeding these arrays directly into prompt strings via `JSON.stringify` easily exceeds model context limits, leads to 400 Bad Request errors, and wastes tokens on redundant data.
**Action:** Always implement direction-aware truncation for unbounded array inputs before inserting them into prompts. For general analysis or pattern inference (e.g., `evaluateINFER`, `evaluateANALYZE`), truncate and keep the head (e.g., `.slice(0, 100)`) as early samples often represent the structure well. For time-series predictions (e.g., `evaluateFORECAST`), truncate and keep the tail (e.g., `.slice(-100)`) because the most recent data points are most critical for accurate forecasting.
