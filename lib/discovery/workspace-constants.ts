export const WORKSPACE_SCHEMA_VERSION = 1 as const;

/**
 * Canonical compare contract — ONE source of truth shared by:
 *   - Archive compare tray
 *   - Compare route
 *   - Bottom-navigation badge
 *   - CompareToggle button (each tool card)
 *   - Helper copy (Italian singular/plural aware)
 *   - Tests / persistence
 *
 * MIN_COMPARE_TOOLS = number of candidates required to "activate" the
 *   comparison and enable the "Apri confronto" CTA.
 * MAX_COMPARE_TOOLS = hard cap on how many candidates a user can pin.
 *
 * If a candidate reaches MAX, the system MUST:
 *   - prevent adding another (toggle returns { added: false, limited: true })
 *   - render the tray CTA as disabled (limit reached, not "ready")
 *   - render helper copy: "Hai raggiunto il limite di MAX tool."
 *
 * Never hardcode these values anywhere except this file.
 */
export const MIN_COMPARE_TOOLS = 2;
export const MAX_COMPARE_TOOLS = 5;

export const MAX_WORKSPACE_COLLECTION_TOOLS = 500;
export const MAX_WORKSPACE_TOOL_STATES = 500;

export const MAX_PERSONAL_STACKS = 30;
export const MAX_STACK_NAME_LENGTH = 80;
export const MAX_STACK_DESCRIPTION_LENGTH = 280;
export const MAX_USE_CASE_LENGTH = 200;

export const MAX_RELATIONSHIP_EVENTS = 200;
export const MAX_RELATIONSHIP_EVENT_ID_LENGTH = 160;
