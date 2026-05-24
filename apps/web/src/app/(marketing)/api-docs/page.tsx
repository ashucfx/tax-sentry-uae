import { PageLayout } from '@/components/marketing/PageLayout';

const config = {
  "hero": {
    "badge": "Developers",
    "title": "TaxSentry",
    "titleHighlight": "API Access",
    "description": "Programmatically sync revenue streams, create custom classification rules, and automate your compliance workflow."
  },
  "features": {
    "heading": "Developer-First Infrastructure",
    "items": [
      {
        "icon": "Zap",
        "title": "RESTful & GraphQL",
        "description": "Choose the protocol that fits your internal tech stack."
      },
      {
        "icon": "Lock",
        "title": "API Keys & Webhooks",
        "description": "Secure, token-based authentication with real-time event streaming."
      },
      {
        "icon": "Globe",
        "title": "99.99% Uptime",
        "description": "Enterprise-grade SLA backed by Google Cloud me-central1."
      }
    ]
  }
};

export default function Page() {
  return <PageLayout config={config} />;
}
