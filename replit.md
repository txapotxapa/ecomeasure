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
- Redesigned horizontal vegetation tool to use Digital Robel Pole Method with camera-based analysis
- Camera-based approach provides better accuracy (r² = 0.62 vs 0.26) and eliminates observer bias
- Updated instructions and metrics to reflect literature-standard 4m viewing distance and 1m camera height
- Added comprehensive Google Sheets integration for data export and running datasheets
- Created user-friendly home screen with dashboard, quick actions, recent activity, and settings
- Implemented dashboard statistics: total sessions, today's sessions, completion rate, average canopy cover
- Added quick access toggles for GPS, auto-save, notifications, and dark/light theme
- Separated tools interface into dedicated /tools page for better navigation flow
- Enhanced bottom navigation with Home, Tools, History, and Settings tabs
- Implemented site-based workflow system with site selector component for naming and organizing measurements by location
- Updated navigation structure with dedicated tools page and mobile-optimized bottom navigation
- Modified header to display current site information (name, coordinates, altitude) instead of statistics to support field workflow
- July 07, 2025. Major workflow improvements based on user feedback:
  - Site naming is now the first action in workflow with GPS auto-capture and optional photo documentation
  - Added canopy height measurement as optional data collection point alongside canopy cover analysis
  - Completely redesigned tools page with proper spacing, mobile-responsive layout, and streamlined workflow
  - Reduced clicks to photo input stage - site selection flows directly to measurement tools
  - Enhanced database schema to support site photo documentation and canopy height measurements
  - Improved field research workflow: site creation → consecutive tool usage → comprehensive vegetation profiling
  - Site-based data organization enables succession level assessment through combined metrics
  - Fixed canopy analysis API request issues and timestamp display problems
  - Added manual coordinate input option for site creation - users can now create sites with GPS or manual coordinates
  - Enhanced site creation with dual location options: GPS auto-capture or manual latitude/longitude entry
  - Added coordinate validation for manual entry with proper range checking and error messages
  - Added checkbox option to create sites without coordinates for maximum flexibility
  - Restricted canopy analysis to GLAMA method only for consistency with original research tool
  - Fixed button positioning issue in canopy tool - GLAMA analysis button now properly positioned above bottom navigation
  - Added analysis results data sheet display below canopy height section to verify successful processing
  - Added current session data view in history tab to monitor real-time data logging and verification
  - Enhanced mobile layout with proper spacing to prevent UI overlap with bottom navigation
  - Streamlined interface to eliminate redundancies and unnecessary steps:
    * Combined site status and tool selection into single card for efficiency
    * Simplified tool interface - removed redundant headers and verbose text
    * Condensed history page controls - removed excessive filter options and verbose displays
    * Made workflow more intuitive: site creation → tool selection → photo upload → instant analysis
    * Reduced clicks and cognitive load for field research use
    * Answered workflow question: tools are now primarily accessed from home screen with tools tab as backup
    * Home screen provides direct tool access when site is selected, tools tab provides full tool selector interface
    * URL parameters enable direct tool linking from home screen buttons for seamless workflow
- July 07, 2025. Comprehensive performance and usability improvements:
  - Implemented Web Workers for off-thread image processing to prevent UI freezing
  - Added Progressive Web App (PWA) support with offline functionality and service worker
  - Integrated image optimization for large files (>5MB) before processing
  - Enhanced dark mode support with smooth transitions and improved contrast
  - Added mobile-specific optimizations: 44px minimum touch targets, better gestures
  - Improved CSS with loading animations, focus states, and accessibility features
  - Fixed Digital Daubenmire tool with working Canopeo-like analysis algorithms
  - Created comprehensive improvement plan for phased feature rollout
  - Performance goal: <2s analysis time for 5MP images (previously 5-10s)
  - Ready for field testing with optimized mobile experience
- July 07, 2025. Advanced features integration:
  - Added voice notes functionality for field recording with audio capture and optional transcription
  - Implemented batch processing capability for analyzing multiple images simultaneously
  - Created comprehensive data visualization component with interactive charts powered by Recharts
  - Added quick actions system for rapid field operations (quick capture, save, share, location marking)
  - Enhanced analysis page with tabbed interface showing summary, visualizations, and detailed session data
  - Integrated voice notes and batch processor into tools page for improved workflow
  - Data visualization includes: time series trends, tool usage distribution, biodiversity indices, ground cover composition
  - Batch processor supports concurrent processing (3 files at once) with progress tracking
  - Quick actions provide keyboard shortcuts and one-tap access to common field operations
  - All new features optimized for mobile use with proper touch targets and responsive design

## User Preferences

Preferred communication style: Simple, everyday language.