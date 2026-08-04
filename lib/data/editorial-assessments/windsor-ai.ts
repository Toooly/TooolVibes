import type { ApprovedEditorialAssessment } from "./types";

const assessment: ApprovedEditorialAssessment = {
  "slug": "windsor-ai",
  "approvalStatus": "approved",
  "approvedAt": "2026-08-04",
  "approvedBy": "Gianmaria",
  "assessor": "TooolVibes Editorial (staging, pre-approval)",
  "score": {
    "value": 7.1,
    "verdict": "Adeguato per il ruolo dichiarato, con limiti operativi o di ampiezza gestibili.",
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
        "value": 4
      },
      {
        "dimension": "experienceQuality",
        "value": 3
      },
      {
        "dimension": "operationalMaturity",
        "value": 4
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
    "Pricing, profondità dei connettori e granularità di permessi da riverificare prima della pubblicazione."
  ]
};

export default assessment;
