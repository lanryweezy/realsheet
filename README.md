<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# RealSheet - AI-Powered Spreadsheet

A powerful, AI-powered spreadsheet application built with React, TypeScript, and Vite. Features include data analysis, visualization, pivot tables, goal seek, and an intelligent AI assistant powered by Google Gemini.

**Fast, keyboard-first, AI-enhanced spreadsheets for modern data work.**

## Features

### 🤖 AI-Powered Functions (13 Functions)
- **=AI()** - General purpose AI queries for any task
- **=SENTIMENT()** - Analyze sentiment (Positive/Negative/Neutral)
- **=CLASSIFY()** - Categorize text into predefined categories
- **=EXTRACT()** - Extract emails, phone numbers, dates, etc.
- **=TRANSLATE()** - Translate text to any language
- **=SUMMARIZE()** - Summarize long text automatically
- **=GENERATE()** - Generate content from prompts
- **=FORECAST()** - Predict future values from historical data
- **=EXPLAIN()** - Explain any formula in plain English
- **=SUGGEST_FORMULA()** - Get formula suggestions from descriptions
- **=FIX_FORMULA()** - Automatically fix broken formulas
- **=ANALYZE()** - Perform statistical analysis on data
- **=INFER()** - Make predictions based on patterns

### 📊 100+ Spreadsheet Functions
- **Logical**: IF, IFS, AND, OR, NOT, XOR, SWITCH
- **Text**: CONCATENATE, TEXTJOIN, LEFT, RIGHT, MID, TRIM, UPPER, LOWER, PROPER, LEN, FIND, SUBSTITUTE
- **Date/Time**: TODAY, NOW, DATE, YEAR, MONTH, DAY, HOUR, MINUTE, SECOND, DATEDIF, WEEKDAY
- **Math**: ROUND, ROUNDUP, ROUNDDOWN, ABS, SQRT, POWER, MOD, CEILING, FLOOR
- **Statistical**: SUM, AVG, MIN, MAX, COUNT, STDEV, VAR, CORREL, PERCENTILE
- **Array**: FILTER, SORT, UNIQUE
- **Financial**: PMT, FV, NPV
- **Lookup**: VLOOKUP, HLOOKUP, INDEX, MATCH, SUMIF

### 🌐 API Integration & Data Sources
- **=FETCH()** - Call any REST API directly from cells
- **=IMPORTJSON()** - Import JSON data from URLs
- **=IMPORTXML()** - Scrape data from websites
- **Pre-built Connectors**: Stripe, HubSpot, Airtable, Notion, Slack, Google Sheets
- **Webhook Support** - Real-time data updates
- **OAuth & API Key Authentication**

### 🐍 Python & SQL Integration
- **Python Code Cells** - Run Python directly in the spreadsheet
- **Pandas & NumPy** - Full data science library support
- **SQL Queries** - Query your data with SQL
- **Machine Learning** - 5 built-in ML models
- **Data Visualization** - Matplotlib & Seaborn charts

### 📈 Advanced Visualizations (15+ Chart Types)
- **Basic**: Bar, Line, Area, Pie, Donut
- **Scientific**: Scatter, Bubble, Radar, Polar
- **Business**: Waterfall, Funnel, Gauge
- **Statistical**: Heatmap, Boxplot, Histogram
- **Advanced**: Treemap, Sankey, Candlestick, Combo
- **Sparklines** - Inline mini-charts in cells
- **Export** - Save charts as PNG, SVG, or PDF

### 🔬 Data Science & Machine Learning
- **Linear Regression** - Trend analysis and predictions
- **K-Means Clustering** - Segment your data
- **Time Series Forecasting** - Moving average, exponential smoothing
- **Anomaly Detection** - Find outliers automatically
- **Correlation Analysis** - Discover relationships in data
- **Statistical Tools** - Mean, median, mode, std dev, percentiles

### 💼 Enterprise Features
- 📑 **Multiple Sheets** - Workbook support with tabs
- 🔍 **Data Tools** - Remove duplicates, split columns, find & replace
- 🎨 **Conditional Formatting** - Color scales, data bars, icon sets
- 📊 **Pivot Tables** - Summarize and analyze data
- 🎯 **Goal Seek** - What-if analysis
- 👁️ **Watch Window** - Monitor specific cells
- 💾 **Auto-save** - Never lose your work
- 📤 **Import/Export** - Excel, CSV support
- ⌨️ **Keyboard Shortcuts** - Fast, keyboard-first workflow

### 🎨 Modern UI/UX
- Beautiful, responsive design with Tailwind CSS
- Command palette (Ctrl/Cmd + K)
- Formula bar with autocomplete
- Quick access toolbar
- Ribbon interface
- Dark mode support
- Mobile-friendly

