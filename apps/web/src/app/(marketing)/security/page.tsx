import { PageLayout } from '@/components/marketing/PageLayout';

const config = {
  "hero": {
    "badge": "Resources",
    "title": "Security &",
    "titleHighlight": "Architecture",
    "description": "TaxSentry is built on military-grade encryption and hosted exclusively within UAE borders."
  },
  "features": {
    "heading": "Zero Trust Infrastructure",
    "items": [
      {
        "icon": "Lock",
        "title": "AES-256 Encryption",
        "description": "All financial data is encrypted at rest and in transit."
      },
      {
        "icon": "Globe",
        "title": "UAE Data Residency",
        "description": "100% of data remains in Google Cloud me-central1 (Doha/Dubai)."
      },
      {
        "icon": "ShieldCheck",
        "title": "Penetration Tested",
        "description": "Annual third-party security audits by CREST-certified firms."
      }
    ]
  }
};

export default function Page() {
  return <PageLayout config={config} />;
}
