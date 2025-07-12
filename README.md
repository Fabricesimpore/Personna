# Create Testings Demo

A seamless persona creation flow inspired by UserTesting's clean, engaging style. This demo showcases a complete template selection and test creation experience built with React, TypeScript, and Express.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation & Setup

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start both servers:**
   ```bash
   npm run dev
   ```

This will start:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

## 🎯 Demo Flow

1. **Splash Screen**: Clean, centered "Create Persona" button
2. **Template Selection**: Browse featured and all templates
3. **Test Creation**: Select a template to create a new test instance

## 📁 Project Structure

```
project-root/
├── README.md
├── package.json          # Root package.json for running both servers
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.tsx       # React app entry point
│       ├── App.tsx         # Splash screen with "Create Persona" button
│       ├── components/
│       │   └── TemplateCard.tsx
│       ├── pages/
│       │   └── CreateTest.tsx
│       └── services/
│           └── api.ts
└── backend/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts        # Express server bootstrap
        ├── routes/
        │   ├── testTemplates.ts  # Template API endpoints
        │   └── tests.ts          # Test creation endpoints
        └── models/
            ├── TestTemplate.ts   # Template data model
            └── TestInstance.ts   # Test instance model
```

## 🎨 Features

### Frontend
- **Splash Screen**: UserTesting-inspired landing page
- **Template Cards**: Rich template display with icons, difficulty, duration
- **Featured Section**: Highlighted templates with horizontal scroll
- **Responsive Design**: Works on desktop and mobile
- **Loading States**: Smooth loading and error handling

### Backend
- **RESTful API**: Clean Express.js endpoints
- **Template Management**: 7 UX study templates (Basic Usability, Click Test, Survey, etc.)
- **Test Creation**: Create test instances from templates
- **TypeScript**: Full type safety throughout

## 🔧 Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only the frontend
- `npm run dev:backend` - Start only the backend
- `npm run build` - Build both frontend and backend for production
- `npm run install:all` - Install dependencies for all packages

## 🎯 Template Types

The demo includes 7 UX study templates:

1. **Basic Usability Test** - Beginner level, 30 min
2. **Click Test** - Intermediate level, 45 min  
3. **Survey** - Intermediate level, 60 min
4. **Live Intercept** - Advanced level, 90 min
5. **Card Sort** - Advanced level, 75 min
6. **Tree Test** - Beginner level, 40 min
7. **Advanced UX Research** - Advanced level, 120 min

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React icons
- **Backend**: Express.js, TypeScript, CORS, Helmet
- **Development**: Concurrently for running both servers

## 📝 API Endpoints

- `GET /api/test-templates` - Get all templates
- `POST /api/tests` - Create new test instance
- `GET /api/tests` - Get all test instances
- `GET /health` - Health check

## 🎨 Design Inspiration

This demo draws direct inspiration from UserTesting's clean, engaging interface:
- Minimalist splash screen with clear CTA
- Card-based template selection
- Featured templates with visual hierarchy
- Smooth transitions and hover effects
- Professional color scheme and typography

---

Built with ❤️ using Cursor for seamless development experience. 