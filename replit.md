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
- **2025-01-02**: Migrated from Lovable to Replit environment
  - Replaced React Router with Wouter for routing
  - Maintained Supabase integration for database and auth
  - Configured TanStack Query for API state management
  - Fixed routing context issues and component imports
  - Application now running successfully on Replit

## User Preferences
- Security-focused application requiring robust practices
- Modern React patterns with TypeScript
- Clean, professional UI design

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