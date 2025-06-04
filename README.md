# ObsidianSync

A free, multi-device note-taking application similar to Obsidian, built with Next.js and Supabase for seamless synchronization across devices.

## 🎯 Project Status

**Phase 1: Infrastructure & Authentication** ✅ **COMPLETE**
- Next.js 14+ setup with TypeScript and Tailwind CSS
- Supabase integration for backend services
- Authentication system with protected routes
- Database schema and type definitions
- UI components and responsive design

**Phase 2: Note CRUD Operations** ✅ **COMPLETE**
- Full note CRUD functionality (Create, Read, Update, Delete)
- Rich text editor with markdown support and auto-save
- Advanced search and filtering system
- Tag management with color-coding
- Mobile-responsive design with collapsible sidebar
- Database integration ready (schema deployment pending)

**Phase 3: Advanced Features** 🚧 **READY TO START**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (optional for demo)

### Installation

1. **Clone and Install**:
   ```bash
   cd obsidian-sync
   npm install
   ```

2. **Environment Setup**:
   ```bash
   # Copy .env.local and update with your Supabase credentials
   # The app will run in demo mode with placeholder values
   ```

3. **Database Setup** (Optional):
   ```bash
   # Run the SQL schema in your Supabase project
   # File: supabase-schema.sql
   ```

4. **Start Development**:
   ```bash
   npm run dev
   ```

5. **Open Application**:
   - Main: http://localhost:3000
   - Login: http://localhost:3000/auth/login
   - Register: http://localhost:3000/auth/register

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **State Management**: Zustand
- **UI Components**: shadcn/ui
- **Authentication**: Supabase Auth

### Project Structure
```
src/
├── app/                    # Next.js app router
├── components/             # Reusable UI components
├── lib/                    # Utility functions and configs
├── stores/                 # Zustand stores
├── types/                  # TypeScript definitions
└── middleware.ts           # Route protection
```

## 📱 Features

### ✅ Phase 1 - Completed
- User authentication (sign up, sign in, sign out)
- Protected routes and middleware
- Responsive UI with Turkish language support
- Database schema for notes and tags
- Type-safe development environment

### 🔜 Phase 2 - Planned
- Note creation, editing, and deletion
- File/folder organization
- Real-time synchronization
- Search functionality
- Tag management system

## 🗄️ Database Schema

The application uses PostgreSQL through Supabase with the following main tables:
- **notes**: Store note content and metadata
- **tags**: Tag system for organization
- **search_index**: Full-text search support
- **sync_queue**: Device synchronization

## 🔧 Configuration

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 📚 Documentation

- [Phase 1 README](./PHASE1-README.md) - Detailed Phase 1 documentation
- [Phase 1 Checklist](./PHASE1-CHECKLIST.md) - Development checklist
- [Phase 1 Completion](./PHASE1-COMPLETION.md) - Completion status
- [Project Rules](./rules.md) - Development guidelines
- [PRD](./prd.md) - Product Requirements Document

## 🤝 Development Status

The project is currently in active development:
- ✅ Phase 1: Infrastructure & Authentication (Complete)
- 🚧 Phase 2: Note CRUD Operations (Ready to start)
- 📋 Phase 3: Advanced Features (Planned)
- 🔮 Phase 4: Mobile & Desktop Apps (Future)

## 📄 Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
