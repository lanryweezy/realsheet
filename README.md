<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# NexSheet AI - Intelligent Spreadsheet Application

A powerful, AI-powered spreadsheet application built with React, TypeScript, and Vite. Features include data analysis, visualization, pivot tables, goal seek, and an intelligent AI assistant powered by Google Gemini.

View your app in AI Studio: https://ai.studio/apps/drive/1jpc_3xo_Chp0wxIwVtkamu-f39-Q2yFG

## Features

- 📊 **Advanced Data Grid** - Full-featured spreadsheet with formulas, formatting, and data manipulation
- 🤖 **AI Assistant** - Powered by Google Gemini for intelligent data analysis and insights
- 📈 **Visualizations** - Create charts and dashboards with Recharts
- 🔍 **Data Tools** - Remove duplicates, split columns, find & replace, and more
- 📑 **Multiple Sheets** - Workbook support with multiple tabs
- 💾 **Local Storage** - Automatic saving to browser storage
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS

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
