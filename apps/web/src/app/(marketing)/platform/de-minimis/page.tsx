import { PageLayout } from '@/components/marketing/PageLayout';

const config = {
  "hero": {
    "badge": "Platform Feature",
    "title": "De-Minimis",
    "titleHighlight": "Tracker",
    "description": "Monitor your AED 3,000,000 / 5% Non-Qualifying Revenue threshold in absolute real-time. Never guess your compliance status again."
  },
  "features": {
    "heading": "Precision Threshold Monitoring",
    "items": [
      {
        "icon": "BarChart3",
        "title": "Live Ledger Sync",
        "description": "Connects directly to Xero/QuickBooks for real-time classification."
      },
      {
        "icon": "Bell",
        "title": "Proactive Alerts",
        "description": "Get warned automatically when approaching 80% of the threshold limit."
      },
      {
        "icon": "FileCheck",
        "title": "Audit-Ready Trails",
        "description": "Every transaction is logged and timestamped for FTA verification."
      }
    ]
  },
  "benefits": [
    {
      "badge": "Zero-Risk",
      "badgeIcon": "ShieldCheck",
      "title": "Eliminate Manual Spreadsheet Errors",
      "description": "Stop manually calculating non-qualifying income ratios.",
      "bullets": [
        "Automated revenue categorization",
        "Daily variance reporting",
        "Multi-entity consolidation"
      ]
    }
  ]
};

export default function Page() {
  return <PageLayout config={config} />;
}
