# Steam2Steam

> **Compare Steam profiles side-by-side with game-specific statistics and beautiful visualizations**

A modern, full-stack web application for comparing Steam player profiles and game statistics. Built with Laravel 12,
React 19, TypeScript, and Tailwind CSS.

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Laravel](https://img.shields.io/badge/Laravel-12-red.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)

</div>

---

## 🎮 Features

### Core Functionality

- **🔄 Split-Screen Comparison** - Compare two Steam profiles simultaneously with real-time data
- **📊 Visual Statistics** - Beautiful progress bars, gradients, and animated comparisons
- **🎯 Multi-Game Support** - Dedicated tabs for 5 popular games with detailed stats
- **🔗 Shareable URLs** - Share comparisons via URL with automatic player loading
- **📤 One-Click Sharing** - Copy comparison links directly to clipboard
- **⚡ Smart Caching** - 5-minute cache for optimal performance and reduced API calls
- **🔒 Privacy-Aware** - Intelligent detection and clear messaging for privacy settings

### Supported Games

| Game                 | Stats Available                             | Achievement Tracking |
|----------------------|---------------------------------------------|----------------------|
| **Counter-Strike 2** | K/D, Accuracy, Headshots, MVPs, Wins        | ✅                    |
| **Dota 2**           | Kills, Deaths, Assists, Wins, Matches       | ✅                    |
| **Team Fortress 2**  | Kills, Deaths, Damage, Points, Dominations  | ✅                    |
| **Left 4 Dead 2**    | Kills, Headshots, Melee, Revives, Campaigns | ✅                    |
| **Portal 2**         | Portals Placed, Steps, Completion Time      | ✅                    |

---

## 🚀 Quick Start

### Prerequisites

- **PHP** 8.2 or higher
- **Composer** 2.x
- **Node.js** 18 or higher
- **npm** or **yarn**
- **Steam API Key** ([Get one here](https://steamcommunity.com/dev/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/steam2steam.git
   cd steam2steam
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Install Node dependencies**
   ```bash
   npm install
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Add your Steam API Key**

   Edit `.env` and add:
   ```env
   STEAM_API_KEY=your_api_key_here
   ```

6. **Build frontend assets**
   ```bash
   npm run build
   ```

7. **Start the development server**
   ```bash
   php artisan serve
   ```

8. **Visit the application**
   
   Open [http://localhost:8000](http://localhost:8000) in your browser

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

Steam2Steam is fully configured for one-click deployment on Vercel:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

2. **Import to Vercel**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel auto-detects configuration
   - Add environment variables (see below)
   - Click Deploy!

3. **Required Environment Variables**
   ```env
   APP_KEY=base64:... (generate: php artisan key:generate --show)
   STEAM_API_KEY=your_steam_api_key
   APP_URL=https://your-app.vercel.app
   ```

📚 **Complete Guide**: See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed instructions, troubleshooting, and optimization tips.

### Alternative Platforms

Steam2Steam can also be deployed to:
- **Laravel Forge** - Managed Laravel hosting
- **DigitalOcean App Platform** - Container-based hosting
- **AWS / Heroku** - Cloud platforms
- **Any VPS** - Requires PHP 8.2+, Composer, Node.js

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

<div align="center">

**Made with ❤️ for the Steam gaming community**

[⬆ Back to Top](#steam2steam)

</div>

