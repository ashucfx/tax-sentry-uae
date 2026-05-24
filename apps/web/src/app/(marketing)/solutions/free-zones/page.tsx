import { PageLayout } from '@/components/marketing/PageLayout';

const config = {
  "hero": {
    "badge": "For Free Zones",
    "title": "Authority",
    "titleHighlight": "Partnerships",
    "description": "Offer TaxSentry as a white-labeled compliance layer to your licensees. Increase attractiveness and regulatory compliance."
  },
  "features": {
    "heading": "Supercharge Your Jurisdiction",
    "items": [
      {
        "icon": "Building2",
        "title": "White-label Deployments",
        "description": "Your branding, our compliance engine."
      },
      {
        "icon": "Globe",
        "title": "Macro Visibility",
        "description": "Aggregated, anonymized data on zone-wide compliance health."
      },
      {
        "icon": "Users",
        "title": "Licensee Onboarding",
        "description": "Automated setups for new company incorporations."
      }
    ]
  }
};

export default function Page() {
  return <PageLayout config={config} />;
}
