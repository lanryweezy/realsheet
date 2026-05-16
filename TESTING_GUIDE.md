# 🧪 Testing Guide - NexSheet AI Ultimate

## 📋 Pre-Testing Checklist

### Environment Setup
- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` file created with Gemini API key
- [ ] Development server running (`npm run dev`)
- [ ] Browser: Chrome, Firefox, or Edge (latest version)

---

## 🧪 Test Scenarios

### 1. Basic Spreadsheet Functions ✅

#### Test 1.1: Cell Editing
```
Steps:
1. Click on cell A1
2. Type "Hello World"
3. Press Enter
4. Verify cell shows "Hello World"

Expected: Cell updates correctly
```

#### Test 1.2: Number Formatting
```
Steps:
1. Enter "1234.5678" in A1
2. Verify it displays as number
3. Try "=A1*2" in B1
4. Verify result is 2469.1356

Expected: Numbers calculate correctly
```

#### Test 1.3: Multiple Sheets
```
Steps:
1. Click "+" to add new sheet
2. Rename sheet to "Test Sheet"
3. Switch between sheets
4. Verify data persists

Expected: Sheets work independently
```

---

### 2. Advanced Formulas 🔢

#### Test 2.1: Logical Functions
```excel
A1: 100
A2: =IF(A1>50, "High", "Low")
Expected: "High"

A3: =IFS(A1>100, "Very High", A1>50, "High", TRUE, "Low")
Expected: "High"

A4: =AND(A1>50, A1<200)
Expected: TRUE

A5: =OR(A1>200, A1<50)
Expected: FALSE
```

#### Test 2.2: Text Functions
```excel
A1: "hello world"
A2: =UPPER(A1)
Expected: "HELLO WORLD"

A3: =PROPER(A1)
Expected: "Hello World"

A4: =LEFT(A1, 5)
Expected: "hello"

A5: =TEXTJOIN(", ", TRUE, "A", "B", "C")
Expected: "A, B, C"
```

#### Test 2.3: Date Functions
```excel
A1: =TODAY()
Expected: Current date

A2: =YEAR(A1)
Expected: 2026

A3: =MONTH(A1)
Expected: 2

A4: =DATE(2026, 2, 24)
Expected: 2/24/2026

A5: =DATEDIF("1/1/2026", "2/24/2026", "D")
Expected: 54
```

#### Test 2.4: Math Functions
```excel
A1: 3.14159
A2: =ROUND(A1, 2)
Expected: 3.14

A3: =SQRT(16)
Expected: 4

A4: =POWER(2, 8)
Expected: 256

A5: =ABS(-42)
Expected: 42
```

#### Test 2.5: Array Functions
```excel
A1:A5: 5, 2, 8, 1, 9
B1: =SORT(A1:A5, 1, 1)
Expected: 1, 2, 5, 8, 9

C1: =FILTER(A1:A5, A1:A5>5)
Expected: 8, 9

D1: =UNIQUE(A1:A5)
Expected: 5, 2, 8, 1, 9 (no duplicates)
```

#### Test 2.6: Financial Functions
```excel
A1: =PMT(0.05/12, 360, 200000)
Expected: ~-1073.64 (monthly mortgage payment)

A2: =FV(0.06/12, 120, -100)
Expected: ~16387.93 (future value)

A3: =NPV(0.1, 1000, 2000, 3000)
Expected: ~4815.93 (net present value)
```

---

### 3. AI Functions 🤖

#### Test 3.1: General AI
```excel
A1: =AI("What is 2+2?")
Expected: "4" or explanation

A2: =AI("Explain photosynthesis in 10 words")
Expected: Short explanation

A3: =AI("What is the capital of France?")
Expected: "Paris"
```

#### Test 3.2: Sentiment Analysis
```excel
A1: "I love this product!"
A2: =SENTIMENT(A1)
Expected: "Positive"

B1: "This is terrible"
B2: =SENTIMENT(B1)
Expected: "Negative"

C1: "It's okay"
C2: =SENTIMENT(C1)
Expected: "Neutral"
```

#### Test 3.3: Text Classification
```excel
A1: "The app crashed when I clicked submit"
A2: =CLASSIFY(A1, "Bug, Feature, Question")
Expected: "Bug"

B1: "Can you add dark mode?"
B2: =CLASSIFY(B1, "Bug, Feature, Question")
Expected: "Feature"
```

#### Test 3.4: Information Extraction
```excel
A1: "Contact me at john@example.com or call 555-1234"
A2: =EXTRACT(A1, "email address")
Expected: "john@example.com"

