# POS Management System

## Overview

This is a comprehensive Point-of-Sale (POS) management system built with React, Express, and TypeScript. The application provides a multi-tenant architecture where businesses can register for POS systems, which require admin approval before activation. Once approved, businesses can manage products and process transactions through their dedicated POS interface.

The system features two distinct user types: administrators who manage and approve POS registrations, and POS users who operate their business's point-of-sale system. The application includes authentication workflows, approval processes, transaction management, and receipt generation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The client application is built using React with TypeScript and follows a component-based architecture. Key design decisions include:

- **Routing**: Uses Wouter for client-side routing, providing a lightweight alternative to React Router
- **State Management**: Leverages React Query (@tanstack/react-query) for server state management, eliminating the need for additional state management libraries like Redux
- **UI Framework**: Implements shadcn/ui components with Radix UI primitives for consistent, accessible design
- **Styling**: Uses Tailwind CSS with CSS variables for theming and responsive design
- **Authentication**: Context-based authentication system with protected routes

The application structure separates concerns with dedicated pages for each user flow (landing, login, dashboards) and reusable UI components.

### Backend Architecture

The server follows a RESTful API design pattern with Express.js:

- **Authentication**: Passport.js with local strategy for session-based authentication
- **Session Management**: Express sessions with configurable storage (memory store for development)
- **Data Validation**: Zod schemas for request/response validation
- **Password Security**: Crypto-based password hashing with salt
- **Middleware**: Request logging, JSON parsing, and authentication guards

The backend implements role-based access control with separate middleware for admin and POS user authentication.

### Data Storage Solutions

The application uses a flexible storage abstraction pattern:

- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Design**: Normalized relational structure with proper foreign key relationships
- **Development Mode**: In-memory storage implementation for rapid development and testing
- **Migration Support**: Drizzle migrations for schema version control

Key tables include admin users, POS systems, products, and transactions with appropriate relationships and constraints.

### Authentication and Authorization

Multi-layered security approach:

- **Session-Based Authentication**: Uses Express sessions with secure cookie configuration
- **Role-Based Access Control**: Separate authentication flows for admin and POS users
- **Password Security**: Scrypt-based password hashing with random salt generation
- **Route Protection**: Middleware-based route guards preventing unauthorized access
- **Session Persistence**: Configurable session storage with automatic cleanup

### Component and UI Design

Modern, accessible user interface built with:

- **Design System**: shadcn/ui providing consistent component library
- **Accessibility**: Radix UI primitives ensuring WCAG compliance
- **Responsive Design**: Mobile-first Tailwind CSS approach
- **Theme Support**: CSS custom properties enabling light/dark mode support
- **Form Handling**: React Hook Form with Zod validation for type-safe forms

## External Dependencies

### Core Framework Dependencies
- **React 18**: Frontend framework with modern hooks and concurrent features
- **Express.js**: Node.js web framework for REST API development
- **TypeScript**: Type safety across frontend and backend
- **Vite**: Build tool and development server with hot module replacement

### Database and ORM
- **PostgreSQL**: Primary database (configured via Drizzle)
- **Drizzle ORM**: Type-safe database queries and migrations
- **@neondatabase/serverless**: Serverless PostgreSQL adapter for cloud deployment

### Authentication and Security
- **Passport.js**: Authentication middleware with local strategy
- **Express Session**: Session management with PostgreSQL store support
- **Crypto (Node.js built-in)**: Password hashing and security utilities

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **shadcn/ui**: Pre-built component library
- **Lucide React**: Modern icon library

### State Management and Data Fetching
- **TanStack Query (React Query)**: Server state management and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema definition

### Development and Build Tools
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind integration
- **Autoprefixer**: Automatic vendor prefix addition

### Routing and Navigation
- **Wouter**: Lightweight React router for client-side navigation

The application is designed to be cloud-ready with support for environment-based configuration and can be deployed to platforms supporting Node.js applications with PostgreSQL databases.