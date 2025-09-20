# 🎨 ChefSync Frontend

React frontend application for the ChefSync food delivery platform built with TypeScript, Vite, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:
   ```env
   # API Configuration
   VITE_API_BASE_URL=http://127.0.0.1:8000/api

   # Google OAuth Configuration
   VITE_GOOGLE_OAUTH_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

   # Development Settings
   VITE_APP_NAME=ChefSync
   VITE_APP_VERSION=1.0.0
   ```

4. **Run development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   App will run on: http://localhost:8081

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── auth/          # Authentication components
│   │   ├── layout/        # Layout and navigation
│   │   ├── admin/         # Admin dashboard components
│   │   ├── ui/            # Shadcn/UI components
│   │   └── forms/         # Form components
│   ├── pages/             # Page components
│   │   ├── auth/          # Login, Register, etc.
│   │   ├── admin/         # Admin dashboard pages
│   │   ├── cook/          # Cook dashboard pages
│   │   ├── customer/      # Customer dashboard pages
│   │   └── delivery/      # Delivery dashboard pages
│   ├── store/             # Zustand state management
│   ├── context/           # React Context providers
│   ├── services/          # API service functions
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Library configurations
│   └── styles/            # Global styles and themes
├── public/                # Static assets
├── .env.example          # Environment template
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## 🔧 Tech Stack

- **React 18** - UI library with hooks
- **TypeScript** - Type safety and better DX
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Beautiful component library
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Axios** - HTTP client

## 🎯 Key Features

### Authentication System
- Multi-step registration with email verification
- OTP-based email verification
- Google OAuth integration
- JWT token management with auto-refresh
- Role-based access control
- Password reset functionality

### Dashboard System
- **Customer Dashboard**: Order history, favorites, profile
- **Cook Dashboard**: Kitchen orders, menu management
- **Delivery Dashboard**: Delivery routes, order tracking
- **Admin Dashboard**: User management, approval workflows

### Document Upload
- Drag & drop file upload
- PDF processing and preview
- Multi-format support (PDF, JPG, PNG, JPEG)
- Progress indicators and error handling
- Cloud storage integration

### UI/UX Features
- Responsive design (mobile-first)
- Dark/light theme support
- Loading states and skeletons
- Toast notifications
- Form validation with real-time feedback
- Accessible components

## 🚀 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code with Prettier

# Type Checking
npm run type-check   # Run TypeScript type checking
```

## 🔧 Configuration

### Environment Variables

#### Development (.env.local)
```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_GOOGLE_OAUTH_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_APP_NAME=ChefSync
VITE_APP_VERSION=1.0.0
```

#### Production (.env.production)
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_GOOGLE_OAUTH_CLIENT_ID=your-production-client-id
VITE_APP_NAME=ChefSync
VITE_APP_VERSION=1.0.0
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized origins:
   - `http://localhost:8081` (development)
   - `https://yourdomain.com` (production)
4. Add authorized redirect URIs:
   - `http://localhost:8081/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)

## 📱 Component Architecture

### Page Components
- **Auth Pages**: Login, Register, ForgotPassword, ResetPassword
- **Dashboard Pages**: Role-specific dashboard views
- **Profile Pages**: User profile management
- **Admin Pages**: User approval, analytics, settings

### Reusable Components
- **Form Components**: Input, Select, Button, Checkbox
- **Layout Components**: Navbar, Sidebar, Footer
- **UI Components**: Card, Modal, Toast, Loading
- **Data Components**: Table, List, Pagination

### State Management

#### Zustand Stores
```typescript
// User Store
interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  approvalStatus: string;
  setUser: (user: User | null) => void;
  logout: () => void;
}

// Order Store
interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
}
```

#### React Context
- **AuthContext**: Global authentication state
- **ThemeContext**: Theme switching and persistence

## 🎨 Styling

### Tailwind CSS
- Utility-first approach
- Custom design system
- Responsive breakpoints
- Dark mode support

### Shadcn/UI Components
- Pre-built accessible components
- Consistent design language
- Customizable variants
- TypeScript support

### Theme Configuration
```typescript
// tailwind.config.ts
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#your-primary-color',
        secondary: '#your-secondary-color',
      }
    }
  }
}
```

## 🔧 Development Guidelines

### Code Standards
- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Implement proper error boundaries
- Write meaningful component names

### File Organization
- Group related components in folders
- Use index.ts for clean imports
- Separate business logic from UI components
- Keep components small and focused

### State Management
- Use Zustand for global state
- Use React Context for theme/UI state
- Use local state for component-specific data
- Implement proper loading and error states

## 🧪 Testing

### Testing Setup
```bash
npm run test        # Run tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage  # Generate coverage report
```

### Testing Libraries
- **Vitest** - Test runner
- **React Testing Library** - Component testing
- **MSW** - API mocking

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

### Production Checklist
- [ ] Set production environment variables
- [ ] Configure production API URL
- [ ] Set up Google OAuth for production
- [ ] Enable production build optimizations
- [ ] Configure error tracking (Sentry)
- [ ] Set up analytics
- [ ] Configure PWA settings

## 🐛 Troubleshooting

### Common Issues
1. **Build Errors**: Check Node.js version and dependencies
2. **API Connection**: Verify API base URL in environment
3. **Google OAuth**: Check client ID and redirect URIs
4. **Styling Issues**: Clear Tailwind cache and rebuild
5. **Type Errors**: Run type checking and fix TypeScript issues

### Development Tips
- Use browser dev tools for debugging
- Check network tab for API calls
- Use React DevTools for component inspection
- Enable strict mode for better error detection

## 📚 Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Shadcn/UI Components](https://ui.shadcn.com/)
- [Vite Documentation](https://vitejs.dev/)

## 🤝 Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation as needed
4. Test on multiple browsers/devices
5. Submit a pull request with description

---

**Frontend Application for ChefSync**