A3: =EXTRACT(A1, "phone number")
Expected: "555-1234"
```

#### Test 3.5: Translation
```excel
A1: "Hello, how are you?"
A2: =TRANSLATE(A1, "Spanish")
Expected: "Hola, ¿cómo estás?"

B1: "Good morning"
B2: =TRANSLATE(B1, "French")
Expected: "Bonjour"
```

#### Test 3.6: Text Summarization
```excel
A1: [Long paragraph of text]
A2: =SUMMARIZE(A1, 20)
Expected: Short summary (max 20 words)
```

#### Test 3.7: Content Generation
```excel
A1: =GENERATE("Write a product description for a blue t-shirt")
Expected: Generated product description

A2: =GENERATE("Create 3 marketing slogans", "list")
Expected: Numbered list of slogans
```

#### Test 3.8: Forecasting
```excel
A1:A12: [Monthly sales data]
B1: =FORECAST(A1:A12, 3)
Expected: Predicted next 3 values
```

#### Test 3.9: Formula Help
```excel
A1: =EXPLAIN("=VLOOKUP(A1,B:C,2,FALSE)")
Expected: Plain English explanation

A2: =SUGGEST_FORMULA("sum all values greater than 100")
Expected: Formula suggestion like "=SUMIF(A:A,">100")"

A3: =FIX_FORMULA("=SUM(A1:A10", "#ERROR!")
Expected: "=SUM(A1:A10)"
```

---

### 4. Charts & Visualizations 📊

#### Test 4.1: Basic Charts
```
Steps:
1. Enter data in A1:B5
2. Open Chart Wizard
3. Create Bar Chart
4. Verify chart displays correctly
5. Try Line, Area, Pie charts

Expected: All chart types render
```

#### Test 4.2: Advanced Charts
```
Steps:
1. Create Scatter Plot with X/Y data
2. Create Bubble Chart with X/Y/Z data
3. Create Waterfall Chart
4. Create Funnel Chart
5. Create Heatmap

Expected: Advanced charts work
```

#### Test 4.3: Sparklines
```excel
A1:A10: [Data series]
B1: =SPARKLINE(A1:A10, "line")
Expected: Inline mini line chart

C1: =SPARKLINE(A1:A10, "bar")
Expected: Inline mini bar chart
```

---

### 5. Python Integration 🐍

#### Test 5.1: Basic Python
```python
# Create Python cell
print("Hello from Python!")
print(2 + 2)

Expected: Output shows "Hello from Python!" and "4"
```

#### Test 5.2: Pandas Integration
```python
import pandas as pd

# df is automatically available with sheet data
print(df.head())
print(df.describe())

Expected: DataFrame info displays
```

#### Test 5.3: Data Analysis
```python
import pandas as pd
import numpy as np

# Calculate statistics
df['mean'] = df['sales'].mean()
df['std'] = df['sales'].std()

print(df)

Expected: New columns added with calculations
```

#### Test 5.4: Visualization
```python
import matplotlib.pyplot as plt

df.plot(x='month', y='sales', kind='line')
plt.title('Sales Trend')
plt.show()

Expected: Chart displays
```

---

### 6. SQL Queries 🗄️

#### Test 6.1: Basic SELECT
```sql
SELECT * FROM sheet_data LIMIT 10;

Expected: First 10 rows displayed
```

#### Test 6.2: Filtering
```sql
SELECT * FROM sheet_data
WHERE sales > 1000
ORDER BY sales DESC;

Expected: Filtered and sorted results
```

#### Test 6.3: Aggregation
```sql
SELECT 
  category,
  AVG(sales) as avg_sales,
  COUNT(*) as count
FROM sheet_data
GROUP BY category;

Expected: Grouped statistics
```

#### Test 6.4: Joins
```sql
SELECT 
  a.product,
  a.sales,
  b.cost
FROM sheet1 a
JOIN sheet2 b ON a.product = b.product;

Expected: Joined data from multiple sheets
```

---

### 7. API Integration 🌐

#### Test 7.1: Simple Fetch
```excel
A1: =FETCH("https://api.github.com/users/octocat")
Expected: JSON response

A2: =IMPORTJSON("https://api.github.com/users/octocat", "name")
Expected: "The Octocat"
```

#### Test 7.2: API Connection Manager
```
Steps:
1. Open API Connector
2. Add new connection (e.g., GitHub API)
3. Configure endpoint and auth
4. Test connection
5. Import data

