AI EDS Developer — Product Vision

1. PRIMARY PRODUCT VISION
   Product Name
   AI EDS Developer
   Product Tagline
   «From design to production-ready AEM Edge Delivery Services — autonomously.»
   Vision
   AI EDS Developer is an autonomous AI engineering platform for Adobe Experience Manager Edge Delivery Services (EDS).
   It transforms a design, existing website, screenshot, or AEM page into a working EDS implementation and continuously validates the result through real browser execution, Universal Editor authoring, functional testing, visual comparison, accessibility validation, performance testing, and automated bug fixing.
   The platform is not simply an AI code generator.
   It acts as an AI EDS Developer + QA Engineer + Authoring Assistant + Deployment Assistant.
   Core workflow
   Design / Existing Website / AEM Page                ↓          Analyze                ↓       Understand Design                ↓       Plan EDS Architecture                ↓        Build EDS Blocks                ↓          CSS + JS                ↓    Universal Editor Models                ↓          Author Content                ↓        Deploy Preview                ↓       Browser Testing                ↓       Visual Validation                ↓      Accessibility Testing                ↓       Performance Testing                ↓       Diagnose Problems                ↓          AI Fixes                ↓          Re-test                ↓        Quality Gate                ↓       Pull Request / Approval                ↓           Production
   The core promise
   «The AI does not stop when code is generated. It stops when the implementation has been tested and validated.»

---

2. PRODUCT GOALS
   Primary goals
1. Convert designs into EDS implementations.2. Reconstruct existing websites as EDS implementations.3. Generate reusable EDS blocks.4. Generate HTML, CSS and JavaScript.5. Generate Universal Editor models and definitions.6. Automatically create and author test content.7. Test real browser behavior.8. Compare implementation against the original design.9. Detect visual, functional, accessibility and performance issues.10. Automatically fix detected problems.11. Re-run validation after every fix.12. Provide a complete audit trail of AI activity.13. Create GitHub pull requests containing validated changes.14. Provide human approval before production deployment.
   Secondary goals

- Support multiple LLM providers.- Support existing EDS projects.- Support multiple AEM environments.- Reuse existing project blocks and conventions.- Learn project-specific design and coding patterns.- Provide reusable AI agents and tools.- Reduce repetitive EDS development and QA work.

---

3. WHAT THE PRODUCT IS NOT
   AI EDS Developer is not intended to be:

- A generic chatbot.- A simple Figma-to-HTML generator.- An AEM replacement.- A replacement for Universal Editor.- A visual-only website cloning tool.- A system that blindly generates code and declares success.- An unrestricted autonomous production deployment system.
  The product is an engineering control system around AI-driven EDS development.

---

4. DESIGN PRINCIPLES
   4.1 Evidence over assumptions
   The AI must verify its work.
   Bad:
   AI:"I created the Hero block successfully."
   Good:
   AI:Hero block created.
   Build: PASSUnit tests: PASSBrowser test: PASSUE authoring: PASSVisual similarity: 97.8%Accessibility: PASSPerformance: PASS
   The dashboard should always distinguish:
   AI CLAIM
   from:
   SYSTEM EVIDENCE

---

4.2 AI must be observable
Every meaningful AI operation should be visible through an audit trail.
Intent ↓Plan ↓Tool call ↓Tool result ↓Code change ↓Test ↓Failure ↓Fix ↓Retest ↓Validation
Users should be able to understand what happened without exposing private model chain-of-thought.

---

4.3 Human control
The AI should be autonomous where safe and require approval where necessary.
Autonomous

- Analyze- Generate- Build- Test- Validate- Fix- Retry- Create branch- Create PR
  Human approval
- Merge production changes- Publish production content- Change security configuration- Modify production infrastructure

---

4.4 Fail safely
Every agent execution must have:

- Maximum runtime.- Maximum LLM calls.- Maximum tool calls.- Maximum repair iterations.- Permission boundaries.- Environment boundaries.
  Example:
  MAX_FIX_ITERATIONS = 5 (default, configurable)
  MAX_RUNTIME = 30 minutes (default, configurable)
  MAX_TOOL_CALLS = 250 (default, configurable)
  When limits are reached:
  AUTOMATION STOPPED
  Human intervention required.

---

4.5 Reproducibility
Every run should be reproducible as much as possible.
Store:

