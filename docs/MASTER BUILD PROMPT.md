MASTER BUILD PROMPT
AI EDS Developer — Autonomous AEM Edge Delivery Services Engineering Platform
You are a principal software architect, senior full-stack engineer, AEM Edge Delivery Services expert, AI-agent engineer, DevOps engineer, QA automation engineer, and product designer.
Your task is to design and build a production-ready AI EDS Developer platform from scratch.
This is NOT a chatbot.
This is NOT a simple code generator.
This is an AI engineering platform that autonomously takes an EDS development task from input → analysis → architecture → implementation → Universal Editor authoring → deployment → testing → visual validation → bug fixing → regression testing → quality gate → pull request, while providing complete observable execution through an engineering dashboard.
The system must be modular, secure, testable, extensible, and capable of eventually supporting multiple AEM/EDS projects and multiple LLM providers.

---

1. PRIMARY PRODUCT VISION
   Build:
   «AI EDS Developer — From design to production-ready AEM Edge Delivery Services, autonomously.»
   The user should be able to provide one or more of:

- Figma URL- Figma design- Screenshot- Existing website URL- Existing webpage- Existing AEM page- Existing EDS project- Existing GitHub repository- Natural-language development requirement
  The platform should then:

1. Understand the input.2. Analyze the design/site/project.3. Understand the existing EDS architecture.4. Create an implementation plan.5. Generate EDS blocks/components.6. Generate CSS.7. Generate JavaScript where required.8. Generate Universal Editor models/configuration.9. Generate component definitions and filters where required.10. Author/test content through Universal Editor where supported.11. Create a Git branch.12. Commit changes.13. Build the EDS project.14. Deploy to a preview environment.15. Open the result using Playwright.16. Test functionality.17. Test Universal Editor authoring.18. Capture screenshots.19. Compare implementation against the reference.20. Run accessibility validation.21. Run performance validation.22. Detect failures.23. Diagnose failures.24. Automatically fix them.25. Rebuild.26. Retest.27. Repeat until quality gates pass or configured limits are reached.28. Generate a complete evidence report.29. Create a GitHub Pull Request.30. Require human approval before production deployment by default.
   The fundamental product principle is:
   «The AI does not stop when code is generated. It stops when the implementation has been tested and validated.»

---

2. NON-NEGOTIABLE OBJECTIVES
   Do NOT remove, simplify, mock, or replace these objectives.
   The final architecture MUST support:

- AEM Edge Delivery Services- Universal Editor- GitHub- Figma- Existing websites- Existing EDS projects- AEM Cloud environments- Playwright- Visual regression testing- Accessibility testing- Performance testing- Automated debugging- Automated code fixing- Regression testing- Pull-request generation- Human approval- Multi-LLM support- User-provided LLM API URL- User-provided LLM API key- User-provided model- Project-specific configuration- Agent execution dashboard- Tool-call observability- Code-change observability- Test observability- Visual QA observability- Universal Editor observability- LLM usage/cost observability- Run replay- Run comparison- Audit trail- Security controls- Agent execution limits- RAG/knowledge layer- Extensible tool registry- Production-grade architecture
  Do not implement fake/mock integrations in the production architecture.
  If an external credential is unavailable during development, implement a proper adapter/interface and clearly document the credential requirement.
  Do NOT fabricate successful results.

---

3. IMPORTANT PRODUCT BOUNDARY
   The AI agent itself must NOT live entirely inside AEM.
   Use a hybrid architecture.
   External AI platform
   Responsible for:

- orchestration- LLM interaction- planning- code generation- GitHub operations- Figma analysis- browser automation- testing- visual analysis- debugging- fixing- deployment orchestration- observability- RAG- dashboards
  AEM / EDS
  Responsible for:
- content- authoring- Universal Editor- EDS runtime- page delivery- Adobe/AEM APIs
  Optionally provide an AEM/Universal Editor extension that can invoke the external AI platform.
  The heavy autonomous agent must remain outside AEM.

---

4. HIGH-LEVEL ARCHITECTURE
   Implement this architecture:
                            USER                          |          +---------------+---------------+          | | |        Figma Existing Website AEM          | | |          +---------------+---------------+                          |                          v                 WEB APPLICATION                 Next.js / React                          |                          v                     AI GATEWAY                  Node.js / Fastify                          |                          v                  AGENT ORCHESTRATOR                          |        +-----------------+----------------+        | | |        v v v     GitHub AEM Browser        | | |        v v v    EDS Repo AEM Cloud Playwright        | |        v v   EDS Preview Test / Screenshot        | |        +----------------+-----------------+                         |                         v                 VISUAL VALIDATION                         |                         v                   BUG ANALYSIS                         |                         v                     AI FIXER                         |                         v                     RETEST                         |                    PASS/FAIL                         |                         v                       PR                         |                         v                 HUMAN APPROVAL                         |                         v                    PRODUCTION

---

5. REPOSITORY ARCHITECTURE
   Create the project with a clean monorepo.
   Recommended structure:
   ai-eds-developer/
   apps/  web/    Next.js application
     api/    Fastify API
   packages/  agent/  llm/  tools/  github/  aem/  figma/  browser/  testing/  visual/  rag/  security/  database/  shared/  events/  config/
   workers/  agent-worker/  browser-worker/  build-worker/  test-worker/
   database/  migrations/  seeds/
   docker/  postgres/  redis/  playwright/
   docs/
   tests/
   scripts/
   .github/
   docker-compose.yml
   package.json
   README.md
   Use TypeScript throughout the platform.
   The actual customer EDS project must remain a separate Git repository.

---

6. CUSTOMER EDS PROJECT
   The AI must work against an existing or newly created EDS project.
   Typical structure:
   customer-eds-project/
   blocks/  hero/    hero.js    hero.css    \_hero.json
     cards/    cards.js    cards.css    \_cards.json
   scripts/styles/icons/tools/
   component-definition.jsoncomponent-models.jsoncomponent-filters.json
   The AI must NEVER blindly overwrite an existing project.
   Before making changes:
