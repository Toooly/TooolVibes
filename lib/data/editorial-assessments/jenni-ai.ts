import type { ApprovedEditorialAssessment } from "./types";

const assessment: ApprovedEditorialAssessment = {
  "slug": "jenni-ai",
  "approvalStatus": "approved",
  "approvedAt": "2026-08-04",
  "approvedBy": "Gianmaria",
  "assessor": "TooolVibes Editorial (staging, pre-approval)",
  "score": {
    "value": 7.8,
    "verdict": "Adeguato per il ruolo dichiarato, con limiti operativi o di ampiezza gestibili.",
    "limitationsAssessed": true,
    "inputs": [
      {
        "dimension": "workflowFit",
        "value": 4
      },
      {
        "dimension": "easeOfUse",
        "value": 5
      },
      {
        "dimension": "versatility",
        "value": 3
      },
      {
        "dimension": "experienceQuality",
        "value": 4
      },
      {
        "dimension": "operationalMaturity",
        "value": 3
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
    "Assessment basato su record directory + materiali vendor: nessun test hands-on.",
    "Accuratezza delle citazioni, qualità multilingua, pricing, dati ed export da riverificare prima della pubblicazione."
  ]
};

export default assessment;
