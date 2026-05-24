import { PageLayout } from '@/components/marketing/PageLayout';

const config = {
  "hero": {
    "badge": "Platform Feature",
    "title": "Adequate Substance",
    "titleHighlight": "Vault",
    "description": "Prove your physical presence, staffing, and operating expenditure (OPEX) requirements at the click of a button."
  },
  "features": {
    "heading": "Digital Substance Proof",
    "items": [
      {
        "icon": "Users",
        "title": "Employee Mapping",
        "description": "Track visas, payroll, and physical presence against revenue."
      },
      {
        "icon": "Building2",
        "title": "Lease Management",
        "description": "Store and verify Ejari and Free Zone commercial lease validity."
      },
      {
        "icon": "TrendingUp",
        "title": "OPEX Ratios",
        "description": "Real-time calculation of adequate operating expenditure."
      }
    ]
  },
  "benefits": [
    {
      "badge": "Compliance",
      "badgeIcon": "Lock",
      "title": "Bulletproof FTA Defense",
      "description": "When the FTA asks for proof of \"Adequate Substance,\" generate a full dossier instantly.",
      "bullets": [
        "Secure document storage",
        "Automated ratio health checks",
        "Board-level substance reporting"
      ]
    }
  ]
};

export default function Page() {
  return <PageLayout config={config} />;
}
