# Homeopathic Telemedicine Web Application

## Overview

A scalable homeopathic consultation web application designed for Indian patients. The platform enables OTP-based authentication (mobile/email), patient registration with comprehensive health profiles, and audio consultation capabilities. Built with a React frontend and FastAPI (Python) backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, React Context for auth state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: FastAPI (Python) - RESTful JSON APIs
- **ORM**: SQLAlchemy for database operations
- **Validation**: Pydantic schemas for request/response validation
- **Session Management**: Starlette SessionMiddleware
- **File Uploads**: FastAPI UploadFile for audio file handling
- **Proxy**: Express.js proxies /api requests to FastAPI (port 5001)

### Data Storage
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Schema Location**: 
  - `shared/schema.ts` - Drizzle schema (frontend types)
  - `backend/models.py` - SQLAlchemy models
- **Tables**:
  - `patients`: User profiles with health information
  - `otp_sessions`: OTP codes for authentication
  - `consultations`: Audio consultation records with transcripts
- **Migrations**: Drizzle Kit for schema sync (`db:push`), SQLAlchemy auto-creates tables

### Authentication Flow
- OTP-based authentication (no passwords)
- Supports both mobile number and email as identifiers
- 6-digit OTP codes with expiration and attempt limiting
- Session-based authentication after OTP verification
- Protected routes check session validity via `/api/auth/me`

### Project Structure
```
client/           # React frontend application
  src/
    components/   # UI components (shadcn/ui)
    pages/        # Route pages (login, register, dashboard)
    lib/          # Utilities, auth context, query client
    hooks/        # Custom React hooks
backend/          # FastAPI backend (Python)
  main.py         # FastAPI app with all routes
  models.py       # SQLAlchemy database models
  database.py     # Database connection
  schemas.py      # Pydantic validation schemas
server/           # Express.js dev server
  index.ts        # Server entry point
  routes.ts       # API proxy to FastAPI
  vite.ts         # Vite dev server integration
shared/           # Shared code between frontend/backend
  schema.ts       # Drizzle schema and Zod validators
```

## API Endpoints (FastAPI)

### Authentication
- `POST /api/auth/request-otp` - Request OTP for mobile/email
- `POST /api/auth/verify-otp` - Verify OTP and create session
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/logout` - Clear session

### Patient
- `PUT /api/patient/profile` - Update patient profile

### Consultations
- `GET /api/consultations` - Get all consultations for patient
- `POST /api/consultations` - Create new consultation with audio upload

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **SQLAlchemy**: Python ORM for database queries
- **Drizzle ORM**: TypeScript schema definitions for frontend types

### Python Packages
- **FastAPI**: Modern Python web framework
- **Uvicorn**: ASGI server
- **Pydantic**: Data validation
- **psycopg2**: PostgreSQL adapter
- **python-multipart**: File upload support

### UI Framework
- **Radix UI**: Accessible component primitives
- **shadcn/ui**: Pre-built component library
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### File Storage
- Audio consultations stored locally in `uploads/` directory
- Supports WebM, WAV, MP3, MPEG, and OGG audio formats
