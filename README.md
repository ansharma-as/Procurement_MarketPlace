# 🏪 Procurement Automation Platform

A modern, full-stack marketplace platform that streamlines the procurement process for organizations and vendors. Built with React.js frontend and Node.js backend, featuring AI-powered proposal evaluation and comprehensive workflow management.

## ✨ Features

### 🏢 For Organizations
- **RFP Management**: Create, review, and manage Request for Proposal (RFP) requests
- **Market Request Creation**: Convert approved RFPs into public market requests
- **Proposal Evaluation**: Manual and AI-powered proposal scoring and comparison
- **Vendor Management**: Browse and evaluate vendor profiles and capabilities
- **Award Management**: Award contracts and manage procurement lifecycle
- **AI Analytics**: Get insights on market trends, vendor performance, and proposal analysis

### 🏪 For Vendors
- **Opportunity Discovery**: Browse and search open market requests
- **Proposal Management**: Create, edit, submit, and withdraw proposals
- **Interest Tracking**: Mark interest in opportunities for better visibility
- **Dashboard Analytics**: Track proposal performance and success rates
- **Profile Management**: Maintain detailed vendor profiles with certifications

### 🤖 AI-Powered Features
- **Intelligent Proposal Evaluation**: Automated scoring based on technical specs, pricing, and compliance
- **Vendor Performance Insights**: AI analysis of vendor capabilities and track record
- **Market Analysis**: Smart recommendations for pricing and delivery timelines
- **Executive Summaries**: AI-generated reports for decision makers

## 🛠️ Tech Stack

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **TanStack Query** for data fetching and caching
- **Axios** for HTTP requests
- **Tailwind CSS** for styling
- **Responsive Design** for mobile and desktop

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT Authentication** with role-based access control
- **Google Gemini Pro AI** integration
- **CORS** enabled for cross-origin requests
- **Helmet** for security headers

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Google AI API key for Gemini Pro

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Procurement-Automation-Platform
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install

   # Create .env file
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**

   Create `backend/.env` file:
   ```env
   PORT=8080
   MONGODB_URI=mongodb://localhost:27017/procurement-platform
   JWT_SECRET=your-jwt-secret-key
   JWT_REFRESH_SECRET=your-refresh-secret-key
   GOOGLE_AI_API_KEY=your-google-ai-api-key
   NODE_ENV=development
   ```

