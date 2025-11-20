# RebateOS

A comprehensive rebate management platform designed for healthcare and pharmaceutical organizations to streamline contract tracking, dispute resolution, and financial reconciliation.

## Overview

RebateOS provides an enterprise-grade solution for managing complex rebate programs, automating contract parsing, optimizing tier strategies, and maintaining compliance through comprehensive audit trails. Built with modern web technologies and AI-powered automation, the platform delivers operational efficiency and financial accuracy.

## Key Features

### Contract Management
- Centralized contract repository with version control
- Automated contract parsing and data extraction
- Real-time contract status tracking
- Custom metadata and categorization

### Rebate Processing
- Automated rebate calculation engine
- Multi-tier rebate structure support
- Batch processing capabilities
- Accrual tracking and forecasting

### Dispute Resolution
- Structured dispute workflow management
- Stakeholder collaboration tools
- Resolution tracking and reporting
- Historical dispute analytics

### AI-Powered Automation
- Intelligent contract detail extraction
- Product substitution recommendations
- Tier optimization coaching
- Pattern recognition for anomaly detection

### Financial Reconciliation
- Automated ledger management
- Variance analysis and reporting
- Integration with financial systems
- Audit trail generation

### Compliance & Reporting
- 340B program compliance tools
- Regulatory reporting templates
- Custom report builder
- Data export capabilities

## Technology Stack

- **Framework**: Next.js 15.3 with App Router
- **Database**: Firebase/Firestore
- **AI Engine**: Google Genkit with Gemini 2.5 Flash
- **UI Components**: Radix UI with Tailwind CSS
- **Form Validation**: React Hook Form with Zod
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or pnpm package manager
- Firebase project with Firestore enabled
- Google AI API key for Genkit integration

### Installation

1. Clone the repository:
```bash
git clone https://github.com/manojmaheshwarjg/RebateOS.git
cd RebateOS
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase and Google AI credentials.

4. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:9002`.

### Production Build

```bash
npm run build
npm start
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run genkit:dev` | Start Genkit AI development server |
| `npm run genkit:watch` | Start Genkit with file watching |

## Project Structure

```
RebateOS/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Main application pages
│   │   └── login/              # Authentication pages
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI components
│   │   └── [feature]/          # Feature-specific components
│   ├── ai/                     # Genkit AI integration
│   │   ├── flows/              # AI flow definitions
│   │   └── genkit.ts           # AI configuration
│   ├── firebase/               # Firebase integration
│   │   ├── firestore/          # Firestore hooks
│   │   └── config.ts           # Firebase configuration
│   ├── hooks/                  # Custom React hooks
│   └── lib/                    # Utility functions
├── docs/                       # Documentation
├── contract_samples/           # Sample contract files
└── public/                     # Static assets
```

## Configuration

### Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Firestore database
3. Configure authentication methods
4. Add your Firebase configuration to `.env.local`

### Firestore Security Rules

Security rules are defined in `firestore.rules`. Deploy using:
```bash
firebase deploy --only firestore:rules
```

### AI Integration

The platform uses Google Genkit for AI-powered features:
- Contract detail extraction
- Product substitution suggestions
- Tier optimization recommendations

Configure your Google AI API key in the environment variables.

## Security

- Authentication required for all protected routes
- Row-level security through Firestore rules
- Encrypted data transmission
- Regular security audits recommended
- HIPAA compliance considerations for healthcare data

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For technical support or questions, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

Built with Next.js, Firebase, and Google AI technologies to deliver enterprise-grade rebate management solutions.