1. Clone repository.2. Detect project structure.3. Detect existing blocks.4. Detect coding conventions.5. Detect design-system patterns.6. Detect component models.7. Detect component definitions.8. Detect existing utilities.9. Detect existing tests.10. Detect build configuration.11. Build a project understanding model.
   Existing project conventions should have priority over generic model knowledge.
   Priority:
   Existing Project Convention        >Project Design System        >AEM/EDS Best Practices        >Generic LLM Knowledge

---

7. SUPPORTED INPUT SOURCES
   Implement adapters for:
   Figma
   Support:

- file URL- node selection- frames- components- images- typography- colors- spacing- layout- responsive hints
  Create a normalized Design IR.
  Do NOT send raw Figma JSON directly to every agent.

---

Existing Website
Given:
https://example.com/page
Use Playwright/browser tooling to collect:

- HTML- DOM- CSS- JS behavior- screenshots- typography- colors- spacing- layout- responsive states- links- forms- images- accessibility information- network activity- console errors
  Respect robots, authentication, authorization, and legal constraints.
  Do not attempt to bypass authentication or access controls.

---

Screenshot
Analyze:

- sections- blocks- hierarchy- spacing- colors- typography- images- responsive structure when multiple screenshots exist
  Clearly identify uncertainty.

---

Existing AEM Page
Use supported AEM APIs and authenticated access.
Extract:

- page structure- components- content- properties- models- references
  Do not use undocumented APIs when supported APIs are available.

---

8. DESIGN IR
   Create an internal representation:
   interface DesignIR {  source: DesignSource;  pages: PageIR[];  designTokens: DesignTokens;  components: ComponentIR[];  assets: AssetIR[];  responsiveRules: ResponsiveRule[];  interactions: InteractionIR[];}
   Example:
   interface ComponentIR {  id: string;  name: string;  type: string;  hierarchy: string[];  dimensions: Dimensions;  spacing: Spacing;  typography: Typography;  colors: Colors;  assets: string[];  behavior: Behavior[];}
   The Design IR becomes the contract between design analysis and implementation.

---

9. AGENT ARCHITECTURE
   Do NOT create one giant autonomous prompt.
   Implement a specialized-agent architecture.
   Agents:
   Project AnalyzerDesign AnalyzerArchitecture AgentEDS Developer AgentUniversal Editor AgentContent AgentBrowser AgentQA AgentVisual AgentAccessibility AgentPerformance AgentDebug AgentFix AgentDeployment Agent
   All agents communicate through structured state.

---

10. AGENT ORCHESTRATOR
    Implement a deterministic state machine.
    Example:
    RECEIVED  ↓ANALYZING  ↓PLANNING  ↓IMPLEMENTING  ↓BUILDING  ↓DEPLOYING_PREVIEW  ↓UE_AUTHORING  ↓FUNCTIONAL_TESTING  ↓VISUAL_VALIDATION  ↓ACCESSIBILITY  ↓PERFORMANCE  ↓DIAGNOSING  ↓FIXING  ↓REGRESSION_TESTING  ↓QUALITY_GATE  ↓PR_CREATED  ↓WAITING_APPROVAL  ↓DEPLOYED
    Every transition must be observable.

---

11. PROJECT STATE
    Create a strongly typed project state:
    interface ProjectState {  project: ProjectStateData;  source: SourceState;  design: DesignState;  eds: EDSState;  github: GitHubState;  aem: AEMState;  universalEditor: UEState;  implementation: ImplementationState;  tests: TestState;  visual: VisualState;  accessibility: AccessibilityState;  performance: PerformanceState;  bugs: BugState[];  fixes: FixState[];  deployment: DeploymentState;  qualityGate: QualityGateState;}
    Persist state.
    The agent must be resumable.
    If the process crashes, it should resume from the last valid checkpoint.

---

12. TOOL REGISTRY
    Implement a secure tool registry.
    Example:
    GitHub  cloneRepo  readFile  writeFile  searchCode  searchFiles  createBranch  commit  createPR  getPR  mergePR
    Figma  getFile  getNodes  getImages
    AEM  getPage  getContent  createPage  updatePage  publish
    Browser  navigate  click  type  select  screenshot  inspectDOM  console  network
    Testing  build  lint  typecheck  unit  e2e  accessibility  lighthouse  visualCompare
    LLMs MUST NOT directly execute arbitrary shell commands.
    LLMs request tools.
    A policy engine validates the tool request.
    The tool executes.
    The result returns to the agent.

---

13. TOOL SECURITY
    Every tool call must pass:
    LLM request    ↓Tool schema validation    ↓Authorization    ↓Project scope validation    ↓Risk policy    ↓Execution    ↓Sanitized result
    Implement:

- allowlists- project isolation- command restrictions- path restrictions- timeout- rate limits- maximum output size- secret redaction- audit logging
  Never allow an agent to access arbitrary host filesystem paths.

---

14. LLM PROVIDER SYSTEM
    Implement a provider abstraction.
    Support:
    OpenAI-compatibleAnthropicGoogle GeminiAzure OpenAIOllamaCustom OpenAI-compatible endpoint
    Minimum configuration:
    ProviderAPI URLAPI KeyModelEmbedding Model
    The user should be able to provide:
    LLM API URLLLM API KeyModel
    The API key MUST:

- never be sent to browser code- never be committed to Git- never appear in logs- never appear in event payloads- never appear in screenshots- never appear in LLM prompts unnecessarily
  Store secrets using a secure secret-management abstraction.

---

15. LLM GATEWAY
    Create:
    LLMGateway
    Responsibilities:

- provider selection- authentication- retries- timeout- rate limits- structured output- token tracking- latency tracking- cost estimation- model fallback- request IDs- tracing
  Record:
  interface LLMCall {  id: string;  runId: string;  provider: string;  model: string;  timestamp: string;  inputTokens?: number;  outputTokens?: number;  latencyMs: number;  status: string;  estimatedCost?: number;}
  Never persist raw secrets.

---

