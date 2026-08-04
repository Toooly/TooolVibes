import type { ApprovedEditorialAssessment } from "./types";

const assessment: ApprovedEditorialAssessment = {
  "slug": "omi",
  "approvalStatus": "approved",
  "approvedAt": "2026-08-04",
  "approvedBy": "Gianmaria",
  "assessor": "TooolVibes Editorial (staging, pre-approval)",
  "score": {
    "value": 4.8,
    "verdict": "Sperimentale. Bassa maturita e adozione; richiede verifica diretta prima dell'adozione.",
    "limitationsAssessed": true,
    "inputs": [
      {
        "dimension": "workflowFit",
        "value": 2
      },
      {
        "dimension": "easeOfUse",
        "value": 2
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
        "value": 2
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
    "Maturità hardware, pricing, retention dei dati audio e stabilità del progetto open-source nel tempo da riverificare prima della pubblicazione."
  ]
};

export default assessment;
