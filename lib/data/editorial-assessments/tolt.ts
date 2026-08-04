import type { ApprovedEditorialAssessment } from "./types";

const assessment: ApprovedEditorialAssessment = {
  "slug": "tolt",
  "approvalStatus": "approved",
  "approvedAt": "2026-08-04",
  "approvedBy": "Gianmaria",
  "assessor": "TooolVibes Editorial (staging, pre-approval)",
  "score": {
    "value": 6.5,
    "verdict": "Funzionale ma con vincoli significativi su ampiezza d'uso o maturita operativa.",
    "limitationsAssessed": true,
    "inputs": [
      {
        "dimension": "workflowFit",
        "value": 4
      },
      {
        "dimension": "easeOfUse",
        "value": 3
      },
      {
        "dimension": "versatility",
        "value": 3
      },
      {
        "dimension": "experienceQuality",
        "value": 3
      },
      {
        "dimension": "operationalMaturity",
        "value": 3
      },
      {
        "dimension": "experimentationSpeed",
        "value": 3
      }
    ],
    "provenance": {
      "kind": "editorial-assessment",
      "sourceField": "tooolvibes-directory",
      "methodologyVersion": "builder-first-v1",
      "assessedAt": "2026-08-04"
    }
  },
  "limitations": [
    "Assessment basato su record directory + materiale vendor: nessun test hands-on.",
    "Pricing legato alle commissioni, profondità di integrazioni e portabilità del dato da riverificare prima della pubblicazione."
  ]
};

export default assessment;
