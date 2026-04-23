# Bookmark - Next-Gen Productivity App

A modern web application for managing bookmarks, notes, and tasks with a beautiful UI.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Prisma** (SQLite)
- **React Query**
- **Zustand**

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Initialize database:
```bash
npm run db:push
```

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Features

- 📚 **Bookmarks** - Save and organize links
- 📝 **Notes** - Markdown-supported note-taking
- ✅ **Tasks** - Priority-based task management
- 🎨 **Dark/Light Mode**
- 🔍 **Search** (coming soon)
- 🏷️ **Tags** for organization

## Docker Deployment

Build and run with Docker:
```bash
docker build -t bookmark .
docker run -p 3000:3000 -v $(pwd)/data.json:/app/data.json bookmark
```

Or use Docker Compose:
```bash
docker-compose up -d
```

## Database

View your data with Prisma Studio:
```bash
npm run db:studio
```
