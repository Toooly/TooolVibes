import type { ApprovedEditorialAssessment } from "./types";

const assessment: ApprovedEditorialAssessment = {
  "slug": "blogify",
  "approvalStatus": "approved",
  "approvedAt": "2026-08-04",
  "approvedBy": "Gianmaria",
  "assessor": "TooolVibes Editorial (staging, pre-approval)",
  "score": {
    "value": 7.3,
    "verdict": "Adeguato per il ruolo dichiarato, con limiti operativi o di ampiezza gestibili.",
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
        "value": 3
      },
      {
        "dimension": "operationalMaturity",
        "value": 3
      },
      {
        "dimension": "experimentationSpeed",
        "value": 5
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
    "Qualità editoriale e SEO, fedeltà agli input, integrazioni CMS, privacy, export e pricing da riverificare prima della pubblicazione."
  ]
};

export default assessment;
