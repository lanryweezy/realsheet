# RealSheet - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ (check with `node --version`)
- npm 9+ (check with `npm --version`)

### Installation

```bash
# Clone or navigate to the project
cd C:\Users\lanry\Desktop\realsheet

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

---

## ✅ What's Working

### Core Features (100% Functional)
- ✅ Spreadsheet grid with 100+ formulas
- ✅ AI-powered functions (=AI, =SENTIMENT, =CLASSIFY, etc.)
- ✅ Charts & visualizations (15+ types)
- ✅ Pivot tables
- ✅ Goal seek
- ✅ Conditional formatting
- ✅ Data tools (dedup, split, find/replace)
- ✅ Multiple sheets
- ✅ Watch window
- ✅ Smart fill with AI
- ✅ Import/Export (CSV, Excel)
- ✅ Local storage & file management
- ✅ Dark/Light themes
- ✅ Keyboard shortcuts

### New Features (Just Added)
- ✅ Format Painter
- ✅ Cell Styles Gallery (Ctrl+1)
- ✅ Enhanced grid with hover effects
- ✅ Smooth theme transitions
- ✅ Security fixes (serverless AI)
- ✅ Accessibility improvements

---

## ⚠️ Known TypeScript Warnings

Some TypeScript warnings exist but **don't affect functionality**:

1. **Missing type declarations** - Some components use implicit types
2. **Unused variables** - Minor linting issues
3. **API endpoint types** - Vercel types need updating

**These are cosmetic and don't impact the running application.**

---

## 🎯 How to Use RealSheet

### Basic Spreadsheet Operations

**Create a new spreadsheet:**
1. Open RealSheet
2. Click "Blank spreadsheet" or choose a template
3. Start entering data

**Use formulas:**
```
=SUM(A1:A10)
=AVERAGE(B1:B100)
=XLOOKUP(D1, A:A, B:B)
=IF(A1>10, "Yes", "No")
```

**AI Functions:**
```
=AI("Analyze this data")
=SENTIMENT(A1)
=CLASSIFY(A1, "positive, negative, neutral")
=FORECAST(A1:A10)
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+K` | Command Palette |
| `Ctrl+1` | Cell Styles Gallery |
| `F2` | Edit cell |
| `Ctrl+S` | Save |

---

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check (optional - has some warnings)
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

---

## 📁 Project Structure

```
realsheet/
├── api/                    # Serverless functions (Vercel)
│   └── ai/
│       ├── analyze.ts     # AI analysis endpoint
│       ├── formula.ts     # Formula suggestion
│       ├── generate.ts    # Content generation
│       └── transform.ts   # Safe code transformation
├── components/             # React components
│   ├── Grid.tsx           # Main spreadsheet
│   ├── Ribbon.tsx         # Toolbar
│   ├── Agent.tsx          # AI assistant
│   └── ... (35+ components)
├── services/               # Business logic
│   ├── formulaService.ts  # Formula evaluation
│   ├── geminiService.ts   # AI integration
│   └── ... (19 services)
├── utils/                  # Helper functions
├── App.tsx                 # Main component
└── package.json
```

---

## 🌐 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel deploy --prod
```

### Environment Variables

Add to Vercel project settings:
```
VITE_GEMINI_API_KEY=your_api_key_here
```

---

## 🐛 Troubleshooting

### "Module not found" errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port already in use
```bash
# Kill process on port 5173
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or use a different port:
npm run dev -- --port 3000
```

### Build fails
```bash
# Check Node version (should be 18+)
node --version

# Update npm
npm install -g npm@latest

# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Documentation

- **[README.md](./README.md)** - Main documentation
- **[FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md)** - Feature list
- **[ACCESSIBILITY.md](./ACCESSIBILITY.md)** - Accessibility guide
- **[CODE_QUALITY.md](./CODE_QUALITY.md)** - Code quality tools
- **[SECURITY_FIXES_SUMMARY.md](./SECURITY_FIXES_SUMMARY.md)** - Security docs
- **[COMPREHENSIVE_AUDIT_SUMMARY.md](./COMPREHENSIVE_AUDIT_SUMMARY.md)** - Complete audit

---

## 🎓 Learning Resources

### Formulas
- See **QUICK_REFERENCE.md** for all 100+ formulas
- Try `=SUM(A1:A10)`, `=XLOOKUP()`, `=IF()`

### AI Features
- Type `=AI("your question")` in any cell
- Use the AI Assistant panel (right sidebar)

### Charts
- Select your data
- Click "Insert" → "Chart"
- Choose chart type and customize

---

## 💡 Tips & Tricks

1. **Use Ctrl+K** for quick commands
2. **Double-click cells** to edit
3. **Drag cell corners** to select ranges
4. **Use AI** for complex formulas: `=AI("Sum if greater than 10")`
5. **Save often** with Ctrl+S (auto-save enabled)

---

## 🆘 Need Help?

**Documentation:** Check the docs folder  
**Issues:** Report bugs with detailed steps  
**Questions:** Use the in-app AI Assistant  

---

**RealSheet v1.0.0** - Fast, keyboard-first, AI-enhanced spreadsheets 🚀
