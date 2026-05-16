# 🚀 Setup Guide - NexSheet AI Ultimate

## 📋 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn**
- **Git** (optional, for cloning)
- **Gemini API Key** (optional, for AI features) - [Get one here](https://makersuite.google.com/app/apikey)

---

## ⚡ Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Gemini API key:
```env
VITE_GEMINI_API_KEY=your_api_key_here
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Open in Browser
Navigate to `http://localhost:5173`

### 5. Try It Out!
Create a new spreadsheet and try:
```excel
=AI("What is 2+2?")
=SENTIMENT("I love this!")
=IF(A1>100, "High", "Low")
```

---

## 🔧 Detailed Setup

### Step 1: Clone or Download

#### Option A: Clone with Git
```bash
git clone <your-repo-url>
cd nexsheet-ai
```

#### Option B: Download ZIP
1. Download the project ZIP
2. Extract to your desired location
3. Open terminal in that folder

### Step 2: Install Dependencies

```bash
# Using npm
npm install

# Or using yarn
yarn install
```

This will install:
- React & React DOM
- TypeScript
- Vite (build tool)
- Tailwind CSS
- Recharts (charts)
- XLSX (Excel import/export)
- Google Generative AI (Gemini)
- AlaSQL (in-memory SQL)
- And more...

### Step 3: Configure Environment

Create `.env.local` file:
```bash
cp .env.example .env.local
```

Add your API keys:
```env
# Required for AI functions
VITE_GEMINI_API_KEY=your_gemini_api_key

# Optional: Add other API keys as needed
VITE_STRIPE_API_KEY=your_stripe_key
VITE_HUBSPOT_API_KEY=your_hubspot_key
VITE_AIRTABLE_API_KEY=your_airtable_key
```

### Step 4: Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Step 5: Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist` folder.

### Step 6: Preview Production Build

```bash
npm run preview
```

---

## 🔑 Getting API Keys

### Gemini API Key (Required for AI Features)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key
5. Add to `.env.local`:
   ```env
   VITE_GEMINI_API_KEY=your_key_here
   ```

**Note**: The app works without an API key, but AI functions will be disabled.

### Optional API Keys

#### Stripe (for payment data)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your API key
3. Add to `.env.local`

#### HubSpot (for CRM data)
1. Go to [HubSpot API Keys](https://app.hubspot.com/settings/api-key)
2. Generate a key
3. Add to `.env.local`

#### Airtable (for database sync)
1. Go to [Airtable Account](https://airtable.com/account)
2. Generate API key
3. Add to `.env.local`

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

#### Option 1: Vercel Dashboard
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables
6. Click "Deploy"

#### Option 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables
vercel env add VITE_GEMINI_API_KEY
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Deploy to GitHub Pages

1. Update `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/your-repo-name/',
  // ... rest of config
});
```

2. Build and deploy:
```bash
npm run build
npx gh-pages -d dist
```

### Deploy to Your Own Server

```bash
# Build
npm run build

# Copy dist folder to your server
scp -r dist/* user@server:/var/www/html/
```

---

## 🐳 Docker Setup (Optional)

### Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Build and Run
```bash
# Build image
docker build -t nexsheet-ai .

# Run container
docker run -p 8080:80 nexsheet-ai
```

---

## 🔍 Troubleshooting

### Issue: "Module not found" errors

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: AI functions not working

**Possible causes**:
1. No API key set
2. Invalid API key
3. No internet connection

**Solution**:
```bash
# Check .env.local file exists
ls -la .env.local

# Verify API key is set
cat .env.local | grep GEMINI

# Test API key
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_KEY"
```

### Issue: Build fails

**Solution**:
```bash
# Check TypeScript errors
npm run type-check

# Clear cache and rebuild
rm -rf dist .vite
npm run build
```

### Issue: Port already in use

**Solution**:
```bash
# Use different port
npm run dev -- --port 3000

# Or kill process using port 5173
# On Mac/Linux:
lsof -ti:5173 | xargs kill -9

# On Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Issue: Python code not running

**Possible causes**:
1. Pyodide not loaded
2. Browser compatibility
3. Code syntax error

**Solution**:
1. Wait for Pyodide to load (first time takes ~30 seconds)
2. Use Chrome, Firefox, or Edge (latest versions)
3. Check browser console for errors
4. Test with simple code first:
```python
print("Hello from Python!")
```

### Issue: API calls failing (CORS errors)

**Solution**:
1. Use a CORS proxy for development
2. Configure API to allow your domain
3. Use server-side proxy in production

---

## 📦 Project Structure

```
nexsheet-ai/
├── components/          # React components
│   ├── Grid.tsx        # Main spreadsheet grid
│   ├── Agent.tsx       # AI assistant
│   ├── Dashboard.tsx   # Charts dashboard
│   └── ...
├── services/           # Business logic
│   ├── formulaService.ts      # Formula evaluation
│   ├── advancedFormulas.ts    # 50+ new formulas
│   ├── aiFormulas.ts          # AI functions
│   ├── apiIntegration.ts      # API connector
│   ├── dataScience.ts         # Python/SQL
│   ├── advancedCharts.ts      # Chart types
│   ├── geminiService.ts       # AI service
│   ├── excelService.ts        # Import/export
│   └── storageService.ts      # Local storage
├── utils/              # Utility functions
├── public/             # Static assets
├── .env.example        # Environment template
├── package.json        # Dependencies
├── vite.config.ts      # Build config
├── tsconfig.json       # TypeScript config
└── tailwind.config.ts  # Styling config
```

---

## 🧪 Testing

### Run Type Checking
```bash
npm run type-check
```

### Test AI Functions
```bash
# Start dev server
npm run dev

# In browser console:
// Test AI function
const result = await evaluateAI("What is 2+2?");
console.log(result);
```

### Test Formulas
Create a test spreadsheet with:
```excel
A1: =IF(1>0, "TRUE", "FALSE")
A2: =TEXTJOIN(", ", TRUE, "A", "B", "C")
A3: =ROUND(3.14159, 2)
A4: =TODAY()
```

### Test API Integration
```excel
A1: =FETCH("https://api.github.com/users/octocat")
A2: =IMPORTJSON("https://api.github.com/users/octocat", "name")
```

---

## 📚 Next Steps

### 1. Explore Features
- Try all AI functions
- Test advanced formulas
- Create charts
- Connect to APIs
- Run Python code

### 2. Read Documentation
- `ULTIMATE_AI_SPREADSHEET.md` - Complete feature list
- `QUICK_REFERENCE.md` - Formula reference
- `FEATURE_ROADMAP.md` - Future plans

### 3. Customize
- Add your own formulas
- Create custom charts
- Build API integrations
- Design templates

### 4. Deploy
- Choose a hosting platform
- Set up CI/CD
- Configure domain
- Monitor performance

### 5. Share
- Share with your team
- Get feedback
- Contribute improvements
- Build community

---

## 🆘 Getting Help

### Resources
- **Documentation**: Check the `/docs` folder
- **Examples**: See `QUICK_REFERENCE.md`
- **Issues**: Check GitHub issues
- **Community**: Join discussions

### Common Questions

**Q: Do I need an API key?**
A: Only for AI features. The app works offline without one.

**Q: Can I use my own AI model?**
A: Yes! Modify `services/aiFormulas.ts` to use any AI API.

**Q: Is my data secure?**
A: Yes! All data is stored locally in your browser. Nothing is sent to servers except AI queries.

**Q: Can I self-host?**
A: Absolutely! Build and deploy to any static hosting.

**Q: What browsers are supported?**
A: Chrome, Firefox, Edge, Safari (latest versions)

**Q: Can I use this offline?**
A: Yes! Except for AI functions and API calls.

---

## 🎉 You're All Set!

Your ultimate AI spreadsheet is ready to use. Start creating amazing spreadsheets with:
- ✅ 100+ formulas
- ✅ 13 AI functions
- ✅ 15+ chart types
- ✅ Python & SQL support
- ✅ API integrations
- ✅ Machine learning

**Happy spreadsheeting! 🚀**