16. AGENT LIMITS
    Make limits configurable:
    MAX_AGENT_RUNTIME = 30 minutesMAX_FIX_ITERATIONS = 5MAX_TOOL_CALLS = 250MAX_LLM_CALLS = 100MAX_ESTIMATED_COST = configurable
    If any limit is reached:
    STOP↓SAVE STATE↓GENERATE DIAGNOSTIC REPORT↓REQUEST HUMAN INTERVENTION
    Never allow infinite loops.

---

17. EDS IMPLEMENTATION ENGINE
    The EDS Developer Agent must understand:

- blocks- sections- semantic HTML- block JSON- block CSS- block JS- component definitions- component models- component filters- decoration- authoring patterns- responsive behavior- accessibility- performance
  For every block determine:
  HTML structureCSSJSUE modelComponent definitionComponent filterAuthoring behaviorTests
  Generated code must follow existing repository conventions.

---

18. UNIVERSAL EDITOR
    Implement Universal Editor support.
    The platform must be able to:
1. Identify UE-enabled pages.2. Open the page.3. Identify editable components.4. Add content.5. Edit fields.6. Save content.7. Reopen page.8. Verify persisted values.9. Verify block rendering.10. Verify links/images/text.11. Verify required authoring behavior.
   Do NOT assume visual rendering means authoring works.
   Test both:
   Authoring correctness+Rendered correctness

---

19. AUTOMATED CONTENT AUTHORING
    Create structured content based on:

- Figma- source website- provided content- project configuration
  Do not invent production business data unless explicitly requested.
  Mark generated test content as test content.

---

19b. PREVIEW PIPELINE & EXECUTION MECHANICS
    The platform must support deterministic rendering of EDS blocks for browser validation:
    1. AEM Cloud Preview (Online):
       - Trigger sidekick preview or AEM live preview endpoints for branch-associated preview hosts (`https://<branch>--<repo>--<owner>.hlx.page` / `.aem.page`).
    2. Local Simulated EDS Preview (Offline / Zero-Cost Dev Mode):
       - Standalone preview server (using Node.js / Express static EDS simulation or `aem up` CLI tooling) that serves scripts/styles/blocks with synthetic Markdown/HTML DOM decoration.
       - Guarantees end-to-end browser and visual validation without mandatory external cloud preview provisioning during early development slices.

---

20. BROWSER AUTOMATION
    Use Playwright.
    Capture:

- screenshot- DOM- console logs- JavaScript errors- network failures- HTTP responses- page performance- accessibility tree where applicable
  Support:
  desktoptabletmobile
  Use configurable viewport profiles.

---

21. FUNCTIONAL TESTING
    Automatically generate tests from the implementation.
    Test:

- navigation- buttons- links- forms- accordions- carousels- tabs- menus- modals- images- responsive behavior- dynamic interactions- error states where applicable
  Never mark a test as passed simply because the page loaded.

---

22. VISUAL VALIDATION
    This is a core feature.
    Input:
    REFERENCEvsIMPLEMENTATION
    Reference can come from:

- Figma- screenshot- existing website screenshot
  Implementation:
- EDS preview screenshot
  Use BOTH:

1. deterministic screenshot comparison2. vision-based analysis
   Example:
   Reference    ↓Screenshot    ↓Pixel / perceptual diff    +Vision analysis    ↓Mismatch report
   Output:
   interface VisualValidationResult {  score: number;  passed: boolean;  differences: VisualDifference[];}

   Visual Thresholds & Tolerance Policy:
   - Global default threshold: 95% similarity
   - Per-block customizable thresholds (e.g., dynamic carousels/video heroes: 90%; static text/cards: 98%)
   - Configurable mask zones for dynamic or third-party content (ads, live feeds, timestamps)
   - Maximum visual fix budget: bounded LLM visual repair calls (default 5 iterations) to prevent infinite loops chasing anti-aliasing variances

   Example:
   Visual Score: 87.4%
   Problems:- Hero 42px too tall- CTA 18px too far right- Heading font weight incorrect- Mobile image ratio incorrect

---

23. VISUAL FIX LOOP
    Implement:
    Visual validation       ↓Mismatch detected       ↓Debug Agent       ↓Fix Agent       ↓CSS/JS change       ↓Build       ↓Render       ↓Screenshot       ↓Compare again
    Store every iteration.
    Example:
    Iteration 1 → 87.4 FAILIteration 2 → 93.1 FAILIteration 3 → 97.8 PASS
    Never overwrite historical evidence.

---

24. ACCESSIBILITY
    Use axe-core or equivalent.
    Validate:

- WCAG 2.1 / 2.2 AA issues- semantic HTML- headings- labels- buttons- links- keyboard access- color contrast- images- focus behavior- ARIA usage
  Record & Quality Gate Rule:
  - Critical issues: 0 allowed (blocking)
  - Serious issues: 0 allowed (blocking)
  - Moderate / Minor: Threshold based or configurable warnings
  - Accessibility Score calculation: 100 - (critical * 25 + serious * 10 + moderate * 5 + minor * 1) normalized to 0-100.
  Do not allow critical or serious accessibility failures through the default quality gate.

---

25. PERFORMANCE
    Use Lighthouse or equivalent.
    Measure:

- performance- accessibility- best practices- SEO where relevant- Core Web Vitals where available- image optimization- JS size- CSS size- network requests
  Make thresholds configurable.

---

26. AI DEBUGGING
    When something fails, the agent must correlate evidence.
    Example:
    Test failure+Console error+Network error+DOM+Source code+Git diff
    Then produce:
    ProblemRoot causeEvidenceAffected fileProposed fixRiskExpected result
    Example:
    BUG-21
    Problem:CTA does not navigate.
    Root cause:Missing link value mapping.
    Evidence:Playwright expected /product but received #.Console shows TypeError.
    Affected:blocks/hero/hero.js
    Fix:Map authored link value before rendering.
    Validation:E2E PASSVisual PASSRegression PASS

---

27. AUTOMATIC FIXING
    Fix Agent must:
