/**
 * Editorial assessments — index.
 *
 * Single source of truth per score verificato. Il `slug` e la chiave.
 * Solo assessment con `approvalStatus === "approved"` vengono
 * esposti al runtime.
 *
 * Owner approval: Gianmaria, 2026-08-04.
 * 25 APPROVE + 5 APPROVE_WITH_LIMITATIONS.
 * Metodologia: builder-first-v1.
 * Registry: 30/30 tool canonici coperti.
 */

import type { ApprovedEditorialAssessment } from "./types";

import agentx from "./agentx";
import betterpic from "./betterpic";
import blink from "./blink";
import blogify from "./blogify";
import chatbot from "./chatbot";
import cosmicjs from "./cosmicjs";
import flowise from "./flowise";
import frase_ai from "./frase-ai";
import helpdesk from "./helpdesk";
import imagine_art from "./imagine-art";
import jenni_ai from "./jenni-ai";
import lemon_squeezy from "./lemon-squeezy";
import livechat from "./livechat";
import make from "./make";
import meku from "./meku";
import mocha from "./mocha";
import muse_ai from "./muse-ai";
import notionapps from "./notionapps";
import omi from "./omi";
import reachifyme from "./reachifyme";
import socleads from "./socleads";
import synthesia_ai from "./synthesia-ai";
import tolt from "./tolt";
import v0 from "./v0";
import vibecode from "./vibecode";
import vibrantsnap from "./vibrantsnap";
import vidau from "./vidau";
import wegic from "./wegic";
import weweb from "./weweb";
import windsor_ai from "./windsor-ai";

const approvedAssessments: ReadonlyArray<ApprovedEditorialAssessment> = [
  agentx,
  betterpic,
  blink,
  blogify,
  chatbot,
  cosmicjs,
  flowise,
  frase_ai,
  helpdesk,
  imagine_art,
  jenni_ai,
  lemon_squeezy,
  livechat,
  make,
  meku,
  mocha,
  muse_ai,
  notionapps,
  omi,
  reachifyme,
  socleads,
  synthesia_ai,
  tolt,
  v0,
  vibecode,
  vibrantsnap,
  vidau,
  wegic,
  weweb,
  windsor_ai,
];

const approvedBySlug: Map<string, ApprovedEditorialAssessment> = new Map(
  approvedAssessments.map((assessment) => [assessment.slug, assessment]),
);

export function getApprovedAssessmentBySlug(
  slug: string,
): ApprovedEditorialAssessment | null {
  return approvedBySlug.get(slug) ?? null;
}

export function listApprovedAssessmentSlugs(): readonly string[] {
  return approvedAssessments.map((assessment) => assessment.slug);
}
