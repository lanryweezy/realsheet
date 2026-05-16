# 📖 Quick Reference Guide - NexSheet AI

## 🚀 AI Functions (New!)

### General AI
```excel
=AI("prompt", [context])
```
Ask anything! Examples:
- `=AI("What's the average?", A1:A10)`
- `=AI("Summarize this data")`
- `=AI("Find patterns in sales")`

### Text Analysis
```excel
=SENTIMENT(text)              → Returns: Positive/Negative/Neutral
=CLASSIFY(text, categories)   → Categorize text
=EXTRACT(text, what)          → Extract emails, phones, etc.
=SUMMARIZE(text, [words])     → Summarize long text
```

Examples:
- `=SENTIMENT(B2)` → "Positive"
- `=CLASSIFY(C2, "Bug, Feature, Question")` → "Bug"
- `=EXTRACT(D2, "email address")` → "user@example.com"
- `=SUMMARIZE(E2, 50)` → Short summary

### Translation & Generation
```excel
=TRANSLATE(text, language)    → Translate to any language
=GENERATE(prompt, [format])   → Generate content
```

Examples:
- `=TRANSLATE(A2, "Spanish")` → "Hola mundo"
- `=GENERATE("Write a product description for " & A2)`
- `=GENERATE("5 marketing slogans", "list")`

### Predictions & Analysis
```excel
=FORECAST(historical_data, periods)  → Predict future values
=ANALYZE(data_range, type)           → Statistical insights
```

Examples:
- `=FORECAST(A1:A12, 3)` → Next 3 values
- `=ANALYZE(B1:B100, "outliers")` → Find anomalies

### Formula Help
```excel
=EXPLAIN(formula)                    → Explain any formula
=SUGGEST_FORMULA(description)        → Get formula suggestions
=FIX_FORMULA(broken, error)          → Fix broken formulas
```

Examples:
- `=EXPLAIN("=VLOOKUP(A1,B:C,2,FALSE)")`
- `=SUGGEST_FORMULA("sum values greater than 100")`
- `=FIX_FORMULA("=SUM(A1:A10", "#ERROR!")`

---

## 📊 Advanced Formulas (50+ New!)

### Logical Functions
```excel
=IF(condition, true_value, false_value)
=IFS(cond1, val1, cond2, val2, ...)
=AND(condition1, condition2, ...)
=OR(condition1, condition2, ...)
=NOT(condition)
=XOR(condition1, condition2, ...)
=SWITCH(expression, val1, result1, val2, result2, ...)
```

Examples:
- `=IF(A1>100, "High", "Low")`
- `=IFS(A1>100, "High", A1>50, "Medium", TRUE, "Low")`
- `=AND(A1>0, B1<100)`

### Text Functions
```excel
=CONCATENATE(text1, text2, ...)
=TEXTJOIN(delimiter, ignore_empty, text1, ...)
=LEFT(text, num_chars)
=RIGHT(text, num_chars)
=MID(text, start, num_chars)
=TRIM(text)
=UPPER(text)
=LOWER(text)
=PROPER(text)
=LEN(text)
=FIND(find_text, within_text, [start])
=SUBSTITUTE(text, old, new, [instance])
```

Examples:
- `=TEXTJOIN(", ", TRUE, A1:A5)` → "Apple, Banana, Cherry"
- `=LEFT(A1, 5)` → First 5 characters
- `=UPPER(B1)` → "HELLO WORLD"

### Date/Time Functions
```excel
=TODAY()
=NOW()
=DATE(year, month, day)
=YEAR(date)
=MONTH(date)
=DAY(date)
=HOUR(time)
=MINUTE(time)
=SECOND(time)
=DATEDIF(start, end, unit)
=WEEKDAY(date, [type])
```

Examples:
- `=TODAY()` → 2/24/2026
- `=YEAR(A1)` → 2026
- `=DATEDIF(A1, B1, "D")` → Days between dates

### Math Functions
```excel
=ROUND(number, digits)
=ROUNDUP(number, digits)
=ROUNDDOWN(number, digits)
=ABS(number)
=SQRT(number)
=POWER(base, exponent)
=MOD(number, divisor)
=CEILING(number, significance)
=FLOOR(number, significance)
```

Examples:
- `=ROUND(3.14159, 2)` → 3.14
- `=SQRT(16)` → 4
- `=POWER(2, 8)` → 256

### Statistical Functions
```excel
=STDEV(range)
=VAR(range)
=CORREL(array1, array2)
=PERCENTILE(range, k)
```

Examples:
- `=STDEV(A1:A100)` → Standard deviation
- `=PERCENTILE(B1:B100, 0.95)` → 95th percentile

### Array Functions
```excel
=FILTER(range, condition)
=SORT(range, [index], [order])
=UNIQUE(range)
```

Examples:
- `=FILTER(A1:C10, B1:B10>50)` → Rows where B>50
- `=SORT(A1:A10, 1, -1)` → Sort descending
- `=UNIQUE(A1:A100)` → Remove duplicates

### Financial Functions
```excel
=PMT(rate, nper, pv, [fv], [type])
=FV(rate, nper, pmt, [pv], [type])
=NPV(rate, value1, value2, ...)
```

Examples:
- `=PMT(0.05/12, 360, 200000)` → Monthly mortgage payment
- `=FV(0.06/12, 120, -100)` → Future value of investment

---

## 🌐 API Integration

### Fetch Data
```excel
=FETCH(url, [method], [headers], [body])
=IMPORTJSON(url, [path])
=IMPORTXML(url, xpath)
```