5. **Start the Application**

   Backend (Terminal 1):
   ```bash
   cd backend
   npm start
   ```

   Frontend (Terminal 2):
   ```bash
   cd frontend
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080

## 📁 Project Structure

```
Procurement-Automation-Platform/
├── backend/                 # Node.js backend
│   ├── dist/               # Compiled JavaScript files
│   ├── src/                # Source code
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── .env.example
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Utility functions
│   ├── public/
│   └── package.json
└── README.md
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/organization/register` - Register organization with admin
- `POST /api/auth/vendor/register` - Register vendor
- `POST /api/auth/login` - Login (user/vendor)
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - Logout

### RFP Requests (Organizations)
- `POST /api/rfp-requests` - Create RFP request
- `GET /api/rfp-requests` - Get organization's RFP requests
- `PUT /api/rfp-requests/:id` - Update RFP request
- `PATCH /api/rfp-requests/:id/review` - Review/approve RFP
- `DELETE /api/rfp-requests/:id` - Delete RFP request

### Market Requests
- `POST /api/market-requests` - Create market request
- `GET /api/market-requests` - Browse market requests
- `PUT /api/market-requests/:id` - Update market request
- `PATCH /api/market-requests/:id/close` - Close market request
- `PATCH /api/market-requests/:id/award` - Award contract
- `PATCH /api/market-requests/:id/interest` - Mark vendor interest

### Proposals
- `POST /api/proposals` - Submit proposal (vendors)
- `GET /api/proposals` - Get proposals (organizations)
- `GET /api/vendors/proposals` - Get vendor's proposals
- `PUT /api/proposals/:id` - Update proposal (vendors)
- `PATCH /api/proposals/:id/submit` - Submit proposal
- `PATCH /api/proposals/:id/withdraw` - Withdraw proposal
- `PATCH /api/proposals/:id/evaluate` - Manual evaluation
- `PATCH /api/proposals/:id/accept` - Accept proposal
- `PATCH /api/proposals/:id/reject` - Reject proposal

### AI Endpoints
- `POST /api/ai/proposals/:id/evaluate` - AI proposal evaluation
- `GET /api/ai/vendor-insights/:id` - Vendor performance insights
- `POST /api/ai/market-analysis` - Market analysis

### Vendors
- `GET /api/vendors` - Browse all vendors
- `GET /api/vendors/dashboard` - Vendor dashboard
- `PUT /api/vendors/:id` - Update vendor profile

## 🔐 Authentication & Authorization

The platform uses JWT-based authentication with role-based access control:

### User Types
- **Admin**: Full system access, manage organizations and users
- **Manager**: Approve RFPs, evaluate proposals, award contracts
- **Procurement Officer**: Create RFPs, manage market requests
- **Vendor**: Submit proposals, manage vendor profile

### Token Management
- **Access Tokens**: Short-lived (7 days) for API access
- **Refresh Tokens**: Long-lived (30 days) for token renewal
- **Role-based Storage**: `user_token` for organizations, `vendor_token` for vendors

## 🎨 User Interface

### Design System
- **Tailwind CSS**: Utility-first CSS framework
- **Responsive Design**: Mobile-first approach
- **Component Library**: Reusable UI components
- **Dark Mode Ready**: Extensible theming system

### Key Pages
- **Marketplace Landing**: Public marketplace overview
- **Organization Portal**: RFP and proposal management
- **Vendor Portal**: Opportunity discovery and proposal submission
- **Authentication**: Unified login/register for all user types

## 🤖 AI Integration

### Google Gemini Pro Features
- **Proposal Scoring**: Automated evaluation based on multiple criteria
- **Vendor Analysis**: Performance insights and recommendations
- **Market Intelligence**: Pricing and timeline analysis
- **Risk Assessment**: Compliance and capability evaluation

### AI Evaluation Criteria
- **Cost Competitiveness** (40% weight)
- **Technical Specifications** (35% weight)
- **Delivery Timeline** (25% weight)
- **Compliance Score**
- **Overall Recommendation**

## 🔧 Development

### Available Scripts

Backend:
```bash
npm start          # Start development server
npm run build      # Build for production
npm run dev        # Start with nodemon
npm test           # Run tests
```

Frontend:
```bash
npm start          # Start development server (Vite)
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

### Code Quality
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **Git Hooks**: Pre-commit validation
- **Error Handling**: Comprehensive error boundaries

## 📊 Database Schema

### Key Collections
- **Users**: Organization members (admins, managers, officers)
- **Vendors**: Vendor profiles and credentials
- **Organizations**: Company information and settings
- **RFPRequests**: Internal procurement requests
- **MarketRequests**: Public procurement opportunities
- **Proposals**: Vendor submissions and evaluations

## 🚀 Deployment

### Production Setup
1. **Environment Variables**: Configure production .env
2. **Database**: Set up MongoDB cluster
3. **AI Service**: Configure Google AI API
4. **Build**: Run production builds
5. **Server**: Deploy to your hosting platform

### Recommended Hosting
- **Frontend**: Vercel, Netlify, or AWS S3
- **Backend**: Railway, Heroku, or AWS EC2
- **Database**: MongoDB Atlas
- **CDN**: CloudFlare for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add comprehensive error handling
- Include proper TypeScript types
- Write meaningful commit messages
- Test your changes thoroughly

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Documentation**: Check API documentation
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Email**: Contact the development team

## 🎯 Roadmap

### Upcoming Features
- [ ] **Real-time Notifications**: WebSocket integration
- [ ] **Document Management**: File upload and storage
- [ ] **Advanced Analytics**: Detailed reporting dashboard
- [ ] **Multi-language Support**: i18n implementation
- [ ] **Mobile App**: React Native companion app
- [ ] **API Rate Limiting**: Enhanced security measures
- [ ] **Audit Logs**: Comprehensive activity tracking
- [ ] **Integration APIs**: Third-party system connections

### Performance Improvements
- [ ] **Caching Layer**: Redis implementation
- [ ] **Database Optimization**: Query performance tuning
- [ ] **CDN Integration**: Static asset optimization
- [ ] **Code Splitting**: Lazy loading implementation

---

**Built with ❤️ by the Procurement Platform Team**

*Making procurement processes smarter, faster, and more transparent.*