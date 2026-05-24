import { PageLayout } from '@/components/marketing/PageLayout';

const config = {
  "hero": {
    "badge": "For Consultants",
    "title": "Advisory",
    "titleHighlight": "Operating System",
    "description": "Elevate your tax advisory practice. Use TaxSentry to actively monitor your clients compliance health year-round."
  },
  "features": {
    "heading": "Retainer-Driven Value",
    "items": [
      {
        "icon": "TrendingUp",
        "title": "Proactive Advisory",
        "description": "Get alerted when a client is nearing the AED 3M de-minimis limit."
      },
      {
        "icon": "Users",
        "title": "Multi-Client Views",
        "description": "A single pane of glass for your entire advisory portfolio."
      },
      {
        "icon": "ShieldCheck",
        "title": "Value Justification",
        "description": "Generate automated monthly risk reports to justify your retainer fees."
      }
    ]
  }
};

export default function Page() {
  return <PageLayout config={config} />;
}
