import type { ApprovedEditorialAssessment } from "./types";

const assessment: ApprovedEditorialAssessment = {
  "slug": "livechat",
  "approvalStatus": "approved",
  "approvedAt": "2026-08-04",
  "approvedBy": "Gianmaria",
  "assessor": "TooolVibes Editorial (staging, pre-approval)",
  "score": {
    "value": 8.1,
    "verdict": "Solido e affidabile nel suo ruolo. Buona copertura delle dimensioni builder-first.",
    "limitationsAssessed": true,
    "inputs": [
      {
        "dimension": "workflowFit",
        "value": 4
      },
      {
        "dimension": "easeOfUse",
        "value": 4
      },
      {
        "dimension": "versatility",
        "value": 3
      },
      {
        "dimension": "experienceQuality",
        "value": 5
      },
      {
        "dimension": "operationalMaturity",
        "value": 5
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
    "Assessment basato su record directory + conoscenza pubblica di prodotto: nessun test hands-on.",
    "Pricing per agente, profondità di routing e qualità attuale della UI da riverificare prima della pubblicazione."
  ]
};

export default assessment;
