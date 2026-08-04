import type { ApprovedEditorialAssessment } from "./types";

const assessment: ApprovedEditorialAssessment = {
  "slug": "notionapps",
  "approvalStatus": "approved",
  "approvedAt": "2026-08-04",
  "approvedBy": "Gianmaria",
  "assessor": "TooolVibes Editorial (staging, pre-approval)",
  "score": {
    "value": 5.8,
    "verdict": "Limitato. Copre un perimetro ristretto con diverse criticita aperte.",
    "limitationsAssessed": true,
    "inputs": [
      {
        "dimension": "workflowFit",
        "value": 3
      },
      {
        "dimension": "easeOfUse",
        "value": 4
      },
      {
        "dimension": "versatility",
        "value": 2
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
    "Assessment basato su record directory + materiali vendor: nessun test hands-on.",
    "Lock-in duplice (Notion + NotionApps), granularità dei permessi e pricing per app da riverificare."
  ]
};

export default assessment;
