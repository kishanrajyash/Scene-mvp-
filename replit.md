# Scene Platform

## Overview

Scene is a full-stack web application designed to connect people based on shared interests and compatible personalities for group activities. The platform uses personality assessments, activity preferences, and availability matching to suggest meaningful connections between users.

## System Architecture

### Database Architecture
- **Database**: PostgreSQL with Neon Database (serverless)
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Relations**: Fully modeled relationships between users, activities, availability, resources, and matches
- **Migrations**: Schema managed via `npm run db:push`
- **Seeding**: Automatic development data seeding with realistic user profiles and overlapping availability

### Matching Algorithm (Enhanced)
- **Non-Negotiable Requirements**: 
  - Activity compatibility: Users must have matching activity categories or skill levels
  - Time availability overlap: Users must have at least one overlapping time slot
- **Weighted Scoring**: Personality compatibility adds to base score but doesn't block matches
- **Strict Filtering**: Only users meeting both activity and availability requirements are considered

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state and caching
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL-based sessions with connect-pg-simple
- **Development**: tsx for TypeScript execution in development

### Build System
- **Development**: Vite dev server with Express API proxy
- **Production**: Static frontend build with Express server serving both API and static files
- **TypeScript**: Shared types between frontend and backend via `shared/` directory

## Key Components

### User Management
- User profiles with personality assessments
- Personality traits scoring system (extroversion, adventure, planning, creativity, empathy)
- Quiz-based personality evaluation
- Profile customization with photos and descriptions

### Activity System
- User-created activities with categories and skill levels
- Activity filtering by category, skill level, and participant count
- Activity management (create, edit, delete)
- Categories include: Outdoor, Sports, Arts & Crafts, Music, Food & Cooking, Games, etc.

### Matching Algorithm
- Compatibility scoring based on multiple factors:
  - Personality compatibility (40% weight)
  - Activity interests (30% weight)
  - Schedule availability (20% weight)
  - Location proximity (5% weight)
  - Budget compatibility (5% weight)
- Match status management (pending, connected, skipped)

### Availability Management
- Weekly schedule management (days of week × time slots)
- Time slots: Morning (6AM-12PM), Afternoon (12PM-6PM), Evening (6PM-12AM)
- Flexible availability updates

### Resource Management
- Vehicle ownership tracking
- Budget range preferences
- Hosting capability indicators
- Location information

## Data Flow

### User Onboarding
1. User registration with basic profile information
2. Personality quiz completion (multiple choice questions)
3. Personality trait calculation and profile update
4. Activity preferences and availability setup

### Matching Process
1. User triggers match generation
2. System analyzes all users and their preferences
3. Compatibility scores calculated using weighted algorithm
4. Matches sorted by compatibility score
5. Match results presented to user for acceptance/rejection

### Activity Creation
1. User creates activity with details (name, description, category, skill level)
2. System validates activity data
3. Activity becomes available for matching algorithm
4. Other users can be matched based on activity interest

## External Dependencies

### UI Components
- **Radix UI**: Accessible component primitives for complex UI elements
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe variant API for component styling
- **Tailwind Merge**: Utility for merging Tailwind classes

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind and Autoprefixer

### Database & Hosting
- **Neon Database**: Serverless PostgreSQL for scalable data storage
- **Replit**: Development environment and potential hosting platform

## Deployment Strategy

### Development Environment
- **Local Development**: `npm run dev` runs both frontend (Vite) and backend (Express) concurrently
- **Database**: Connects to Neon Database via DATABASE_URL environment variable
- **Hot Reload**: Vite HMR for frontend, tsx watch mode for backend

### Production Build
- **Frontend**: Vite builds static assets to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Deployment**: Single Node.js process serves both API and static files
- **Port Configuration**: Configurable via environment, defaults to 5000

### Database Management
- **Schema**: Managed via Drizzle ORM with TypeScript schema definitions
- **Migrations**: `npm run db:push` applies schema changes to database
- **Connection**: Pooled connections via @neondatabase/serverless

## Changelog

```
Changelog:
- June 25, 2025. Initial setup with in-memory storage
- June 25, 2025. Added PostgreSQL database with Drizzle ORM
- June 25, 2025. Enhanced matching algorithm with non-negotiable activity and availability compatibility
- June 25, 2025. Added database seeding with realistic user profiles and overlapping schedules
- June 25, 2025. Implemented Units (recurring groups) and Scenes (activity events) with participant visibility
- June 25, 2025. Added analytics logging for user actions and UI feedback for empty states
- June 25, 2025. Fixed Units functionality with proper API routes, form validation, and TypeScript types
- June 25, 2025. Removed personality results from dashboard home screen per user feedback
- June 25, 2025. Enhanced card layouts with improved spacing and responsive design
- July 2, 2025. Successfully migrated from Replit agent to standard Replit environment
- July 2, 2025. Simplified main UI: removed "Find People" and "Post Journal" options, replaced with clear "Add Activity" and "Find Scenes" actions
- July 2, 2025. Made main action buttons functional with proper navigation links to activities and scenes pages
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
App name: Scene (not ActivityMatch)
```