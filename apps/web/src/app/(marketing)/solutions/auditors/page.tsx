import { PageLayout } from '@/components/marketing/PageLayout';

const config = {
  "hero": {
    "badge": "For Auditors",
    "title": "Practice",
    "titleHighlight": "Management",
    "description": "Standardize your UAE Corporate Tax audit engagements. Connect directly to your clients ledgers with read-only API access."
  },
  "features": {
    "heading": "Audit Faster. Audit Better.",
    "items": [
      {
        "icon": "Clock",
        "title": "Accelerated Engagements",
        "description": "Skip the manual ledger tagging phase entirely."
      },
      {
        "icon": "Lock",
        "title": "Client Portals",
        "description": "Manage dozens of clients from a single centralized dashboard."
      },
      {
        "icon": "FileCheck",
        "title": "Standardized Papers",
        "description": "Export working papers directly into your audit software."
      }
    ]
  }
};

export default function Page() {
  return <PageLayout config={config} />;
}