Expected: Data imports successfully
```

---

### 8. Data Tools 🔧

#### Test 8.1: Remove Duplicates
```
Steps:
1. Create data with duplicates
2. Open Data Tools > Remove Duplicates
3. Select columns
4. Execute

Expected: Duplicates removed
```

#### Test 8.2: Text to Columns
```
Steps:
1. Enter "A,B,C" in A1
2. Open Data Tools > Split Column
3. Choose comma delimiter
4. Execute

Expected: Data split into 3 columns
```

#### Test 8.3: Find & Replace
```
Steps:
1. Enter "Hello" in multiple cells
2. Open Find & Replace
3. Find "Hello", Replace with "Hi"
4. Execute

Expected: All instances replaced
```

---

### 9. Performance Tests ⚡

#### Test 9.1: Large Dataset
```
Steps:
1. Import CSV with 10,000 rows
2. Scroll through data
3. Apply formulas
4. Create charts

Expected: Smooth performance, no lag
```

#### Test 9.2: Complex Formulas
```
Steps:
1. Create 100 cells with nested formulas
2. Update source data
3. Verify all formulas recalculate

Expected: Fast recalculation (<1 second)
```

#### Test 9.3: Multiple Charts
```
Steps:
1. Create 10 different charts
2. Switch between sheets
3. Update data

Expected: Charts update smoothly
```

---

### 10. Edge Cases & Error Handling 🐛

#### Test 10.1: Invalid Formulas
```excel
A1: =SUM(
Expected: #ERROR! with helpful message

A2: =VLOOKUP(A1, B:C)
Expected: #ERROR! (missing arguments)
```

#### Test 10.2: Circular References
```excel
A1: =A1+1
Expected: #CIRCULAR! error
```

#### Test 10.3: Division by Zero
```excel
A1: =10/0
Expected: #DIV/0! error
```

#### Test 10.4: Missing API Key
```excel
A1: =AI("test")
Expected: #AI_ERROR! with message about API key
```

---

## 🎯 Acceptance Criteria

### Must Pass (Critical)
- [ ] All basic formulas work (SUM, AVG, IF, etc.)
- [ ] AI functions return results (with API key)
- [ ] Charts render correctly
- [ ] Data import/export works
- [ ] No console errors on load
- [ ] Responsive on desktop

### Should Pass (Important)
- [ ] Python code executes
- [ ] SQL queries work
- [ ] API connections succeed
- [ ] Advanced formulas work
- [ ] Performance is acceptable
- [ ] Mobile view is usable

### Nice to Have (Optional)
- [ ] All edge cases handled gracefully
- [ ] Helpful error messages
- [ ] Smooth animations
- [ ] Keyboard shortcuts work
- [ ] Accessibility features

---

## 🐛 Bug Reporting Template

```markdown
### Bug Description
[Clear description of the issue]

### Steps to Reproduce
1. [First step]
2. [Second step]
3. [Third step]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Environment
- Browser: [Chrome/Firefox/Edge]
- Version: [Browser version]
- OS: [Windows/Mac/Linux]
- API Key: [Set/Not Set]

### Screenshots
[If applicable]

### Console Errors
[Any errors from browser console]
```

---

## 📊 Test Results Template

```markdown
## Test Session: [Date]

### Environment
- Browser: Chrome 120
- OS: Windows 11
- API Key: Set ✅

### Results Summary
- Total Tests: 50
- Passed: 47 ✅
- Failed: 3 ❌
- Skipped: 0

### Failed Tests
1. Test 3.8 - Forecasting
   - Issue: Timeout after 30 seconds
   - Priority: Medium
   
2. Test 5.4 - Matplotlib
   - Issue: Chart not displaying
   - Priority: Low

3. Test 9.1 - Large Dataset
   - Issue: Lag with 10k rows
   - Priority: High

### Notes
- Overall performance is good
- AI functions work well
- Need to optimize large datasets
```

---

## 🚀 Automated Testing (Future)

### Unit Tests
```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage
```

### E2E Tests
```bash
# Run Playwright tests
npm run test:e2e

# Run specific test
npm run test:e2e -- formula-tests
```

### Performance Tests
```bash
# Run performance benchmarks
npm run test:perf
```

---

## 📚 Additional Resources

- [Quick Reference](QUICK_REFERENCE.md) - Formula syntax
- [Setup Guide](SETUP_GUIDE.md) - Installation help
- [API Documentation](services/) - Service details
- [Troubleshooting](SETUP_GUIDE.md#troubleshooting) - Common issues

---

**Happy Testing! 🧪**
