import type { ApprovedEditorialAssessment } from "./types";

const assessment: ApprovedEditorialAssessment = {
  "slug": "make",
  "approvalStatus": "approved",
  "approvedAt": "2026-08-04",
  "approvedBy": "Gianmaria",
  "assessor": "TooolVibes Editorial (staging, pre-approval)",
  "score": {
    "value": 8.4,
    "verdict": "Solido e affidabile nel suo ruolo. Buona copertura delle dimensioni builder-first.",
    "limitationsAssessed": true,
    "inputs": [
      {
        "dimension": "workflowFit",
        "value": 5
      },
      {
        "dimension": "easeOfUse",
        "value": 3
      },
      {
        "dimension": "versatility",
        "value": 5
      },
      {
        "dimension": "experienceQuality",
        "value": 4
      },
      {
        "dimension": "operationalMaturity",
        "value": 4
      },
      {
        "dimension": "experimentationSpeed",
        "value": 4
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
    "Assessment basato su record directory + conoscenza pubblica del prodotto: nessun test hands-on.",
    "Pricing a operazioni su volumi alti, portabilità degli scenari e profondità di connettori specifici da riverificare prima della pubblicazione."
  ]
};

export default assessment;
