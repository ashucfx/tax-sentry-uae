import { PageLayout } from '@/components/marketing/PageLayout';

const config = {
  "hero": {
    "badge": "Enterprise",
    "title": "Institutional",
    "titleHighlight": "Infrastructure",
    "description": "Complex entity structures, mainland branches, and transfer pricing. TaxSentry scales to handle the most demanding corporate tax requirements."
  },
  "features": {
    "heading": "Uncompromising Scale",
    "items": [
      {
        "icon": "Building2",
        "title": "Multi-Entity Support",
        "description": "Consolidate tax positions across 50+ interconnected subsidiaries."
      },
      {
        "icon": "Lock",
        "title": "SSO & RBAC",
        "description": "SAML/SSO integration and granular role-based access control."
      },
      {
        "icon": "Globe",
        "title": "Dedicated Hosting",
        "description": "Option for single-tenant deployments within UAE Google Cloud."
      }
    ]
  }
};

export default function Page() {
  return <PageLayout config={config} />;
}