1. Read failure evidence.2. Inspect affected code.3. Identify root cause.4. Make minimal change.5. Run relevant tests.6. Run regression tests.7. Compare visual output if relevant.8. Continue only if quality improves.
   Prefer minimal diffs.
   Do not rewrite unrelated files.

---

28. REGRESSION PROTECTION
    Every fix must trigger appropriate regression tests.
    Example:
    Hero CSS fix    ↓Hero tests    ↓Page tests    ↓Visual regression    ↓Accessibility
    A fix that resolves one issue but creates another must be rejected.

---

29. QUALITY GATE & SAFE ROLLBACK
    Default quality gate:
    Build PASS
    Lint PASS
    TypeScript PASS
    Unit PASS
    E2E PASS
    Universal Editor PASS
    Functional PASS
    Visual PASS (Meeting global/block threshold)
    Accessibility PASS (0 critical, 0 serious WCAG violations)
    Performance PASS (Lighthouse Core Web Vitals threshold met)
    No blocking regressions PASS

    Content Cleanup & Safe Rollback:
    - Pre-PR verification MUST remove or isolate synthetic test authoring fixtures and mock documents to prevent test pollution of upstream branches.
    - If Quality Gate or automated fix limits fail, the branch is tagged `ai/failed/*` with a diagnostic report and NOT opened as a clean PR.
    - On manual rejection or cancellation, automated rollback cleans temporary git branches and reverts any staging AEM test pages created during verification.

    Only after all required gates pass:
    READY_FOR_PR
    Production deployment requires human approval by default.

---

30. GITHUB WORKFLOW
    The AI must:
    Clone ↓Analyze ↓Create branch ↓Modify ↓Commit ↓Build ↓Test ↓Fix ↓Validate ↓Create PR
    Branch format:
    ai/<project>/<task>
    PR must contain:
    SummaryChangesFiles changedTestsVisual QAAccessibilityPerformanceUniversal Editor validationFix iterationsKnown limitationsAI run IDEvidence links

---

31. DASHBOARD
    The dashboard is a CORE PRODUCT FEATURE.
    It is the AI Engineering Control Center.
    The user must be able to understand:
1. What AI is doing.2. What it has done.3. What it changed.4. What failed.5. How it fixed it.6. Whether validation passed.7. What happens next.
   Do NOT expose private chain-of-thought.
   Show:

- structured intent- plan- decisions summaries- tool calls- results- code changes- tests- validation- errors- fixes
  Clearly distinguish:
  AI CLAIMvsSYSTEM EVIDENCE

---

32. DASHBOARD NAVIGATION
    Implement:
    Overview
    Projects
    Agent Runs
    AI Activity
    Tool Calls
    Code Changes
    Tests
    Visual QA
    Universal Editor
    Bugs & Fixes
    Deployments
    LLM Usage
    Knowledge / RAG
    Settings

---

33. HOME PAGE
    Home page must answer within five seconds:

- What projects exist?- What is AI doing?- What completed?- What failed?- What needs attention?- How do I start work?
  Header:
  AI EDS Developer + New Project
  Hero:
  Build production-ready EDS experiences with AI.
  From Figma or an existing website to EDS blocks,Universal Editor authoring, automated testing,visual validation, bug fixing, and deployment.
  Actions:

* New ProjectView Recent Runs

---

34. HOME KPIs
    Show:
    Active RunsProjectsSuccess RateOpen IssuesAverage Fix IterationsAverage Run Time

---

35. ACTIVE RUN CARD
    Example:
    Product Page Reconstruction
    ● RUNNING
    Project: Product WebsiteSource: FigmaCurrent stage: Visual ValidationProgress: 78%Iteration: 3 / 5Tests: 128 / 128Visual: 97.8%
    [Open Run]

---

36. PROJECT HEALTH
    Example:
    Product Website
    ● Healthy
    EDS ✓AEM ✓Universal Editor ✓Tests 128/128Visual 97.8%
    Last run: 8 minutes ago
    [Open Project]

---

37. RECENT ACTIVITY
    Show a real event timeline:
    09:42 AI fixed visual mismatch09:38 Visual validation passed 97.8%09:35 Universal Editor authoring passed09:31 128 browser tests completed09:28 Hero block generated09:25 Figma analysis completed

---

38. ATTENTION REQUIRED
    Prioritize failures.
    Example:
    Product CardAccessibility failed2 issues
    Checkout PageBuild failedhero.js line 42
    Corporate SiteVisual score below threshold89.2%
    Actions:
    InvestigateOpen RunLet AI Fix

---

39. RUN DETAIL PAGE
    Example:
    RUN #RUN-000142
    Product Page → Figma → EDS
    STATUS: RUNNING
    StartedDurationProjectBranchModel
    Workflow:
    ✓ Analyze✓ Plan✓ Implement✓ Build✓ UE Author◉ Browser Test○ Visual QA○ Accessibility○ Performance○ Fix○ PR
    Current step:
    Browser Test
    Tool: PlaywrightAction: Opening Universal Editor

---

40. AI ACTIVITY
    Show structured events.
    Example:
    PLANNER
    Goal:Create Hero block matching Figma.
    Plan:1. Analyze design2. Check existing blocks3. Reuse project patterns4. Create Hero model5. Generate CSS6. Generate JS7. Test
    Then:
    TOOL CALL
    github.searchCode
    Query:hero component
    Result:3 existing patterns found
    SUCCESS
    Then decision summary:
    Decision:
    Reuse existing image handling patternfrom blocks/banner.
    Reason:Existing project convention matchesrequired asset behavior.
    Never expose hidden reasoning or private chain-of-thought.

---

41. TOOL CALLS PAGE
    Display:
    TimeToolStatusDuration
    Examples:
    figma.getFile SUCCESSgithub.search SUCCESSgithub.readFile SUCCESSgithub.writeFile SUCCESSbuild SUCCESSbrowser.open SUCCESSbrowser.click SUCCESSscreenshot SUCCESSvisual.compare FAIL
    Clicking an event shows safe input/output.
    Secrets must be redacted.