- Project.- Git commit.- Branch.- Source design.- Environment.- Agent version.- Model.- Configuration.- Tools used.- Tests.- Results.- Code changes.
  Users should be able to:
  View RunReplay RunCompare RunsInspect Changes

---

4.6 Progressive autonomy
The platform should evolve from:
AI suggests
to:
AI executes
to:
AI executes + validates
to:
AI executes + validates + fixes
to:
AI executes + validates + fixes + prepares deployment
Production autonomy should remain configurable.

---

4.7 Project conventions first
The AI should inspect an existing EDS project before generating code.
Priority:
Existing project patterns        ↓Project design system        ↓Project coding standards        ↓EDS best practices        ↓Generic AI knowledge
The agent should reuse existing blocks and utilities wherever possible.

---

4.8 One source of truth
The EDS Git repository remains the source of truth for website code.
AEM remains the source of truth for managed content and authoring.
The AI platform orchestrates between them.
EDS Code   ↓GitHub
AEM Content   ↓AEM
AI   ↓Orchestration

---

5. VISUAL DIRECTION
   5.1 Design personality
   The product should feel like:
   «A professional engineering command center for AI.»
   It should NOT look like:

- A consumer chatbot.- A generic SaaS analytics dashboard.- A futuristic neon AI interface.- A cluttered developer IDE.
  Desired personality:
  ProfessionalPreciseTechnicalCalmTrustworthyObservableModernFocused

---

5.2 Visual language
Use a clean, high-density engineering interface.
Principles

- Strong typography hierarchy.- Large content areas.- Minimal decorative elements.- Clear status indicators.- Dense but readable activity logs.- Strong use of whitespace.- Consistent cards.- Clear visual hierarchy.- Subtle borders.- Minimal shadows.- Responsive layout.

---

5.3 Color philosophy
Use a restrained palette.
Primary:
Neutral / dark textWhite / neutral surfacesSubtle gray borders
Semantic colors:
Green → PASS / SUCCESSYellow → WARNING / WAITINGRed → FAILURE / CRITICALBlue → ACTIVE / INFORMATIONPurple → AI / AGENT
Do not use bright colors everywhere.
Color should communicate state, not decoration.

---

5.4 Typography
Use a modern sans-serif font for the application.
Recommended:
Inter
Use monospace typography for:

- Code.- Logs.- Tool calls.- Terminal output.- IDs.- Technical values.
  Recommended:
  JetBrains Mono

---

5.5 Status system
Status should be instantly understandable.
● Running✓ Passed✕ Failed Warning○ Waiting Paused
Avoid relying only on color.

---

5.6 AI identity
AI activity should have a subtle visual identity.
Example:
AI
or:
Agent
Use a small AI indicator beside agent-generated actions.
Example:
AI Generated Hero CSSAI Diagnosed visual mismatchAI Proposed fix

---

6. HOME PAGE
   6.1 Home page objective
   The home page should answer five questions immediately:
1. What projects do I have?2. What is the AI doing right now?3. What completed recently?4. Are there failures requiring attention?5. How do I start a new AI task?
   The user should understand the system within 5 seconds.

---

6.2 Home page structure
┌─────────────────────────────────────────────────────────────┐│ AI EDS DEVELOPER + New Project │├─────────────────────────────────────────────────────────────┤│ ││ Build EDS experiences with AI ││ Design → Code → Author → Test → Validate ││ │├─────────────────────────────────────────────────────────────┤│ ││ Active Runs Projects Success Rate Issues ││ 2 12 94.2% 7 ││ │├─────────────────────────────────────────────────────────────┤│ ││ ACTIVE AGENT RUNS ││ ││ Product Page Reconstruction ● Running ││ ███████████████████░░░░ 78% ││ ││ Current: Visual validation ││ Project: Product Website ││ Iteration: 3 / 5 ││ ││ ││ Landing Page Build ● Running ││ ███████████░░░░░░░░░░░ 48% ││ ││ Current: Universal Editor ││ │├─────────────────────────────────────────────────────────────┤│ ││ PROJECTS ││ ││ Product Website ✓ Healthy 3 active runs ││ Banking Portal ✓ Healthy Last run 2h ago ││ Corporate Site Issues 2 failed tests ││ │├─────────────────────────────────────────────────────────────┤│ ││ RECENT ACTIVITY ││ ││ 2m AI fixed Hero visual mismatch ││ 8m Product Page visual validation passed ││ 15m Universal Editor test completed ││ 32m PR created ││ │└─────────────────────────────────────────────────────────────┘

