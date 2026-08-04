import type { ApprovedEditorialAssessment } from "./types";

const assessment: ApprovedEditorialAssessment = {
  "slug": "weweb",
  "approvalStatus": "approved",
  "approvedAt": "2026-08-04",
  "approvedBy": "Gianmaria",
  "assessor": "TooolVibes Editorial (staging, pre-approval)",
  "score": {
    "value": 7.9,
    "verdict": "Adeguato per il ruolo dichiarato, con limiti operativi o di ampiezza gestibili.",
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
        "value": 4
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
    "Assessment basato su record directory + conoscenza pubblica del prodotto: nessun test hands-on.",
    "Pricing dei piani, limiti di export/self-hosting e qualità del codice generato su casi complessi da riverificare."
  ]
};

export default assessment;
