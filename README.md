# Joyride HR - Human Resources Management System

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.9-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

A comprehensive, modern Human Resources Management System built with Next.js, TypeScript, and PostgreSQL. Joyride HR provides a complete solution for managing employees, candidates, scheduling, performance tracking, and organizational workflows.

## 🌟 Features

### 👥 **Employee Management**
- Complete employee profiles with personal and professional information
- Performance tracking and KPI scoring
- Document management and file uploads
- Activity logging and audit trails
- Role-based access control (Admin, Manager, HR)

### 🎯 **Candidate Management**
- Applicant tracking system with Kanban board
- Status management (Call Immediately, Shortlist, Remove)
- CV upload and document management
- Interview scheduling and coordination
- Candidate scoring and evaluation

### 📅 **Calendar & Scheduling**
- Interactive calendar with FullCalendar integration
- Event management (interviews, meetings, PTO requests)
- Google Calendar integration
- Video conferencing links (Google Meet)
- Automated email notifications

### 🏢 **Organizational Tools**
- Interactive organizational chart
- Department management and metrics
- Shift scheduling and management
- Performance analytics and reporting

### 🔐 **Security & Authentication**
- NextAuth.js integration with multiple providers
- Role-based access control
- Secure password management with bcrypt
- Password reset functionality with email verification
- Session management and security

### 📧 **Communication & Notifications**
- Automated email notifications
- n8n workflow integration
- Outbox management for pending communications
- Professional email templates

### 📊 **Analytics & Reporting**
- Real-time dashboard with key metrics
- Department performance analytics
- Employee performance tracking
- Interactive charts and visualizations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- pnpm (recommended) or npm
- Google Calendar API credentials (optional)
- n8n instance (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/joyride-hr.git
   cd joyride-hr
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables in `.env.local`:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/joyride_hr"
   
   # Authentication
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   
   # Email (optional)
   RESEND_API_KEY="your-resend-api-key"
   
   # n8n Integration (optional)
   N8N_WEBHOOK_URL="https://your-n8n-instance.com/webhook"
   N8N_WEBHOOK_SECRET="your-webhook-secret"
   
   # Google Calendar (optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Set up the database**
   ```bash
   # Run the database migrations
   psql -d your_database_name -f scripts/sql/001_init.sql
   psql -d your_database_name -f scripts/sql/002_seed.sql
   # ... continue with other migration files
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Initial Setup

1. **Create Admin Account**: The system will prompt you to create the first admin user
2. **Configure Departments**: Set up your organizational structure
3. **Invite Users**: Use the admin panel to create user accounts and send welcome emails

### User Roles

- **Admin**: Full system access, user management, system configuration
- **Manager**: Employee management, performance tracking, scheduling
- **HR**: Candidate management, hiring workflows, employee onboarding

### Key Workflows

#### Employee Onboarding
1. Admin creates user account
2. Welcome email sent automatically with password reset link
3. Employee sets password and accesses system
4. Complete profile setup and document uploads

#### Candidate Management
1. Upload candidate CV and information
2. Assign status (Call Immediately, Shortlist, Remove)
3. Schedule interviews via calendar
4. Track performance and make hiring decisions

#### Performance Management
1. Set KPIs and performance metrics
2. Regular performance reviews
3. Track progress and generate reports
4. Identify areas for improvement

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons
- **Recharts** - Data visualization
- **ECharts** - Advanced charting

### Backend
- **Next.js API Routes** - Server-side API endpoints
- **PostgreSQL** - Primary database
- **Neon Database** - Serverless PostgreSQL
- **NextAuth.js** - Authentication framework
- **bcrypt** - Password hashing

### Integrations
- **Google Calendar API** - Calendar synchronization
- **n8n** - Workflow automation
- **Resend** - Email delivery
- **Vercel Blob** - File storage

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **PostCSS** - CSS processing

## 📁 Project Structure

```
joyride-hr/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   ├── (dashboard)/              # Main application
│   │   ├── admin/               # Admin management
│   │   ├── employees/           # Employee management
│   │   ├── candidates/          # Candidate management
│   │   ├── calendar/            # Calendar & scheduling
│   │   └── dashboard/           # Main dashboard
│   ├── api/                     # API routes
│   └── globals.css              # Global styles
├── components/                   # Reusable components
│   ├── ui/                      # UI components
│   └── *.tsx                    # Feature components
├── lib/                         # Utility functions
├── hooks/                       # Custom React hooks
├── scripts/                     # Database migrations
└── public/                      # Static assets
```

## 🔧 Configuration

### Database Setup

The system uses PostgreSQL with the following key tables:
- `users` - User accounts and authentication
- `employees` - Employee information and profiles
- `candidates` - Job applicants and tracking
- `events` - Calendar events and scheduling
- `password_reset_tokens` - Password reset functionality

### Email Configuration

Configure email delivery through:
- **Resend** (recommended for production)
- **n8n workflows** for advanced automation
- **SMTP** for custom email servers

### Calendar Integration

Enable Google Calendar integration for:
- Event synchronization
- Meeting scheduling
- Video conferencing links

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Other Platforms

The application can be deployed to any platform supporting Next.js:
- **Netlify**
- **Railway**
- **DigitalOcean App Platform**
- **AWS Amplify**

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use conventional commit messages
- Ensure all tests pass
- Update documentation as needed
- Follow the existing code style

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the inline code comments and component documentation
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join community discussions for questions and ideas

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Charts powered by [Recharts](https://recharts.org/)

---

**Joyride HR** - Streamlining Human Resources Management for Modern Organizations
