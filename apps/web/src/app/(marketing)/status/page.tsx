import { PageLayout } from '@/components/marketing/PageLayout';

const config = {
  "hero": {
    "badge": "Resources",
    "title": "System",
    "titleHighlight": "Status",
    "description": "Real-time uptime monitoring and incident reports for the TaxSentry infrastructure."
  },
  "features": {
    "heading": "100% Operational",
    "items": [
      {
        "icon": "CheckCircle2",
        "title": "API Gateway",
        "description": "Operational. Latency: 45ms."
      },
      {
        "icon": "Zap",
        "title": "Classification Engine",
        "description": "Operational. Processing queue empty."
      },
      {
        "icon": "Building2",
        "title": "Xero/QBO Sync",
        "description": "Operational. Webhooks processing normally."
      }
    ]
  }
};

export default function Page() {
  return <PageLayout config={config} />;
}
