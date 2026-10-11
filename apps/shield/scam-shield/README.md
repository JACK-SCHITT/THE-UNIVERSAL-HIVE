# Scam-Shield 🛡️

A modern, AI-powered scam detection and prevention platform built with Next.js, Supabase, and real-time analytics.

## Features

- 🔍 **Real-time Scam Detection** - AI-powered analysis of suspicious activities
- 📊 **Analytics Dashboard** - Track and monitor scam attempts
- 🔐 **Secure Backend** - Powered by Supabase PostgreSQL
- ⚡ **Fast & Responsive** - Built with Next.js and modern web technologies
- 🎨 **Sleek UI** - Cyberpunk-themed terminal interface for security professionals

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Deployment:** Vercel (or your preferred platform)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier available at [supabase.com](https://supabase.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JACKSCHITT1134/Scam-Shield.git
   cd Scam-Shield
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials (see `.env.example` for details)

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

See `.env.example` for required configuration.

## Project Structure

```
Scam-Shield/
├── app/              # Next.js app directory
├── components/       # React components
├── lib/             # Utility functions & Supabase client
├── styles/          # Global styles & Tailwind config
├── public/          # Static assets
└── README.md        # This file
```

## Database Schema

Managed through Supabase migrations. Key tables:
- `scam_reports` - User-submitted scam reports
- `detection_logs` - AI detection results
- `users` - User profiles and authentication

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or feature requests, please open an [issue](https://github.com/JACKSCHITT1134/Scam-Shield/issues).

---

**Stay Safe. Stay Shielded. 🛡️**

## One shield

Combined update folded in:

- `app/api/scan/route.ts` — phrase/URL heuristic from the combined repo
- `components/` — scanner form, threat dashboard, hero
- `knightmare/` — full combined tree snapshot

Base analyze route stays. No second shield repo.
