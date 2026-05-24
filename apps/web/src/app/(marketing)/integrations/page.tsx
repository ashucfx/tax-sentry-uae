import { PageLayout } from '@/components/marketing/PageLayout';

const config = {
  "hero": {
    "badge": "Platform",
    "title": "Accounting",
    "titleHighlight": "Sync",
    "description": "Native integrations with Xero, QuickBooks Online, NetSuite, and Zoho Books. Get set up in less than 5 minutes."
  },
  "features": {
    "heading": "Plug and Play",
    "items": [
      {
        "icon": "ArrowRight",
        "title": "Xero",
        "description": "Deep, two-way sync with tracking categories."
      },
      {
        "icon": "Building2",
        "title": "QuickBooks Online",
        "description": "Class and location tracking perfectly mapped."
      },
      {
        "icon": "TrendingUp",
        "title": "Oracle NetSuite",
        "description": "Enterprise-grade subsidiary consolidation support."
      }
    ]
  }
};

export default function Page() {
  return <PageLayout config={config} />;
}