---

42. CODE CHANGES PAGE
    Show:
    34 files changed
    Example:
    blocks/hero/hero.jsblocks/hero/hero.cssblocks/hero/\_hero.jsoncomponent-models.jsoncomponent-definition.json
    Provide:

- diff viewer- file navigation- change reason- validation result
  Example:
  REASON
  Visual validation detected hero62px taller than reference.
  Agent identified:- excessive padding- incorrect image aspect ratio
  Changed:- padding- image height- object-fit
  Before: 87.4%After: 96.8%
  Regression: PASS

---

43. VISUAL QA PAGE
    Display:
    REFERENCE IMPLEMENTATION-----------------------------------------image image
    Metrics:
    Similarity: 97.8%Threshold: 95%Status: PASS
    Differences:
    Hero heightCTA alignmentTypographyImage ratio
    Iteration history:
    Iteration 1 87.4 FAILIteration 2 93.1 FAILIteration 3 97.8 PASS

---

44. UNIVERSAL EDITOR DASHBOARD
    Show:
    Page: Product PageStatus: PASSBlocks tested: 11Fields tested: 47
    Example:
    Hero✓ Add✓ Edit✓ Save✓ Reopen
    Product Grid✓ Add✓ Edit✓ Save
    CTA✓ Edit✓ Navigation

---

45. TEST DASHBOARD
    Show:
    Build PASSLint PASSTypeScript PASSUnit PASSE2E PASSUE PASSAccessibility PASSVisual PASSPerformance PASS
    128 / 128
    Allow drill-down.

---

46. BUG DASHBOARD
    Example:
    BUG-21 Critical JS FixedBUG-22 Medium Visual FixedBUG-23 Low A11y Open
    Each bug should contain:
    DescriptionSeveritySourceEvidenceRoot causeAffected filesFixValidationIteration

---

47. LLM USAGE DASHBOARD
    Track:
    ProviderModelRequestsInput tokensOutput tokensLatencyFailuresRetriesEstimated cost
    Example:
    OpenAI1243 requests3.2M input1.1M output
    Claude421 requests1.1M input420K output
    Ollama812 requests
    Also:
    Total requestsAverage latencyFailed requestsRetriesEstimated cost
    Never display API keys.

---

48. REAL-TIME EVENT SYSTEM
    Implement:
    Agent Worker      ↓Event Bus      ↓PostgreSQL/event store      ↓SSE/WebSocket      ↓Dashboard
    Events:
    agent.startedagent.step.startedagent.step.completed
    llm.requestllm.completedllm.failed
    tool.startedtool.completedtool.failed
    file.changed
    build.startedbuild.completedbuild.failed
    test.startedtest.completedtest.failed
    visual.startedvisual.completedvisual.failed
    ue.authoring.startedue.authoring.completedue.authoring.failed
    fix.startedfix.completed
    deployment.starteddeployment.completeddeployment.failed
    agent.completedagent.failed
    Canonical event:
    interface AgentEvent {  id: string;  runId: string;  timestamp: string;  type: AgentEventType;  actor: "agent" | "tool" | "system" | "user";  step: string;  status: "started" | "completed" | "failed";  data: Record<string, unknown>;}

---

49. DATABASE
    Use PostgreSQL.
    Tables:
    usersprojectsrepositoriesenvironments
    agent_runsagent_stepsagent_events
    tool_callsllm_calls
    project_conventions
    design_sourcesdesign_artifactsblocks
    file_changesbuildstest_runs
    visual_runsvisual_differencesaccessibility_runsperformance_runs
    bugsfix_attempts
    pull_requestsdeployments
    knowledge_documentsknowledge_chunks
    Use proper foreign keys and indexes.

---

50. RUN REPLAY
    Allow a completed run to be replayed.
    Replay should use:
    same projectsame sourcesame branch configurationsame agent configurationsame test configuration
    Do not automatically overwrite production.
    Create a new run.

---

51. RUN COMPARISON
    Allow comparison:
    Run AvsRun B
    Compare:

- LLM calls- tool calls- runtime- tests- visual score- fixes- regressions- human intervention- token usage- estimated cost

---

52. AGENT METRICS
    Track:
    Success rateFirst-pass success rateAverage fix iterationsAverage runtimeAverage LLM callsAverage tool callsVisual accuracyTest pass rateHuman intervention rate

---

53. RAG / KNOWLEDGE SYSTEM
    Implement a knowledge layer.
    Sources:

- Adobe AEM documentation- EDS documentation- Universal Editor documentation- project documentation- repository code- architecture documentation- internal engineering standards
  Use:
  PostgreSQL+pgvector
  Initially.
  Knowledge retrieval should provide context to agents.
  Prioritize:
  Current project codeCurrent project documentationApproved engineering standardsOfficial Adobe documentationGeneral knowledge
  Do not blindly trust retrieved content.
  Store document metadata and source references.

---

54. SECURITY
    Implement production security from the beginning.
    Requirements:

- authentication- authorization- project isolation- encrypted secrets- secret redaction- audit logs- CSRF protection where applicable- rate limiting- request validation- output sanitization- SSRF protection- URL allowlisting where appropriate- GitHub permission scopes- AEM permission scopes- secure webhook validation- secure file access- command execution sandboxing
  The browser must never receive:
  LLM API keyGitHub private tokenAEM client secretFigma private token

---

55. MULTI-TENANCY
    Architect the system so multiple projects/users can eventually be supported.
    At minimum:
    User  ↓Project  ↓Repository  ↓Environment  ↓Agent Runs
    Every resource must have proper ownership/project boundaries.

---

56. OBSERVABILITY
    Implement:

- structured logs- metrics- traces- run IDs- correlation IDs- tool-call IDs- LLM request IDs
  Use:
  PinoOpenTelemetry
  Never log secrets.

---

57. ERROR HANDLING
    Every external operation needs:

- timeout- retry policy- exponential backoff- circuit breaker where appropriate- error classification- safe recovery
  Classify errors:
  TRANSIENTAUTHENTICATIONAUTHORIZATIONVALIDATIONCODEBUILDTESTVISUALNETWORKCONFIGURATIONHUMAN_REQUIRED

---

58. HUMAN-IN-THE-LOOP
    Human approval is required for risky actions.
    At minimum:
    Production deploymentPR mergeDestructive changesPermission changesCredential changes
    The user must be able to:
    PauseResumeCancelApproveRejectRetryFix manually

---

59. CONFIGURATION
    Project configuration should include:
    project:  name:  description:
    source:  type:  url:
    github:  repository:  branch:
    aem:  authorUrl:  previewUrl:  environment:
    figma:  fileUrl:
    llm:  provider:  apiUrl:  model:  embeddingModel:
    autonomy:
      level: "execute_validate_fix_pr" # suggest | execute | execute_validate | execute_validate_fix | execute_validate_fix_pr
      requireProductionApproval: true
      requirePRMergeApproval: true
    quality:  visualThreshold: 95  accessibilityThreshold: 95  performanceThreshold: 90  maxFixIterations: 5
    limits:  maxRuntimeMinutes: 30  maxToolCalls: 250  maxLLMCalls: 100  maxEstimatedCost: 10.00
    Secrets must be stored separately from normal configuration.

---

60. UI/UX DESIGN PRINCIPLES
    The product must NOT look like:

- generic chatbot- consumer AI app- flashy neon AI interface- cryptocurrency dashboard- marketing landing page- generic SaaS template
  It should look like:
  «Professional engineering command center for autonomous AI development.»
  Personality:
  ProfessionalPreciseTechnicalCalmTrustworthyObservableModernFocused

---

61. VISUAL DIRECTION
    Use:

- clean high-density engineering UI- strong typography- large content areas- subtle borders- minimal shadows- minimal decoration- clear hierarchy- readable logs- compact status indicators
  Semantic status colors:
  PASS GreenWARNING YellowFAIL RedACTIVE BlueAI Purple
  Color must communicate state, not decoration.
  Typography:
  Inter
  Use:
  JetBrains Mono
  for:
- code- logs- tool calls- IDs- technical values
  Status symbols:
  ● Running✓ Passed✕ Failed Warning○ Waiting Paused

---

62. NEW PROJECT FLOW
    Build a guided wizard.
    Step 1:
    Project nameDescription
    Step 2:
    Source
    FigmaExisting WebsiteExisting AEM PageExisting EDS Project
    Step 3:
    GitHub RepositoryBranch
    Step 4:
    AEM AuthorAEM PreviewEnvironment
    Step 5:
    LLM ProviderAPI URLAPI KeyModel
    Step 6:
    Visual thresholdAccessibility thresholdPerformance thresholdMaximum fix iterationsExecution limits
    Step 7:
    Analyze Project
    Validate connections before starting the run.

---

63. FREE / LOCAL DEVELOPMENT
    The system must support a zero/low-cost development mode.
    Use open-source software wherever practical:
    Next.jsReactNode.jsFastifyPostgreSQLpgvectorRedisBullMQPlaywrightVitestaxe-coreLighthouseDockerOllamaGitHub
    Ollama should allow local models.
    Do not design the architecture around a specific provider's free tier because pricing and limits can change.

---

64. API DESIGN
    Create REST APIs for:
    /auth (login, session, api-tokens)
    /projects
    /projects/:id
    /runs
    /runs/:id
    /runs/:id/pause
    /runs/:id/resume
    /runs/:id/cancel
    /runs/:id/replay
    /runs/:id/approve-deployment
    /runs/:id/trigger-fix
    /runs/:id/events
    /runs/:id/tool-calls
    /runs/:id/llm-calls
    /runs/:id/files
    /runs/:id/tests
    /runs/:id/visual
    /runs/:id/bugs
    /github
    /aem
    /figma
    /quality-gates
    /usage
    /knowledge
    /settings
    Use OpenAPI documentation.
    Validate every request using schemas.

---

65. FRONTEND ARCHITECTURE
    Use:
    Next.jsReactTypeScriptTailwind
    Use a component system.
    Pages:
    /dashboard/projects/projects/[id]/runs/runs/[id]/activity/tools/code/tests/visual/universal-editor/bugs/deployments/usage/knowledge/settings
    Use server-side authentication and secure API access.

---

66. DASHBOARD REAL-TIME BEHAVIOR
    When an agent runs:
    The dashboard must update live.
    Example:
    Analyze ✓Plan ✓Implement ✓Build ✓UE Author ✓Browser Test ◉Visual QA ○
    When Playwright runs:
    Browser Test128 tests127 passed1 failed
    When AI fixes:
    Fix Attempt #1Diagnosis completehero.js modifiedBuild started
    When validation finishes:
    Visual97.8% PASS
    No page refresh should be required.

---

67. EVIDENCE-FIRST DESIGN
    Every claim must have evidence where possible.
    Example:
    Bad:
    AI: "The implementation is correct."
    Good:
    Build PASS128/128 tests PASSVisual 97.8%Accessibility PASSPerformance 94UE authoring PASS
    The dashboard should make evidence easy to inspect.

---

68. AUDITABILITY
    Every important action must be traceable:
    WhoWhatWhenWhy/decision summaryToolInputResultFiles changedValidationOutcome
    Do not expose private model chain-of-thought.
    Store concise structured decision summaries instead.

---

69. TESTING STRATEGY
    Write tests for the platform itself.
    Required:
    Unit testsIntegration testsAPI testsAgent state-machine testsTool registry testsSecurity testsLLM adapter testsGitHub adapter testsAEM adapter testsFigma adapter testsPlaywright testsVisual testsEnd-to-end platform tests
    The platform must have automated CI.

---

70. CI/CD
    GitHub Actions should perform:
    InstallLintTypecheckUnit TestsIntegration TestsBuildSecurity ChecksDocker Build
    The customer EDS repository should have its own build/test pipeline.

---