## Quick Examples

### AI Functions
```excel
=AI("What is the average sales growth?", A1:A12)
=SENTIMENT("I love this product!")
=CLASSIFY(B2, "Positive, Negative, Neutral")
=TRANSLATE(C2, "Spanish")
=FORECAST(D1:D12, 3)
=EXPLAIN("=VLOOKUP(A1,B:C,2,FALSE)")
```

### Advanced Formulas
```excel
=IF(A1>100, "High", "Low")
=IFS(A1>100, "High", A1>50, "Medium", TRUE, "Low")
=TEXTJOIN(", ", TRUE, A1:A5)
=FILTER(A1:C10, B1:B10>50)
=DATEDIF(A1, B1, "D")
```

### API Integration
```excel
=FETCH("https://api.example.com/data")
=IMPORTJSON("https://api.github.com/users/octocat", "name")
```

### Python Code
```python
import pandas as pd
import matplotlib.pyplot as plt

# df is automatically available with your sheet data
df['growth'] = df['sales'].pct_change()
df.plot(x='month', y='growth', kind='line')
plt.show()
```

### SQL Queries
```sql
SELECT category, AVG(sales) as avg_sales
FROM sheet_data
WHERE sales > 1000
GROUP BY category
ORDER BY avg_sales DESC;
```

## Run Locally

**Prerequisites:** Node.js 18+ and npm

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd realsheet
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Gemini API key (optional):
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   Get your API key from: https://makersuite.google.com/app/apikey
   
   > **Note:** The app works offline without an API key, but AI features will be limited.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

Preview the production build locally:
```bash
npm run preview
```

## Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import project to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration
   - Add environment variable `VITE_GEMINI_API_KEY` in project settings (optional)

3. **Deploy:**
   - Click "Deploy"
   - Your app will be live in minutes!

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set environment variables:**
   ```bash
   vercel env add VITE_GEMINI_API_KEY
   ```

### Option 3: Automated Deployment with GitHub Actions

The repository includes a GitHub Actions workflow for automated deployment:

1. **Set up Vercel secrets in GitHub:**
   - Go to your repository Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `VERCEL_TOKEN` - Get from [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
     - `VERCEL_ORG_ID` - Found in your Vercel project settings
     - `VERCEL_PROJECT_ID` - Found in your Vercel project settings

2. **Push to main branch:**
   ```bash
   git push origin main
   ```

3. **Automatic deployment:**
   - The workflow will build and test on every push
   - It will automatically deploy to Vercel on pushes to `main` branch

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key for AI features | No (app works offline) |
| `NODE_ENV` | Environment mode (`development` or `production`) | Auto-set |

## Project Structure

```
realsheet/
├── components/          # React components
│   ├── Agent.tsx       # AI assistant component
│   ├── Grid.tsx        # Spreadsheet grid
│   ├── Dashboard.tsx   # Dashboard view
│   └── ...
├── services/           # Business logic
│   ├── geminiService.ts    # AI/ML integration
│   ├── excelService.ts     # Excel file handling
│   ├── formulaService.ts   # Formula evaluation
│   └── storageService.ts   # Local storage
├── utils/              # Utility functions
├── public/             # Static assets
├── vercel.json         # Vercel configuration
├── vite.config.ts      # Vite build configuration
└── package.json        # Dependencies
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **XLSX** - Excel file parsing
- **Google Gemini AI** - AI assistant and functions
- **Pyodide** - Python in the browser
- **AlaSQL** - In-memory SQL queries

## Documentation

- **[Setup Guide](SETUP_GUIDE.md)** - Installation and configuration
- **[Quick Reference](QUICK_REFERENCE.md)** - Formula and function reference
- **[Ultimate AI Spreadsheet](ULTIMATE_AI_SPREADSHEET.md)** - Complete feature documentation
- **[Feature Roadmap](FEATURE_ROADMAP.md)** - Development roadmap
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Technical details

## Key Features Comparison

| Feature | NexSheet AI | Google Sheets | Excel | Julius AI | Numerous.ai | Quadratic |
|---------|-------------|---------------|-------|-----------|-------------|-----------|
| Formulas | 100+ | 400+ | 500+ | Limited | Limited | Limited |
| AI Functions | 13 | 0 | 0 | Built-in | 8 | 0 |
| Charts | 15+ | 10+ | 20+ | 10+ | 5 | 8 |
| Python | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| SQL | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| API Connector | ✅ | Limited | ❌ | ❌ | ❌ | Limited |
| ML Models | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Offline | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Price | Free | Free/Paid | Paid | Paid | Paid | Free/Paid |

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **XLSX** - Excel file parsing
- **Google Gemini AI** - AI assistant (optional)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue on GitHub.
