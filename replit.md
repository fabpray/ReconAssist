# ReconAssistant - Reconnaissance Dashboard

## Project Overview
A full-stack reconnaissance and security assessment dashboard built with React, Node.js, and PostgreSQL. This application provides an interface for managing security assessment projects, tracking findings, and monitoring reconnaissance activities.

## Architecture
- **Frontend**: React 18 with Wouter routing, Radix UI components, Tailwind CSS
- **Backend**: Express.js server with TypeScript
- **Database**: Supabase (PostgreSQL) for authentication and data storage
- **Build**: Vite for frontend, ESBuild for backend
- **Styling**: Tailwind CSS with shadcn/ui components

## Project Structure
```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   └── lib/          # Utilities and API client
├── server/               # Backend Express application
│   ├── db.ts            # Database connection and Drizzle setup
│   ├── index.ts         # Main server entry point
│   ├── routes.ts        # API routes
│   └── storage.ts       # Data access layer
├── shared/               # Shared types and schemas
│   └── schema.ts        # Database schema definitions
```

## Recent Changes
- **2025-08-04 - Chat Integration Complete**: Successfully connected frontend chat interface to backend AI
  - Implemented real-time chat interface with OpenRouter/DeepSeek AI integration
  - Connected tool execution pipeline - users can now accept AI suggestions and run reconnaissance tools
  - Added authentication system with user session management
  - Created test chat page at `/test-chat` to demonstrate working AI-powered reconnaissance assistant
  - Fixed all TypeScript errors and backend API integration issues
  - Removed legacy test endpoint that had data structure conflicts
  - Chat now provides intelligent tool recommendations and executes them on user approval

- **2025-08-04**: Successfully migrated from Replit Agent to Replit environment
  - Migrated from Supabase to Neon PostgreSQL with full database schema
  - Replaced client-side Supabase calls with server-side PostgreSQL queries using Drizzle ORM
  - Configured OpenRouter API integration with DeepSeek model (tngtech/deepseek-r1t2-chimera:free)
  - Removed all Supabase dependencies and code for clean architecture
  - Updated all backend services to use DatabaseStorage instead of MemStorage
  - Application now runs with proper client/server separation and security practices

- **2025-08-02**: Completed full-stack SaaS implementation
  - Built complete backend service architecture:
    - Decision loop system with LLM integration (mock with OpenAI ready)
    - Tool runner with 9 reconnaissance tools (7 installed, 2 mocked)
    - Project manager with free/paid tier enforcement
    - Key manager for BYOK (Bring Your Own Keys) functionality
    - Tier enforcer with comprehensive limit validation
    - Threat intelligence engine with risk assessment
    - Cache manager for performance optimization
  - Implemented comprehensive API routes:
    - Authentication (register/login)
    - Project management (CRUD operations)
    - Tool execution with real tool integration
    - Chat interface with AI decision making
    - API key management
    - Metrics and threat intelligence
  - Successfully tested all core functionality:
    - Project creation working
    - Tool execution confirmed (subfinder, httpx, etc.)
    - Chat interface generating intelligent responses
    - Metrics endpoint returning realistic data
  - Created test page demonstrating complete system functionality

- **2025-01-02**: Migrated from Lovable to Replit environment
  - Replaced React Router with Wouter for routing
  - Maintained Supabase integration for database and auth
  - Configured TanStack Query for API state management
  - Fixed routing context issues and component imports
  - Application now running successfully on Replit

- **2025-01-02**: Added core UI components and onboarding
  - Built comprehensive chat interface with AI conversation
  - Created project dashboard with multiple tabs
  - Implemented interactive onboarding wizard (6 steps)
  - Added proper routing and navigation flow
  - Integrated threat intelligence panel with risk scoring

## User Preferences
- Security-focused application requiring robust practices
- Modern React patterns with TypeScript
- Clean, professional UI design
- **User-controlled scope**: Only the user determines project scope - no automatic expansion or AI suggestions for targets outside user-defined boundaries

## Database Schema
- Supabase database ready for reconnaissance project tables
- Authentication handled by Supabase Auth
- Ready for expansion with reconnaissance project and findings tables

## Environment Variables
- Supabase credentials configured in client integration files
- No additional environment setup required

## Development Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production  
- `npm run db:push`: Push database schema changes