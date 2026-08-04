import type { ApprovedEditorialAssessment } from "./types";

const assessment: ApprovedEditorialAssessment = {
  "slug": "synthesia-ai",
  "approvalStatus": "approved",
  "approvedAt": "2026-08-04",
  "approvedBy": "Gianmaria",
  "assessor": "TooolVibes Editorial (staging, pre-approval)",
  "score": {
    "value": 9.1,
    "verdict": "Eccellente per il suo ruolo. Riferimento di categoria per maturita, qualita e fit operativo.",
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
        "value": 5
      },
      {
        "dimension": "operationalMaturity",
        "value": 5
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
    "Assessment basato su record directory + materiali vendor e conoscenza pubblica di categoria: nessun test hands-on.",
    "Naturalezza degli avatar, accessibilità, governance, portabilità dei progetti, SLA e pricing da riverificare prima della pubblicazione."
  ]
};

export default assessment;