71. DOCUMENTATION
    Create comprehensive documentation.
    Required files:
    README.md
    docs/  product-vision.md  architecture.md  agent-architecture.md  agent-contract.md  tool-contract.md  api.md  database.md  security.md  testing-strategy.md  visual-validation.md  universal-editor.md  aem-integration.md  github-integration.md  figma-integration.md  rag.md  deployment.md  local-development.md  troubleshooting.md  contributing.md
    README must contain:

- product overview- architecture- prerequisites- installation- environment variables- database setup- Redis setup- Docker setup- Ollama setup- GitHub configuration- Figma configuration- AEM configuration- LLM configuration- running frontend- running backend- running workers- running tests- running Playwright- deployment- troubleshooting- security- limitations- roadmap

---

72. ENVIRONMENT VARIABLES
    Create:
    .env.example
    Never include real credentials.
    Document:
    DATABASE_URLREDIS_URL
    GITHUB_CLIENT_IDGITHUB_CLIENT_SECRETGITHUB_TOKEN
    FIGMA_TOKEN
    AEM_CLIENT_IDAEM_CLIENT_SECRETAEM_ORGANIZATION_IDAEM_TECHNICAL_ACCOUNT_ID
    LLM_PROVIDERLLM_API_URLLLM_API_KEYLLM_MODEL
    S3_ENDPOINTS3_BUCKETS3_ACCESS_KEYS3_SECRET_KEY
    NEXT_PUBLIC_API_URL
    Use environment-specific secret management.

---

73. DEVELOPMENT ORDER
    Do NOT attempt to build everything randomly.
    Implement in vertical slices.
    Phase 0 — Foundation
    Build:

- monorepo- frontend- API- PostgreSQL- Redis- authentication foundation- configuration- logging- Docker- CI

---

Phase 1 — Project Management
Build:

- project creation- project configuration- repository configuration- environment configuration- LLM configuration- connection validation

---

Phase 2 — GitHub Integration
Implement:

- clone- branch- read- search- write- commit- PR

---

Phase 3 — EDS Analyzer
Implement:

- repository analysis- block detection- model detection- definition detection- existing pattern detection- project architecture report

---

Phase 4 — Agent Orchestrator
Implement:

- state machine- agent registry- tool registry- checkpoints- execution limits- event system

---

Phase 5 — Figma / Website Analyzer
Implement:

- Figma adapter- browser crawler- screenshot capture- Design IR

---

Phase 6 — EDS Code Generator
Start with ONE block.
Flow:
Figma / URL ↓Analyze ↓Design IR ↓Architecture ↓Generate Hero ↓GitHub branch ↓Build
Do not jump to complex multi-page generation before the vertical slice works.

---

Phase 7 — Preview
Implement:
Build ↓Preview ↓Browser

---

Phase 8 — Playwright
Implement:

- browser- interaction- screenshots- console- network- functional tests

---

Phase 9 — Visual QA
Implement:

- screenshot diff- visual scoring- mismatch detection- visual dashboard

---

Phase 10 — AI Fix Loop
Implement:
failure ↓diagnosis ↓fix ↓build ↓test ↓visual ↓regression

---

Phase 11 — Universal Editor
Implement:

- UE detection- authoring- save- reopen- validation

---

Phase 12 — Accessibility + Performance
Implement:

- axe- Lighthouse- quality gates

---

Phase 13 — PR / Deployment
Implement:

- quality gate- evidence report- PR generation- human approval- deployment

---

Phase 14 — Dashboard Completion
Implement all dashboard views:
OverviewProjectsRunsActivityToolsCodeTestsVisualUEBugsDeploymentsUsageKnowledgeSettings

---

Phase 15 — RAG
Implement:

- ingestion- chunking- embeddings- pgvector- retrieval- source attribution

---

74. FIRST MVP VERTICAL SLICE
    Before building every feature, make this work end-to-end:
    Figma / Existing URL        ↓AI analysis        ↓Generate ONE EDS block        ↓GitHub branch        ↓Build        ↓Preview        ↓Playwright        ↓Screenshot        ↓Visual comparison        ↓AI CSS/JS fix        ↓Rebuild        ↓Retest        ↓PASS        ↓Dashboard evidence
    This vertical slice is the most important milestone.

---

75. DO NOT MOCK THE CORE SYSTEM
    Do NOT create fake:
    LLM resultsGitHub commitsAEM responsesFigma dataPlaywright resultsvisual scorestest resultsdeployment status
    For unavailable external services:

- fail clearly- provide setup instructions- expose a proper adapter- provide deterministic unit-test fixtures only inside tests
  The application must distinguish:
  REALSIMULATED TEST FIXTUREUNAVAILABLEFAILED
  Never represent simulated data as real.

---

76. ACCEPTANCE CRITERIA
    The product is considered MVP-complete only when:
    Project

- [ ] Project can be created.- [ ] GitHub repository can be connected.- [ ] AEM environment can be configured.- [ ] Figma source can be configured.- [ ] LLM provider can be configured.
      AI
- [ ] Agent orchestrator works.- [ ] Agent state persists.- [ ] Agent can resume.- [ ] Agent limits work.- [ ] Tool registry works.- [ ] LLM gateway works.
      EDS
- [ ] Existing EDS project can be analyzed.
- [ ] Existing patterns and design tokens are detected and saved to project conventions.
- [ ] AI reuses an existing block/pattern instead of generating a duplicate when available.
- [ ] One block can be generated.
- [ ] CSS can be generated.
- [ ] JS can be generated.
- [ ] UE model/config can be generated where required.
      GitHub
- [ ] Branch created.- [ ] Files modified.- [ ] Commit created.- [ ] PR created.
      Browser
- [ ] Preview opens.- [ ] Playwright runs.- [ ] Screenshots captured.- [ ] Console captured.- [ ] Network captured.- [ ] Functional tests run.
      Visual
- [ ] Reference captured.- [ ] Implementation captured.- [ ] Visual comparison works.- [ ] Score generated.- [ ] Differences identified.- [ ] AI can fix visual issues.- [ ] Regression comparison works.
      UE
