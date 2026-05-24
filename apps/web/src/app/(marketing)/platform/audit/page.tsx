import { PageLayout } from '@/components/marketing/PageLayout';

const config = {
  "hero": {
    "badge": "Platform Feature",
    "title": "Audit Pack",
    "titleHighlight": "Generation",
    "description": "Export complete, cryptographically verified compliance dossiers for your external auditors or the FTA in seconds."
  },
  "features": {
    "heading": "Instant Auditor Hand-off",
    "items": [
      {
        "icon": "Upload",
        "title": "One-Click Export",
        "description": "Generate PDF and structured CSV packages instantly."
      },
      {
        "icon": "CheckCircle2",
        "title": "Cryptographic Proof",
        "description": "Immutable hashes applied to all exported documents."
      },
      {
        "icon": "FileCheck",
        "title": "Working Papers",
        "description": "Pre-formatted working papers mapped to standard audit firm templates."
      }
    ]
  },
  "benefits": [
    {
      "badge": "Speed",
      "badgeIcon": "Clock",
      "title": "Cut Audit Fees in Half",
      "description": "Stop paying Big 4 firms to manually categorize your ledgers. Hand them a perfect compliance pack.",
      "bullets": [
        "Reduce billable hours",
        "Eliminate back-and-forth emails",
        "Standardized FTA formats"
      ]
    }
  ]
};

export default function Page() {
  return <PageLayout config={config} />;
}
