# ObsidianSync

A free, multi-device note-taking application similar to Obsidian, built with Next.js and Supabase for seamless synchronization across devices.

## 🎯 Project Status

**Phase 1: Infrastructure & Authentication** ✅ **COMPLETE**
- Next.js 15+ setup with TypeScript and Tailwind CSS
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

**Phase 3: Monaco Editor Integration** ✅ **COMPLETE**
- VS Code-like editor experience with Monaco Editor
- Custom Obsidian dark theme with syntax highlighting
- Markdown tokenizer with support for all major elements
- Auto-save functionality with 1-second debounce
- Keyboard shortcuts (Ctrl+S, Ctrl+B, Ctrl+I, Ctrl+K)
- Split view modes (Edit, Preview, Split)
- Professional toolbar with formatting buttons
- Real-time markdown preview with GitHub Flavored Markdown
- Syntax highlighting for code blocks
- Fullscreen toggle and save status indicators

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

### ✅ Phase 1 - Infrastructure & Authentication (Complete)
- User authentication (sign up, sign in, sign out)
- Protected routes and middleware
- Responsive UI with Turkish language support
- Database schema for notes and tags
- Type-safe development environment

### ✅ Phase 2 - Note CRUD Operations (Complete)
- Full note CRUD functionality
- Rich text editor with markdown support
- Auto-save functionality
- Advanced search and filtering
- Tag management with color-coding
- Mobile-responsive design

### ✅ Phase 3 - Monaco Editor Integration (Complete)
- **VS Code-like Editor**: Professional code editor experience
- **Custom Theme**: Obsidian dark theme with syntax highlighting
- **Markdown Support**: Full markdown tokenizer and syntax highlighting
- **Auto-save**: 1-second debounce auto-save (PRD requirement)
- **Keyboard Shortcuts**: 
  - Ctrl+S (Save)
  - Ctrl+B (Bold)
  - Ctrl+I (Italic)
  - Ctrl+K (Link)
- **Split View**: Edit, Preview, and Split modes
- **Toolbar**: Professional formatting buttons
- **Live Preview**: Real-time markdown preview with GitHub Flavored Markdown
- **Code Highlighting**: Syntax highlighting for code blocks
- **Fullscreen Mode**: Distraction-free editing
- **Save Status**: Visual indicators for save state

### 🔜 Phase 4 - Real-time Synchronization (Planned)
- Real-time collaboration features
- Conflict resolution system
- Online/offline synchronization
- Multi-device support
- Live cursors and selections
- Operational transforms for concurrent editing

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.3.3**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Monaco Editor**: VS Code editor integration
- **React Markdown**: Markdown rendering
- **Zustand**: State management

### Backend & Database
- **Supabase**: Backend-as-a-Service
- **PostgreSQL**: Database with real-time subscriptions
- **Row Level Security**: Secure data access

### Editor Features
- **@monaco-editor/react**: Monaco Editor integration
- **remark-gfm**: GitHub Flavored Markdown support
- **rehype-highlight**: Syntax highlighting
- **highlight.js**: Code block highlighting

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
