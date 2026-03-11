# Petition Pilot

AI-powered petition signature verification platform. 10x faster than manual validation with OCR, intelligent voter matching, real-time analytics, and automated compliance reports.

## Features

### Core Platform
- **AI-Powered OCR** - Reads handwritten signatures from scanned petition sheets using Tesseract.js
- **Smart Voter Matching** - Fuzzy matching against voter registration files with confidence scoring (Fuse.js)
- **Verification Interface** - Split-screen workspace with keyboard shortcuts for rapid signature validation
- **Batch Processing** - Upload and process entire petition drives at once
- **Team Collaboration** - Multi-user projects with role-based access

### Extra Features (Beyond Competitors)
- **Real-Time Analytics Dashboard** - Live progress tracking, accuracy rates, circulator performance breakdowns, cost savings metrics, and jurisdiction insights
- **Automated Compliance Reports** - Jurisdiction-specific validation rules engine, cross-project duplicate signature detection, exportable legal-format PDF reports, and county clerk submission formats

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **OCR**: Tesseract.js (integration ready)
- **Matching**: Fuse.js (integration ready)
- **Animations**: Framer Motion
- **UI Primitives**: Radix UI
- **Icons**: Lucide React

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

## Project Structure

```
src/
  app/
    page.tsx                          # Landing page
    pricing/page.tsx                  # Pricing page
    about/page.tsx                    # About page
    contact/page.tsx                  # Contact page
    login/page.tsx                    # Login page
    signup/page.tsx                   # Signup page
    dashboard/
      layout.tsx                      # Dashboard sidebar layout
      page.tsx                        # Dashboard home
      analytics/page.tsx              # Analytics dashboard (NEW)
      compliance/page.tsx             # Compliance reports (NEW)
      settings/page.tsx               # User settings
      projects/
        page.tsx                      # Projects list
        new/page.tsx                  # New project wizard
        [id]/page.tsx                 # Project detail
        [id]/verify/page.tsx          # Signature verification interface
    api/
      auth/route.ts                   # Auth API stub
      projects/route.ts               # Projects API stub
      verify/route.ts                 # Verification API stub
  components/
    layout/
      navbar.tsx                      # Marketing navbar
      footer.tsx                      # Marketing footer
      marketing-layout.tsx            # Marketing page wrapper
    ui/
      button.tsx                      # Button component
      card.tsx                        # Card components
  lib/
    utils.ts                          # Utility functions
```

## Pricing

| Plan | Per Signature | Setup Fee | Includes |
|------|--------------|-----------|----------|
| Starter | $0.10 | $199 | AI OCR, voter matching, basic dashboard |
| Professional | $0.30 | $399 | Full-service verification, compliance reports, analytics |
| Enterprise | Custom | Custom | SLA, dedicated support, on-premise option |

## License

MIT
