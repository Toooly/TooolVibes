import type { ApprovedEditorialAssessment } from "./types";

const assessment: ApprovedEditorialAssessment = {
  "slug": "frase-ai",
  "approvalStatus": "approved",
  "approvedAt": "2026-08-04",
  "approvedBy": "Gianmaria",
  "assessor": "TooolVibes Editorial (staging, pre-approval)",
  "score": {
    "value": 8.7,
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
    "Assessment basato su record directory + materiali vendor e conoscenza di categoria: nessun test hands-on.",
    "Qualità dei dati SERP, resa editoriale, correlazione con il ranking, integrazioni, export e pricing da riverificare prima della pubblicazione."
  ]
};

export default assessment;
