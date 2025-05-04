# Workout Tracker

A sleek, mobile-first fitness tracking web app built with Next.js 15, designed to help users log workouts, track progress, and stay consistent. Features a dark mode UI, Supabase integration, and smart motivational elements like streaks and AI-driven workout suggestions.

## Features

- **Workout Logging:** Log exercises, sets, reps, RPE, and more  
- **Day-Type Tracking:** Track rest days, skipped workouts, and recovery days  
- **Smart Suggestions:** *(In Progress)* Pre-fills based on past performance and goals  
- **Calendar View:** Yearly and weekly logs of workout activity  
- **Motivational Feedback:** Toasts, streaks, and progress tracking  
- **Nutrition Integration (Planned):** Placeholder setup for future Apple Health sync  
- **Barcode Shortcut Modal:** Embedded Crunch Fitness barcode for quick check-in  
- **Mobile-First UX:** Designed for iPhone, fully responsive  
- **Dark Theme:** Custom styled with clean modern colors  

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/)
- **Database:** [Supabase](https://supabase.io/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Authentication:** Supabase Auth
- **Deployment:** [Vercel](https://vercel.com/)
- **Language:** JavaScript (ES6+)
- **APIs & AI:** OpenAI (planned), Apple Health (planned)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/areysen/workout-tracker.git
cd workout-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root of the project:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-key  # Optional for AI features
```

### 4. Run the development server

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

> Note: If you're deploying to Vercel, set the above environment variables in the Vercel dashboard under Project Settings > Environment Variables.

## Folder Structure

```
.
├── app/
│   └── (protected)/     # Authenticated routes like /today, /calendar
├── components/          # Reusable UI components
├── lib/                 # Utility functions (e.g. Supabase client)
├── public/              # Static assets
├── styles/              # Global Tailwind + any overrides
├── .env.local           # Environment variables
```

## Special Components

### SearchParamHandler

This helper wraps pages that use `useSearchParams()` to avoid static export errors. Currently used on:

- `summary/page.js`
- `preview/page.js`
- `log-workout/page.js`

## Known Issues

- Static export will fail if you use `useSearchParams()` without wrapping or dynamically rendering the page.
- If you see a "No Output Directory named 'build'" error in Vercel, set the output directory to `.next` in your project settings.

## Roadmap

- [ ] AI-powered workout generation and coaching
- [ ] Apple Health + Apple Watch sync
- [ ] Offline mode with automatic Supabase sync
- [ ] Expanded insights, trends, and gamified XP
- [ ] Custom workout templates and smarter logging
- [ ] Integrated meal planning and recovery nutrition

## License

This project is currently private and intended for personal use only. No license is granted for redistribution.