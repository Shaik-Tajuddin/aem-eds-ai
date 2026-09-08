# Master prompt — AEM → EDS page parity (MCP + browser)

Copy the **Ready-to-paste prompt** below into Cursor with **aem-cloud** MCP connected and browser tools available. Fill the COORDINATES block. This prompt encodes hard-won rules from the WKND FAQs authoring chat (accordion model, layout CSS, browser auth gaps).

---

## Ready-to-paste prompt

```markdown
# Mission
Author the destination EDS page to match the reference AEM page using **aem-cloud MCP** + **cursor-ide-browser**. Prefer content-only (no new blocks / no new PR). Use an **existing** branch for `?ref=`. Fix CSS/JS on that branch only when browser comparison shows visual gaps.

## COORDINATES (fill these)
- Reference (prefer publish for browser): https://publish-p149251-e1522049.adobeaemcloud.com/content/wknd/language-masters/en/faqs.html
- Reference author (MCP): https://author-p149251-e1522049.adobeaemcloud.com/content/wknd/language-masters/en/faqs.html?wcmmode=disabled
- Target author path: /content/wknd-eds/test/faqs
- Author host: https://author-p149251-e1522049.adobeaemcloud.com
- Target URL for UE/browser: https://author-p149251-e1522049.adobeaemcloud.com/content/wknd-eds/test/faqs.html?ref=ai-faq
- Code ref: ai-faq
- Repo: Shaik-Tajuddin/wknd-eds (branch: ai-faq)
- Preview CDN: https://ai-faq--wknd-eds--shaik-tajuddin.aem.live/test/faqs
- Project id (optional): 140c77c3-3f70-4292-b7bb-770ca7d383a5
- Experimental pages prefix: /adobe/experimental/aspm-expires-20251231/pages

## Hard rules (do not skip)
1. ALWAYS call `lookup-api-spec` before inventing paths; then use `read-api` / `write-api`.
2. Mutations: GET content → capture ETag → `aem.put(..., etag)` or patch; retry on 412.
3. Classic AEM (`wknd/components/*`) ≠ Franklin tree. **Map** into allowed Franklin types; never PUT classic nodes onto an EDS page.
4. Do **not** start Track A / `POST /api/runs` / open a new PR unless new blocks are truly missing.
5. **Browser compare is mandatory** before declaring done (Phase 5).
6. If author URL hits IMS login in the automation browser: use publish URL for reference; for target use (a) signed-in author tab if user can login, or (b) local preview built from `target.plain.html` + CDN `?ref=` CSS/JS, or (c) publish target if available. Note CDN preview is **stale until page is published**.

## Known mapping pitfalls (from FAQs chat)
### Accordion
- Branch model id is **`accordion`** with fields **`title`** + **`text`** (not `accordion-item`).
- Parent block: `componentType: core/franklin/components/block/v1/block`, `name: Accordion`, `aueComponentId: accordion`. Do **not** put `model: accordion` only on a leaf if you need multiple Q&As — use **items**.
- Each item: `componentType: core/franklin/components/block/v1/block/item`, properties `{ model: "accordion", modelFields: ["title@text","text@richtext"], title, text }`.
- **Do not** set `aueComponentId: "accordion"` on items (empties HTL cells). Match **cards** pattern: items omit block aueComponentId.
- Author `/content/<site>.resource/component-models.json` may lag the branch; trust **live** `https://<ref>--<repo>--<owner>.aem.live/component-models.json` for field names when `?ref=` is used.
- Accordion CSS: uppercase summaries; open-state icon must be a real en-dash `–` / `'\u2013'`, never the literal string `U2013`.

### Layout (WKND FAQs = ~8/12 main + ~3/12 sidebar)
- Reference uses responsiveGrid width 8 + sidebar offset 1 width 3 (“Need more help?”).
- Franklin `columns` **PUT may store** nested title/image/text/accordion but **plain.html often renders empty column cells** for blocks. Prefer:
  - Single section with: h1, image, intro, accordion, h3#need-more-help, help text
  - CSS on branch: `main:has(h1#faqs) .section > div` → `grid-template-columns: 8fr 3fr`; place `#need-more-help` at **grid-row: 2** (beside hero), help paragraph at **grid-row: 3**; yellow underline under `h1#faqs::after`.
- Do not rely on inventing a `style: faqs-layout` option unless it exists in section multiselect; `:has(h1#faqs)` is enough.

### Assets
- Prefer DAM paths (`/content/dam/...`). Confirm with `aem.head` / metadata.
- For browser previews without author auth, resolve a **publish** Dynamic Media / coreimg URL from the reference page.

---

## Phase 0 — Spec & environment
1. `lookup-api-spec`: `spec.capability('page-content')`, recipes `resolve page` / `replace-page-content` / `update page content`.
2. Confirm author URL and that write-api is available (aem-cloud MCP authenticated).

## Phase 1 — read-api discovery & diff
1. Resolve pageIds:
   - `GET {prefix}?authorPath=<encoded path>` → `items[0].id`
2. `GET {prefix}/{pageId}/content` (+ ETag) for reference and target.
3. `GET {prefix}/{targetPageId}/content/definition` for allowed types / placement.
4. Diff: titles, description, image DAM path, FAQ Q&A list, help sidebar, responsive widths.
5. Fetch live branch `component-models.json` / `component-definition.json` / `component-filters.json` for the `?ref=` branch (CDN), not only author `.resource`.

## Phase 2 — write-api author Franklin tree
1. Build one section tree:
   - page props: `jcr:title`, `jcr:description` from reference
   - title h1 (FAQs)
   - image + imageAlt from DAM metadata
   - intro text (richtext)
   - accordion block + N items (title/text)
   - help h3 + contact richtext
2. GET target content → PUT full tree with If-Match ETag.
3. Immediately `GET .../content` and `GET .../faqs.plain.html` and assert:
   - Accordion rows emit **two cells** per item (title + body text visible in HTML)
   - Help heading id `need-more-help` present
   - No empty `<div class="accordion">` shells

## Phase 3 — CSS/JS on existing branch (only if needed)
If plain.html structure is correct but layout ≠ reference:
1. Update `styles/styles.css` on branch `ai-faq` (8/3 grid + h1 underline).
2. Tune `blocks/accordion/accordion.css` (uppercase, +/- icons).
3. Commit to **existing** branch (no new PR unless required). Cache-bust with `?ref=` / query on assets.

## Phase 4 — Optional publish
If Preview CDN must show content: publish target page via documented write-api publish recipe (ask user if publish was not requested). Until published, CDN will show stale/empty shell.

## Phase 5 — Browser compare (mandatory) — use /use-browser
Use `cursor-ide-browser`. Lock tab for multi-step work; unlock when done.

### 5a Reference
1. Navigate to **publish** reference URL (avoid author login wall).
2. Full-page + viewport screenshots: title+yellow rule, hero, intro, accordion (+ icons), **Need more help?** sidebar alignment vs hero.
3. Note grid: main ~2/3, sidebar ~1/3; sidebar top aligns with hero, not under accordion.

### 5b Target
1. Try target author URL with `?ref=<branch>`.
2. If IMS login blocks automation:
   - Prefer user “Sign in with Adobe” / local admin on that tab, **or**
   - Build `scratch/<page>-authored-preview.html` from MCP `plain.html` + absolute publish image URL + CDN styles/accordion CSS/JS; serve locally (`python -m http.server`) and screenshot that.
3. Screenshot same regions as reference.

### 5c Diff checklist (pass/fail)
- [ ] Same H1 text + yellow underline
- [ ] Same hero image subject / DAM asset
- [ ] Same intro paragraph
- [ ] All FAQ questions present; accordion expands/collapses
- [ ] Uppercase question labels + trailing + / –
- [ ] Help sidebar on the **right**, beside hero (not stacked only under page)
- [ ] Contact phone/email present
- [ ] No empty accordion / missing cells

### 5d Iterate
Any FAIL → fix via write-api and/or branch CSS → re-screenshot → update checklist. Stop when all PASS or only acceptable chrome diffs remain (header/footer brand differences between classic WKND and EDS).

## Phase 6 — Report
Return:
1. pageIds + final ETag
2. Tree outline (section → children)
3. CSS commits (sha) if any
4. Browser evidence (URLs + what matched / remaining gaps)
5. Whether CDN publish is still required

## Out of scope unless user asks
- New Track A run / new blocks / new PR
- Changing production publish without confirmation
- Copying classic JCR componentTypes onto Franklin pages
```

---

## Quick coordinates (this project’s FAQs run)

| Key | Value |
|-----|--------|
| Reference pageId | `BM62pSCyXvg0QM479fIZjKFODcw2AcYYP8t6_QiBVHXb5P-XY8L747dKvw1KWqmx` |
| Target pageId | `PadbrgOpn0TaeVD4JjO8GbUxQShpDqVcptU7S-N_zrX4AzzIXt-xreNy83b_iu7skW6wG5hFb7q9TokKw39n-Q` |
| DAM hero | `/content/dam/wknd-shared/en/adventures/climbing-new-zealand/adobestock-277768563.jpeg` |
| Branch | `ai-faq` |

## Related docs

- [aem-eds-page-parity-prompt-guide.md](./aem-eds-page-parity-prompt-guide.md) — Track A vs B overview
- [aem-cloud-mcp-authoring-plan.md](./aem-cloud-mcp-authoring-plan.md) — PUT payload shapes / OAuth
