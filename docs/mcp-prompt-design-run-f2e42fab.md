# MCP-designed LLM prompts — Run `f2e42fab`

**Status:** Wired into the agent pipeline (MCP → JCR fallback → MCP-shaped chunk prompts).

**Run:** `f2e42fab-f9ad-432b-987f-9b99fcb09a15`  
**Source (reference):** `/content/wknd/language-masters/en/about-us`  
**Author:** `https://author-p149251-e1522049.adobeaemcloud.com`  
**MCP pageId:** `ncOvO8-G3JAhS7eHqo10fkfuXAFmm0vrLx7OpYFGynAJyfz7Y-2fkqcFOiDeaf9w`  
**Fetched via:** `search-aem-pages` → `get-aem-page-content`

## Component inventory (skip page + container)

| # | id | componentType | → EDS block | Key properties |
|---|-----|---------------|-------------|----------------|
| 1 | `title` | `wknd/components/title` | **hero** | page title (inherits “About Us”) |
| 2 | `title_393953656` | `wknd/components/title` | **hero** / section heading | `jcr:title`: Our Contributors, `type`: h2 |
| 3 | `text_310704238` | `wknd/components/text` | **columns** (intro) | richtext intro |
| 4+ | `experiencefragment_*` | `wknd/components/experiencefragment` | **cards** | `fragmentVariationPath` → contributor XF |

Layout shells **skipped:** `wknd/components/page`, `wknd/components/container`, `cq:responsive`.

---

## Shared system prompt (every chunk)

```
You are an AEM Edge Delivery Services (Franklin) block engineer.
Input is AEM MCP page content (componentType + properties), NOT scraped HTML.
Skip any page/container/layout shells if present.
Rules:
- Vanilla ES module only: export default function decorate(block) { ... }
- CSS scoped to the block class, mobile-first, no frameworks
- Map authored properties into DOM (titles, text, fragment refs as card cells)
- Reply with ONLY one JSON object: {"name":"<block>","js":"...","css":"..."}
- Escape newlines in js/css as \n. No markdown fences. No prose.
```

---

## Chunk 1 — `hero`

**User prompt:**

```
Chunk 1 — block: hero
Page: /content/wknd/language-masters/en/about-us
Page title: About Us
Description: WKND is a collective of outdoors, music, crafts, adventure sports, and travel enthusiasts...

--- AEM MCP COMPONENTS (source of truth) ---
[
  {
    "id": "title",
    "componentType": "wknd/components/title",
    "properties": {}
  },
  {
    "id": "title_393953656",
    "componentType": "wknd/components/title",
    "properties": { "jcr:title": "Our Contributors", "type": "h2" }
  }
]

Generate EDS block "hero": H1 from page title "About Us", optional supporting H2 "Our Contributors".
Return ONLY: {"name":"hero","js":"...","css":"..."}
```

---

## Chunk 2 — `columns` (intro text)

**User prompt:**

```
Chunk 2 — block: columns
Page: /content/wknd/language-masters/en/about-us

--- AEM MCP COMPONENTS (source of truth) ---
[
  {
    "id": "text_310704238",
    "componentType": "wknd/components/text",
    "properties": {
      "textIsRich": "true",
      "text": "<p><i>Meet the outstanding individuals responsible for bringing you the most compelling stories across the globe.</i></p>"
    }
  }
]

Generate EDS block "columns" that renders this richtext intro (italic lead-in).
Return ONLY: {"name":"columns","js":"...","css":"..."}
```

---

## Chunk 3 — `cards` (contributor experience fragments)

**User prompt:**

```
Chunk 3 — block: cards
Page: /content/wknd/language-masters/en/about-us

--- AEM MCP COMPONENTS (source of truth) ---
[
  {
    "id": "experiencefragment_c",
    "componentType": "wknd/components/experiencefragment",
    "properties": {
      "fragmentVariationPath": "/content/experience-fragments/wknd/language-masters/en/contributors/stacey-roswells/master"
    },
    "grid": { "default": 3, "tablet": 6, "phone": 12 }
  },
  {
    "id": "experiencefragment_c_1974749364",
    "componentType": "wknd/components/experiencefragment",
    "properties": {
      "fragmentVariationPath": "/content/experience-fragments/wknd/language-masters/en/contributors/jake-hammer/master"
    },
    "grid": { "default": 3, "tablet": 6, "phone": 12 }
  }
]

Each XF is one contributor card. Use the last path segment before /master as the person slug/name
(e.g. stacey-roswells → "Stacey Roswells"). Build a responsive cards grid (4-across desktop).
Return ONLY: {"name":"cards","js":"...","css":"..."}
```

> Note: MCP payload may truncate later XFs on this page (Ian Provo, Jacob Wester, guides).  
> Re-fetch or list sibling XFs under `/content/experience-fragments/wknd/language-masters/en/contributors/` if cards look incomplete.

---

## Agent wiring (implemented)

1. Run start passes `authorUrl` into the orchestrator (`apps/api` + worker).
2. `captureReferencePage` tries **Adobe Content MCP** (`search-aem-pages` → `get-aem-page-content`) when `AEM_MCP_ACCESS_TOKEN` (or bearer) is available.
3. Falls back to JCR `.infinity.json` if MCP fails.
4. Flatten; **drop** `*/components/page`, `*/components/container`, `cq:responsive`.
5. Group by EDS target: title→hero, text→columns, experiencefragment→cards.
6. One LLM call per group with MCP-shaped prompts (`formatMcpComponentsForPrompt`).
7. Do **not** send HTML scrape when MCP/JCR structured content is present.

Set `AEM_MCP_ACCESS_TOKEN` to the OAuth token from Cursor’s connected `aem-cloud` MCP session for best results (service-account IMS often cannot call Adobe MCP OAuth).

---

## Run context

| Field | Value |
|-------|--------|
| Status | WAITING_APPROVAL |
| PR | https://github.com/Shaik-Tajuddin/wknd-eds/pull/12 |
| Preview | https://aeds-run-f2e42fab-f9ad-432b-987f-9b99fcb09a15--wknd-eds--shaik-tajuddin.aem.live/ |
| Destination EDS page (separate) | `/content/wknd-eds/test/about-us` (`sourceType: AEM_EDGE`) |
