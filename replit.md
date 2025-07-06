# Ecological Measurement Suite

## Overview

This is a comprehensive mobile-first web application for ecological field research. The application provides three main tools: (1) canopy cover analysis for gap light measurement, (2) horizontal vegetation cover analysis using photos at different heights, and (3) digital Daubenmire frame functionality to replace traditional quadrat sampling methods. The app is built with a React frontend and Express backend, using PostgreSQL for data persistence.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Mobile-First Design**: Responsive layout optimized for mobile devices

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **File Upload**: Multer for image handling
- **Development**: Hot reload with Vite integration
- **Error Handling**: Centralized error middleware

### Database Architecture
- **ORM**: Drizzle ORM with type-safe queries
- **Database**: PostgreSQL (configured for Neon Database)
- **Migrations**: Drizzle Kit for schema management
- **Schema**: Two main tables - analysis_sessions and analysis_settings

## Key Components

### Core Features
1. **Multi-Tool Support**: Three ecological measurement tools in one application
   - Canopy cover analysis (gap light measurement)
   - Horizontal vegetation cover analysis (multi-height photos)
   - Digital Daubenmire sampling (frame-free ground cover analysis)
2. **Image Processing**: Advanced algorithms for each measurement type
   - GLAMA, Canopeo, Custom methods for canopy analysis
   - Color threshold, edge detection, ML for vegetation analysis
   - Frame-free ground cover analysis from standardized camera distance
3. **GPS Integration**: Location tracking for all field measurements
4. **Data Export**: CSV and PDF export functionality for all tool types
5. **History Management**: Session storage and retrieval across all tools
6. **Settings Management**: Tool-specific preferences and analysis defaults

### UI Components
- **Tool Selector**: Interactive cards for choosing between measurement tools
- **Mobile Navigation**: Bottom navigation bar for easy thumb navigation
- **Analysis Results**: Detailed results display with export options for all tool types
- **Processing Modal**: Real-time progress tracking during analysis
- **Image Upload**: Drag-and-drop with camera integration and multi-image support
- **Location Display**: GPS coordinates and accuracy information
- **Horizontal Vegetation Tool**: Multi-height image collection and analysis interface
- **Daubenmire Tool**: Grid-based quadrat sampling with species identification

### Pages
- **Tools**: Tool selection and analysis interfaces for all three measurement types
- **Analysis**: Results visualization and comparison across different tool types
- **History**: Session management and bulk operations for all measurement data
- **Settings**: User preferences and tool-specific configuration options

## Data Flow

1. **Tool Selection**: User chooses between canopy analysis, horizontal vegetation, or Daubenmire frame
2. **Image Capture**: User captures or uploads images specific to selected tool
   - Single upward image for canopy analysis
   - Multiple horizontal images at different heights for vegetation analysis
   - Single downward quadrat image for Daubenmire frame
3. **GPS Collection**: Location data automatically collected if enabled
4. **Analysis Processing**: Images processed using tool-specific algorithms
   - Canopy: GLAMA/Canopeo/Custom for gap light analysis
   - Horizontal Vegetation: Color threshold/Edge detection/ML for density analysis
   - Daubenmire: Grid-based classification for species and ground cover
5. **Results Storage**: Analysis results saved to PostgreSQL database with tool-specific data
6. **Data Export**: Results can be exported as CSV or shared across all tool types
7. **History Access**: Previous analyses accessible through history page with tool filtering

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React, Radix UI components
- **Styling**: Tailwind CSS, class-variance-authority
- **Data Fetching**: TanStack Query
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns
- **Icons**: Lucide React

### Backend Dependencies
- **Database**: Neon Database (PostgreSQL), Drizzle ORM
- **File Handling**: Multer for image uploads
- **Session Management**: connect-pg-simple
- **Validation**: Zod schemas shared between frontend and backend

### Development Dependencies
- **Build Tools**: Vite, esbuild
- **Development**: tsx for TypeScript execution
- **Replit Integration**: Cartographer and runtime error overlay

## Deployment Strategy

### Development Environment
- **Local Development**: `npm run dev` starts both frontend and backend
- **Hot Reload**: Vite provides instant feedback for frontend changes
- **Database**: Uses DATABASE_URL environment variable for connection

### Production Build
- **Frontend**: Vite builds optimized React bundle
- **Backend**: esbuild bundles Express server
- **Static Assets**: Served from dist/public directory
- **Database**: Drizzle migrations applied via `npm run db:push`

### Environment Configuration
- **Development**: NODE_ENV=development with Vite dev server
- **Production**: NODE_ENV=production with static file serving
- **Database**: PostgreSQL connection via DATABASE_URL
- **File Storage**: Local uploads directory (configurable)

## Changelog

Changelog:
- July 06, 2025. Initial canopy analysis setup
- July 06, 2025. Expanded to ecological measurement suite with three tools:
  - Canopy cover analysis (gap light measurement)
  - Horizontal vegetation cover analysis (multi-height photos)  
  - Digital Daubenmire sampling (frame-free ground cover analysis)
- Added comprehensive tool selector interface
- Implemented advanced image processing algorithms for each tool type
- Updated database schema to support multiple measurement types
- Enhanced mobile-responsive interface for field research applications
- Simplified Daubenmire to frame-free photo sampling from 1.5m distance
- Made sampling flexible: analyze single points or continue as needed per study goals
- Redesigned horizontal vegetation tool to use Robel Pole Method with cardinal direction readings
- Updated instructions and metrics to reflect literature-standard 4m viewing distance and 1m eye height

## User Preferences

Preferred communication style: Simple, everyday language.