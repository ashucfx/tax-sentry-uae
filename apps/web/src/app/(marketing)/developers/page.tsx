import { PageLayout } from '@/components/marketing/PageLayout';

const config = {
  "hero": {
    "badge": "Resources",
    "title": "Developer",
    "titleHighlight": "Hub",
    "description": "SDKs, API references, and webhooks documentation for building custom compliance integrations."
  },
  "features": {
    "heading": "Build with TaxSentry",
    "items": [
      {
        "icon": "Zap",
        "title": "TypeScript SDK",
        "description": "Type-safe access to our core classification engine."
      },
      {
        "icon": "Globe",
        "title": "Webhooks",
        "description": "Real-time event streaming for transaction state changes."
      },
      {
        "icon": "Lock",
        "title": "Auth Guides",
        "description": "Implementing OAuth and secure API keys."
      }
    ]
  }
};

export default function Page() {
  return <PageLayout config={config} />;
}