---

6.3 Header
Header:
AI EDS Developer
Navigation:
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
Primary CTA:

- New Project

---

6.4 Hero section
The home page should have a simple statement:
«Build production-ready EDS experiences with AI.»
Supporting text:
«From Figma or an existing website to EDS blocks, Universal Editor authoring, automated testing, visual validation, bug fixing, and deployment.»
Primary action:
[ + New Project ]
Secondary:
[ View Recent Runs ]

---

6.5 KPI section
Show operational metrics, not vanity metrics.
Active Runs2
Projects12
Success Rate94.2%
Open Issues7
Optional:
Avg Fix Iterations1.8
Avg Run Time14m

---

6.6 Active agent runs
This should be the most prominent section.
Each run card:
Product Page Reconstruction
● RUNNING
Project:Product Website
Source:Figma
Current stage:Visual Validation
Progress:78%
Iteration:3 / 5
Tests:128 / 128
Visual:97.8%
[Open Run]

---

6.7 Project cards
Each project should show health.
Product Website
● Healthy
EDS✓
AEM✓
Universal Editor✓
Tests128 / 128
Visual97.8%
Last run8 minutes ago
[Open Project]

---

6.8 Recent activity
Timeline:
09:42AI fixed visual mismatchProduct Page
09:38Visual validation passed97.8%
09:35Universal Editor authoring passed
09:31128 browser tests completed
09:28Hero block generated
09:25Figma analysis completed
Each event should be clickable.

---

6.9 Attention required
If something fails, show a dedicated section.
ATTENTION REQUIRED
Product CardAccessibility test failed2 issues
✕ Checkout PageBuild failedhero.js line 42
Corporate SiteVisual score below threshold89.2%
Actions:
[Investigate][Open Run][Let AI Fix]

---

6.10 Empty state
For a new user:
No projects yet.
Start with a Figma design, existing website,or existing EDS project.
[ Create Your First Project ]

---

7. HOME PAGE INFORMATION HIERARCHY
   Priority should be:
1. Active failures2. Active agent runs3. Start new work4. Project health5. Recent activity6. General metrics
   Do not make analytics charts the primary experience.
   This is an engineering control center, not a BI dashboard.

---

8. PRIMARY USER JOURNEY
   The primary journey should be:
   Home ↓New Project ↓Connect EDS Repository ↓Connect AEM ↓Configure LLM ↓Select Source ↓Analyze ↓Review AI Plan ↓Start Build ↓Agent Run ↓Monitor ↓Review Results ↓Review Code ↓Review Visual QA ↓Review Tests ↓Create PR ↓Approve ↓Deploy

---

9. NEW PROJECT ENTRY
   The New Project flow should ask:
   Step 1 — Project
   Project nameDescription
   Step 2 — Source
   ○ Figma○ Existing Website○ Existing AEM Page○ Existing EDS Project
   Step 3 — Repository
   GitHub repositoryBranch
   Step 4 — AEM
   AEM AuthorAEM PreviewEnvironment
   Step 5 — AI
   ProviderAPI URLAPI KeyModel
   Step 6 — Quality
   Visual thresholdAccessibility thresholdPerformance thresholdMaximum repair iterations
   Step 7
   [ Analyze Project ]

---

10. HOME PAGE SUCCESS CRITERIA
    The home page is successful if a user can immediately:

- See running agents.- See failures.- See project health.- Start a new project.- Open any active run.- See recent AI actions.- Understand whether the system is healthy.- Navigate to detailed evidence.
  The page should not require the user to understand AI terminology.

---

11. PRODUCT DESIGN NORTH STAR
    The entire application should follow one principle:
    «Make autonomous AI development feel observable, controlled, and trustworthy.»
    The interface should constantly answer:
    WHAT is AI doing?WHY is it doing it?WHAT did it change?WHAT happened?DID it work?HOW do we know?WHAT happens next?
    The dashboard is therefore not merely a monitoring screen.
    It is the control center and trust layer of the AI engineering system.
