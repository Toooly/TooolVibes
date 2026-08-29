# 14 — H4 status

Status: **IMPLEMENTED / ACCEPTED** (not released). Flag default OFF. No deploy. No write UI.

## Flag

`TOOOLVIBES_COMMUNITY_READ_ENABLED` → `releaseFeatures.communityRead`
Default: **false**. Controls Tool Page section visibility only. Not authorization.

## Placement

Tool Page after `ToolDetailSignal`, before `ToolDetailAlternatives`.
Nav link **Esperienze** only when the flag is on.

## Read path

`loadPublishedExperiencesForTool` → `listPublishedExperiences` (status=published, limit 8).
Load-more: `GET /api/community/experiences` with opaque cursor.
Projection: `CommunityExperiencePublic` only.

## SEO

Published copy may SSR. No Review / AggregateRating JSON-LD. No profile URLs.

## Not in H4

Write form, AuthSheet, reports, helpful, comments, stars, SQL, deploy.
