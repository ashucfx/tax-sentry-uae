import { PageLayout } from '@/components/marketing/PageLayout';

const config = {
  "hero": {
    "badge": "Resources",
    "title": "Platform",
    "titleHighlight": "Documentation",
    "description": "Comprehensive guides, tutorials, and knowledge base articles to help you master TaxSentry."
  },
  "features": {
    "heading": "Learn the System",
    "items": [
      {
        "icon": "FileCheck",
        "title": "Getting Started",
        "description": "Step-by-step onboarding for new accounts."
      },
      {
        "icon": "TrendingUp",
        "title": "Best Practices",
        "description": "Optimal configuration for specific Free Zones."
      },
      {
        "icon": "Users",
        "title": "Team Management",
        "description": "How to invite auditors and set permissions."
      }
    ]
  }
};

export default function Page() {
  return <PageLayout config={config} />;
}