- [ ] UE page can be opened.- [ ] Authoring actions can be tested.- [ ] Save/reopen can be verified.
      QA
- [ ] Build validation.- [ ] Unit tests.- [ ] E2E.- [ ] Accessibility.- [ ] Performance.- [ ] Quality gate.
      Dashboard
- [ ] Live agent activity.- [ ] Tool calls.- [ ] LLM calls.- [ ] Code changes.- [ ] Tests.- [ ] Visual QA.- [ ] UE.- [ ] Bugs.- [ ] Fix iterations.- [ ] Deployments.- [ ] Usage.- [ ] Run replay.- [ ] Run comparison.
      Security
- [ ] Secrets protected.- [ ] Secrets redacted.- [ ] Project isolation.- [ ] Tool permissions.- [ ] SSRF protection.- [ ] Audit logging.- [ ] Human approval for production.

---

77. DEFINITION OF DONE
    For any AI-generated implementation, "done" means:
    Code generatedANDBuild passesANDTests passANDUniversal Editor validation passes where applicableANDFunctional validation passesANDVisual threshold passesANDAccessibility threshold passesANDPerformance threshold passesANDNo blocking regressionsANDEvidence storedANDPR created
    Never mark a task complete merely because code generation succeeded.

---

78. IMPLEMENTATION RULES FOR THE CODING AGENT
    You must:
1. Inspect the repository before changing architecture.2. Preserve existing functionality.3. Follow existing project conventions.4. Avoid unnecessary dependencies.5. Prefer open-source technologies.6. Use TypeScript.7. Use strong typing.8. Use schemas for external inputs.9. Implement proper error handling.10. Write tests alongside features.11. Document important architectural decisions.12. Keep modules independently testable.13. Avoid giant files.14. Avoid giant prompts.15. Avoid hard-coded credentials.16. Avoid hard-coded external URLs.17. Avoid fake integrations.18. Avoid infinite agent loops.19. Never expose private chain-of-thought.20. Store structured decision summaries instead.21. Make agent actions observable.22. Make agent actions auditable.23. Make the system resumable.24. Make destructive operations approval-gated.25. Prefer minimal code changes.26. Run tests after every major implementation phase.

---

79. CODING AGENT WORKING METHOD
    Before writing code:
    Step 1 — Inspect
    Analyze:
    repositorypackage.jsonexisting sourceconfigurationtestsDockerCIdocumentation
    Step 2 — Plan
    Create:
    implementation-plan.md
    containing:

- current architecture- target architecture- files to create- files to modify- dependencies- risks- implementation phases- acceptance criteria
  Step 3 — Architecture
  Create/update:
  docs/architecture.mddocs/agent-architecture.mddocs/security.md
  Step 4 — Implement
  Implement in small vertical slices.
  Step 5 — Test
  Run tests after every meaningful change.
  Step 6 — Validate
  Verify:
  buildlinttypechecktestsintegration
  Step 7 — Document
  Update README/docs whenever behavior changes.

---

80. FAILURE HANDLING FOR THE CODING AGENT
    If you encounter:
    missing credentialsmissing external serviceunsupported AEM APIunknown Figma configurationmissing preview environment
    DO NOT invent an implementation result.
    Instead:
    identify dependencyimplement correct abstractiondocument configurationcontinue with independent work
    If a requirement is technically impossible with available APIs:
1. Explain why.2. Identify the supported approach.3. Implement the supported approach.4. Document the limitation.

---

81. ARCHITECTURAL EXTENSIBILITY
    The platform must allow future agents/tools/providers.
    Adding:
    new LLM providernew browser enginenew source typenew testing enginenew deployment providernew knowledge sourcenew AEM APInew Git provider
    must NOT require rewriting the orchestrator.
    Use interfaces/adapters.
    Example:
    interface LLMProvider {}interface SourceAdapter {}interface BrowserAdapter {}interface RepositoryAdapter {}interface DeploymentAdapter {}interface KnowledgeProvider {}

---

82. FUTURE FEATURES — ARCHITECT FOR THEM, DO NOT OVERBUILD NOW
    Keep extension points for:

- multiple AEM organizations- multiple Git providers- Jira integration- Slack notifications- Teams notifications- CI/CD integrations- enterprise SSO- advanced RBAC- multi-agent collaboration- autonomous scheduled jobs- production monitoring- live site monitoring- design-system learning- organization-specific coding standards- reusable agent skills- marketplace/tool plugins
  Do not implement these unless required for MVP.

---

83. FINAL REQUIRED OUTPUT FROM THE CODING AGENT
    After implementation, provide:
1. Architecture summary
   What was builtHow components communicate
1. Repository structure
   Show the final tree.
1. Setup
   Exact commands:
   npm installdocker compose upnpm run dev
   or the correct commands for the implementation.
1. Environment variables
   Document every required variable.
1. External integrations
   Explain:
   GitHubFigmaAEMLLM
1. Agent workflow
   Show the final state machine.
1. Dashboard
   Explain every page.
1. Testing
   Show commands and results.
1. Security
   Explain credential handling and permissions.
1. Known limitations
   Be explicit.
1. Next steps
   Prioritize:
   P0P1P2

---

84. FINAL PRINCIPLE
    Build this as a serious engineering product.
    The system should feel like:
    «An autonomous senior AEM/EDS engineering team with a transparent engineering control center.»
    Not:
    «"Chat with an AI about AEM."»
    The AI must be capable of:
    UNDERSTAND    ↓PLAN    ↓BUILD    ↓AUTHOR    ↓RUN    ↓TEST    ↓COMPARE    ↓DIAGNOSE    ↓FIX    ↓RETEST    ↓VALIDATE    ↓PROVE    ↓PR
    The dashboard must make every meaningful step observable.
    The quality gate must be evidence-based.
    The agent must be bounded and secure.
    The implementation must use real integrations rather than fabricated results.
    The architecture must be production-ready and extensible.
    Do not skip objectives because implementation is complex. Break complex objectives into phases and implement them incrementally while preserving the complete architecture.
