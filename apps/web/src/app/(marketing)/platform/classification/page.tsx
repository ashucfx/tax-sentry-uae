import { PageLayout } from '@/components/marketing/PageLayout';

const config = {
  "hero": {
    "badge": "Platform Feature",
    "title": "Income Classification",
    "titleHighlight": "Engine",
    "description": "Automatically categorize transactions as Qualifying, Non-Qualifying, or Excluded Income per FTA Decision No. 139."
  },
  "features": {
    "heading": "Intelligent Categorization",
    "items": [
      {
        "icon": "Zap",
        "title": "Rules Engine",
        "description": "Over 500 pre-built FTA rules mapped to your chart of accounts."
      },
      {
        "icon": "Building2",
        "title": "Free Zone Logic",
        "description": "Tailored logic for specific Designated Zones and Free Zones."
      },
      {
        "icon": "Globe",
        "title": "Cross-Border Detection",
        "description": "Automatically tags import/export revenue for mainland vs free zone rules."
      }
    ]
  },
  "benefits": [
    {
      "badge": "Accuracy",
      "badgeIcon": "CheckCircle2",
      "title": "Defend Your 0% Corporate Tax Rate",
      "description": "A single misclassified AED 100 invoice can void your QFZP status. We ensure perfect categorization.",
      "bullets": [
        "Invoice-level metadata tagging",
        "Supplier & Customer matching",
        "Historical anomaly detection"
      ]
    }
  ]
};

export default function Page() {
  return <PageLayout config={config} />;
}