Examples:
- `=FETCH("https://api.example.com/data")`
- `=IMPORTJSON("https://api.github.com/users/octocat", "name")`
- `=IMPORTXML("https://example.com", "//title")`

### Pre-built Integrations
- **Stripe**: Payment data
- **HubSpot**: CRM contacts
- **Airtable**: Database sync
- **Notion**: Workspace data
- **Slack**: Team messages

---

## 🐍 Python Code Cells

```python
# Access sheet data as pandas DataFrame
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# df is automatically available
print(df.head())
print(df.describe())

# Analyze data
df['growth'] = df['sales'].pct_change()
df['moving_avg'] = df['sales'].rolling(window=3).mean()

# Create visualizations
df.plot(x='month', y='sales', kind='line')
plt.title('Sales Trend')
plt.show()

# Machine learning
from sklearn.linear_model import LinearRegression
model = LinearRegression()
X = df[['feature']].values
y = df['target'].values
model.fit(X, y)
predictions = model.predict(X)
```

---

## 🗄️ SQL Queries

```sql
-- Query sheet data directly
SELECT 
  category,
  AVG(sales) as avg_sales,
  COUNT(*) as count,
  SUM(revenue) as total_revenue
FROM sheet_data
WHERE sales > 1000
GROUP BY category
HAVING COUNT(*) > 5
ORDER BY avg_sales DESC
LIMIT 10;

-- Joins between sheets
SELECT 
  a.product,
  a.sales,
  b.cost,
  (a.sales - b.cost) as profit
FROM sheet1 a
JOIN sheet2 b ON a.product = b.product;
```

---

## 📈 Chart Types

### Basic Charts
- **Bar**: Compare categories
- **Line**: Show trends over time
- **Area**: Cumulative values
- **Pie**: Show proportions
- **Donut**: Pie with center hole

### Scientific Charts
- **Scatter**: Correlation between variables
- **Bubble**: 3-dimensional data
- **Radar**: Multi-variable comparison
- **Polar**: Circular data

### Business Charts
- **Waterfall**: Show cumulative effect
- **Funnel**: Conversion process
- **Gauge**: Progress toward goal

### Statistical Charts
- **Heatmap**: Matrix of values
- **Boxplot**: Distribution summary
- **Histogram**: Frequency distribution

### Advanced Charts
- **Treemap**: Hierarchical data
- **Sankey**: Flow diagram
- **Candlestick**: Financial data
- **Combo**: Multiple chart types

---

## 🎨 Sparklines

Inline mini-charts in cells:
```excel
=SPARKLINE(A1:A10, "line")
=SPARKLINE(B1:B10, "bar")
=SPARKLINE(C1:C10, "winloss")
```

---

## 🤖 Machine Learning

### Built-in Models
```javascript
// Linear Regression
const model = MLModels.linearRegression(xValues, yValues);
const prediction = model.predict(newX);

// K-Means Clustering
const result = MLModels.kMeans(data, 3);
console.log(result.clusters);

// Time Series
const forecast = MLModels.movingAverage(data, 7);
const smoothed = MLModels.exponentialSmoothing(data, 0.3);

// Anomaly Detection
const anomalies = MLModels.detectAnomalies(data, 3);
console.log(anomalies.indices);
```

---

## ⌨️ Keyboard Shortcuts

### Navigation
- `Ctrl/Cmd + K` - Command palette
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Y` - Redo
- `Ctrl/Cmd + Shift + Z` - Redo

### Editing
- `F2` - Edit cell
- `Enter` - Confirm & move down
- `Tab` - Confirm & move right
- `Esc` - Cancel edit

### Selection
- `Shift + Arrow` - Extend selection
- `Ctrl/Cmd + A` - Select all
- `Ctrl/Cmd + Space` - Select column
- `Shift + Space` - Select row

---

## 💡 Pro Tips

### 1. Combine AI with Formulas
```excel
=IF(SENTIMENT(A2)="Positive", "😊", "😞")
=TRANSLATE(SUMMARIZE(B2, 20), "Spanish")
```

### 2. Use AI for Data Cleaning
```excel
=AI("Extract just the number from: " & A2)
=AI("Standardize this date format: " & B2)
```

### 3. Chain API Calls
```excel
=IMPORTJSON(FETCH("https://api.example.com/token"), "access_token")
```

### 4. Python for Complex Analysis
```python
# Use Python when formulas aren't enough
df_filtered = df[df['sales'] > df['sales'].quantile(0.75)]
correlation_matrix = df.corr()
```

### 5. SQL for Data Transformation
```sql
-- Complex aggregations are easier in SQL
SELECT 
  DATE_TRUNC('month', date) as month,
  category,
  SUM(sales) as total_sales
FROM sheet_data
GROUP BY month, category
```

---

## 🆘 Common Issues

### AI Functions Not Working?
- Check if Gemini API key is set in `.env.local`
- Ensure you have internet connection
- Try refreshing the page

### Python Code Not Running?
- Wait for Pyodide to load (first time only)
- Check browser console for errors
- Ensure code syntax is correct

### API Calls Failing?
- Check API endpoint URL
- Verify authentication credentials
- Check CORS settings

### Formulas Showing #ERROR!?
- Use `=EXPLAIN(formula)` to understand the error
- Use `=FIX_FORMULA(formula, error)` to auto-fix
- Check cell references and syntax

---

## 📚 Learn More

- **Full Documentation**: See `ULTIMATE_AI_SPREADSHEET.md`
- **Feature Roadmap**: See `FEATURE_ROADMAP.md`
- **API Reference**: See service files in `/services`
- **Examples**: Check the templates in the app

---

**Happy Spreadsheeting! 🎉**
