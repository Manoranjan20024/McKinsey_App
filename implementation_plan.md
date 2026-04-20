# Document Quality Check System UI

This plan outlines the creation of a modern enterprise-grade React UI for the Document Quality Check System, fulfilling all requirements for the 6 screens, routing, state management, and API integration.

## Goal
Build a functional, aesthetically pleasing, and robust front-end using React, Vite, React Router, Tailwind CSS, and Context API. The system interfaces with a FastAPI backend to process uploaded documents and manage quality checks.

## User Review Required

> [!WARNING]
> Please review the chosen dependencies and the proposed component structure. Confirm if I should proceed with creating the initial Vite project in the current directory (`c:\Mchensy`).

## Proposed Architecture & Stack

- **Framework**: React 18, bootstrapped with Vite (`npx -y create-vite@latest . --template react`)
- **Styling**: Tailwind CSS (PostCSS)
- **Routing**: `react-router-dom` v6
- **Icons**: `lucide-react`
- **State Management**: React Context API
- **API Requests**: `fetch` API bundled in a single service module

## Application Structure

### File Organization
```
src/
├── main.jsx (Entry point, Router wrap)
├── App.jsx (Context Providers, Layout setup)
├── index.css (Tailwind base)
├── context/
│   └── AppContext.jsx (Global state: uploadId, reportData)
├── services/
│   └── api.js (Axios or Fetch wrappers for all endpoints)
├── components/
│   ├── Layout.jsx (Header, Container)
│   ├── CheckCard.jsx (Quality Report Item)
│   └── StatusIcon.jsx
└── screens/
    ├── UploadScreen.jsx (/)
    ├── ProcessingScreen.jsx (/processing)
    ├── QualityReportScreen.jsx (/report)
    ├── HumanReviewScreen.jsx (/review)
    ├── RejectedScreen.jsx (/rejected)
    └── ApprovedScreen.jsx (/approved)
```

## Route Definitions & Logic

1. **[/] UploadScreen**: Form for file upload and metadata (Claim ID, Policy No, types). Posts to `/upload`, saves `upload_id` to context, navigates to `/processing`.
2. **[/processing] ProcessingScreen**: Animated loading state. Polls `/quality-report/{upload_id}` every second. Routes based on `decision` (AUTO_PASS -> /approved, HUMAN_REVIEW -> /report, AUTO_FAIL -> /rejected).
3. **[/report] QualityReportScreen**: Human review overview. Shows overall score, ring chart, and 8 checks with colors (Pass/Green, Warning/Yellow, Fail/Red). Navigates to `/review`.
4. **[/review] HumanReviewScreen**: Focus on Warnings/Fails. Provides form for final decision (Approve/Reject), reason code, and notes. Posts to `/human-review/{upload_id}` and routes to /approved or /rejected.
5. **[/rejected] RejectedScreen**: Displays final rejected state with listed failed checks. Option to return to /.
6. **[/approved] ApprovedScreen**: Displays detailed approval summary. Option to return to /.

## Open Questions

> [!IMPORTANT]
> 1. Are there specific hex color codes you want for Green/Yellow/Red, or should I use standard Tailwind palettes (e.g., emerald-500, amber-500, rose-500)?
> 2. Should I add mock API responses for local testing while the FastAPI backend is not running, or just write the real API interactions and handle network errors gracefully?
> 3. I plan to use `lucide-react` for clean SVG icons. Is that acceptable?

## Verification Plan

### Automated Tests
* N/A - The focus is on implementing the React UI.

### Manual Verification
1. I will start the React dev server locally.
2. We can manually step through the screens: Upload -> Processing -> Report -> Review -> Final (Approve/Reject).
3. We will verify UI behaviors, color coding, and loading states.
