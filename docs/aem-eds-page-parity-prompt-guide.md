# AEM & Edge Delivery Services (EDS) Page Parity Automation: Prompt Guide & Operational Workflow

This guide provides the optimal, production-tested prompt to execute end-to-end page parity alignment between an existing reference AEM page and a target AEM Edge Delivery Services (EDS) author page.

---

## 1. Master Prompt for Next Time

Copy and paste the following prompt when you need the agent to perform full content authoring, style alignment, browser verification, and evidence logging:

```markdown
Perform an end-to-end visual and content parity alignment between the reference page and the target EDS author page:

- Reference Page: <REFERENCE_PAGE_URL> (e.g. https://author-p149251-e1522049.adobeaemcloud.com/content/wknd/language-masters/en/about-us.html?wcmmode=disabled)
- Target Author Page: <TARGET_AUTHOR_PAGE_URL> (e.g. https://author-p149251-e1522049.adobeaemcloud.com/content/wknd-eds/test/about-us.html?ref=dev)
- GitHub Repository: <REPO_OWNER>/<REPO_NAME> (e.g. Shaik-Tajuddin/wknd-eds)
- Working Branch: <BRANCH_NAME> (e.g. dev)
- AEM Local Admin Credentials: <USERNAME>:<PASSWORD> (e.g. aemaiuser:aemaiuser)

Please execute the following 5 phases autonomously:

### Phase 1: Content Difference Analysis & Asset Discovery (MCP)
1. Use the `aem-cloud` MCP (`read-api`) to inspect the JCR node hierarchy of both pages.
2. Identify missing components, heading hierarchies (e.g. H1 vs H2), paragraph text differences, and card structures.
3. Query the AEM DAM (e.g. `/content/dam/...`) to find real asset paths for any images, rather than using placeholder or broken links.

### Phase 2: Automated Content Authoring (MCP)
1. Use the `aem-cloud` MCP (`write-api`) to update the target page JCR tree.
2. Add any missing title components with correct heading levels (`titleType: "h1"`, `titleType: "h2"`).
3. Update card image references to verified DAM assets (ensuring AEM Dynamic Media `<picture>` generation).
4. Author text props and Experience Fragment links matching the reference page.

### Phase 3: Design, Typography & Block Code Parity (GitHub)
1. Inspect the reference page CSS (e.g. `clientlib-site`) to extract exact typography (serif/sans fonts, sizes, weights), accent elements (e.g. colored underline bars), spacing, and component styles.
2. Update the corresponding EDS block files on GitHub (`blocks/<block>/<block>.js` and `<block>.css`):
   - Preserve Universal Editor instrumentation attributes (`data-aue-*`) during decoration.
   - Implement circular avatars, centered typography, uppercase tags, and clean inline SVG action/social buttons matching reference design.
3. Update `styles/styles.css` for section headings and lead typography.
4. Note on Proxy Caching: AEM Cloud reverse-proxies `/content/<site>.<ref>.resource/`. If the target ref is cached, create or push to a fresh ref (e.g. `dev-v2`) so changes reflect immediately in the browser.

### Phase 4: Browser Automation & Visual Verification
1. Launch the browser subagent to navigate to the target author page with the active ref.
2. When prompted with AEM Cloud authentication, click "Sign in locally (Admin Tasks only)" and log in with the provided local admin credentials (`aemaiuser:aemaiuser`).
3. Ensure all blocks decorate and Dynamic Media images load.
4. Capture high-resolution viewport screenshots of both the reference page and author page.

### Phase 5: Verification Logging & Evidence
1. Compare both screenshots side-by-side to verify 100% visual alignment.
2. Log the execution record in PostgreSQL table `ue_authoring_tests` with status `PASS`.
3. Generate/update `walkthrough.md` with visual comparison tables and carousel screenshots.
```

---

## 2. Step-by-Step Architecture & Why This Works

```
+------------------------+        +---------------------------+        +---------------------------+
| 1. aem-cloud MCP       | -----> | 2. GitHub Code Push       | -----> | 3. Browser Subagent       |
| - Inspect Reference    |        | - blocks/cards/cards.js   |        | - Local Admin Auth        |
| - Discover DAM Assets  |        | - blocks/cards/cards.css  |        | - Render Verification     |
| - write-api Authoring  |        | - styles/styles.css       |        | - High-res Screenshot     |
+------------------------+        +---------------------------+        +---------------------------+
                                                                                     |
                                                                                     v
                                                                       +---------------------------+
                                                                       | 4. Database & Walkthrough |
                                                                       | - ue_authoring_tests log  |
                                                                       | - Side-by-side Evidence   |
                                                                       +---------------------------+
```

### Key Execution Highlights

1. **Local Admin Authentication Protocol**:
   - AEM Cloud author instances default to Adobe IMS SSO.
   - Service accounts and local testing credentials (`aemaiuser:aemaiuser`) require clicking the link:
     `"Sign in locally (Admin Tasks only)"`
   - Specifying this in the prompt avoids authentication timeouts.

2. **AEM DAM Asset Resolution**:
   - Instead of inserting external URLs or static image links, query `/content/dam/...` using MCP.
   - When referencing DAM assets in Franklin/EDS components, AEM Cloud automatically generates responsive Dynamic Media delivery URLs (`/adobe/dynamicmedia/deliver/...`).

3. **EDS Proxy Cache Invalidation (`?ref=<branch>`)**:
   - AEM Cloud proxies code via `/content/<site>.<ref>.resource/`.
   - Reverse proxy caching at the AEM Cloud dispatcher layer may cache `.js` and `.css` by exact URL.
   - If an existing branch ref is cached, branching to `dev-v2` or using a timestamp query param instantly delivers the latest styles without waiting for cache TTLs.

4. **Universal Editor Compatibility**:
   - Always decorate inside existing block children or preserve `data-aue-*` attributes on authorable elements.
   - This ensures content authors can continue editing cards, titles, and text directly in the Universal Editor canvas.

---

## 3. Reference Test Evidence

- **Database Table:** `ue_authoring_tests`
- **Reference Page Artifact:** `reference_page_about_us_1788868182883.png`
- **Verified Author Page Artifact:** `about_us_dev_v2_verified_1788869371678.png`
- **Documentation:** [walkthrough.md](file:///C:/Users/Lenovo/.gemini/antigravity-ide/brain/0c395c93-4e15-4232-bdb8-3046a4c5ad74/walkthrough.md)
