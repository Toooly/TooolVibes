import type { ApprovedEditorialAssessment } from "./types";

const assessment: ApprovedEditorialAssessment = {
  "slug": "v0",
  "approvalStatus": "approved",
  "approvedAt": "2026-08-04",
  "approvedBy": "Gianmaria",
  "assessor": "TooolVibes Editorial (staging, pre-approval)",
  "score": {
    "value": 8.5,
    "verdict": "Solido e affidabile nel suo ruolo. Buona copertura delle dimensioni builder-first.",
    "limitationsAssessed": true,
    "inputs": [
      {
        "dimension": "workflowFit",
        "value": 5
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
    "Assessment basato su record directory + conoscenza pubblica del prodotto (Vercel/Next.js): nessun test hands-on.",
    "Limiti dei piani, qualità del codice generato su logiche complesse e accessibilità dell'output da riverificare."
  ]
};

export default assessment;
