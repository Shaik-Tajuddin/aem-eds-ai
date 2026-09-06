"use client";

import { useState } from "react";
import { Check, ChevronRight, Zap } from "lucide-react";
import { saveProject } from "../../lib/project-store";

// ─── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Project", sublabel: "Name & description" },
  { id: 2, label: "Source", sublabel: "Input type" },
  { id: 3, label: "Repository", sublabel: "GitHub repo" },
  { id: 4, label: "AEM", sublabel: "Environment URLs" },
  { id: 5, label: "AI", sublabel: "LLM configuration" },
  { id: 6, label: "Quality", sublabel: "Thresholds & limits" },
  { id: 7, label: "Analyze", sublabel: "Review & start" },
];

// ─── Step content components ───────────────────────────────────────────────────

function Step1({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <StepHeader
        title="Project Details"
        description="Give your EDS project a name. This identifies it in the dashboard."
      />
      <FormField label="Project Name" required>
        <input
          id="project-name"
          type="text"
          placeholder="e.g. Product Website, Banking Portal"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          style={{ ...inputStyle }}
        />
      </FormField>
      <FormField label="Description">
        <textarea
          id="project-description"
          placeholder="Brief description of the project..."
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </FormField>
    </div>
  );
}

function Step2({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  const sources = [
    {
      id: "FIGMA",
      label: "Figma Design",
      description:
        "Import a design from Figma using a file URL or frame selection.",
      icon: "◈",
    },
    {
      id: "EXISTING_WEBSITE",
      label: "Existing Website",
      description:
        "Reconstruct any public web page as EDS blocks using Playwright crawling.",
      icon: "⊙",
    },
    {
      id: "EXISTING_AEM_PAGE",
      label: "Existing AEM Page",
      description:
        "Extract components and content from an authenticated AEM page.",
      icon: "◉",
    },
    {
      id: "EXISTING_EDS_PROJECT",
      label: "Existing EDS Project",
      description: "Analyze and extend an existing EDS GitHub repository.",
      icon: "◈",
    },
  ] as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <StepHeader
        title="Input Source"
        description="What will the AI use as the design reference?"
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {sources.map((s) => (
          <button
            key={s.id}
            id={`source-${s.id.toLowerCase()}`}
            onClick={() => onChange({ sourceType: s.id })}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              padding: "14px 16px",
              borderRadius: "var(--radius-md)",
              border: `1px solid ${data.sourceType === s.id ? "var(--accent-primary)" : "var(--border-default)"}`,
              background:
                data.sourceType === s.id
                  ? "var(--color-info-dim)"
                  : "var(--bg-elevated)",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
            }}
          >
            <span
              style={{
                fontSize: "20px",
                color:
                  data.sourceType === s.id
                    ? "var(--accent-primary)"
                    : "var(--text-tertiary)",
                lineHeight: 1,
                marginTop: "1px",
              }}
            >
              {s.icon}
            </span>
            <div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: "3px",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                {s.description}
              </div>
            </div>
            {data.sourceType === s.id && (
              <Check
                size={16}
                color="var(--accent-primary)"
                style={{ marginLeft: "auto", flexShrink: 0 }}
              />
            )}
          </button>
        ))}
      </div>

      {data.sourceType &&
        ["FIGMA", "EXISTING_WEBSITE", "EXISTING_AEM_PAGE"].includes(
          data.sourceType,
        ) && (
          <FormField label="Source URL" required>
            <input
              id="source-url"
              type="url"
              placeholder={
                data.sourceType === "FIGMA"
                  ? "https://www.figma.com/file/..."
                  : data.sourceType === "EXISTING_WEBSITE"
                    ? "https://example.com/page"
                    : "https://author.aem.cloud/content/..."
              }
              value={data.sourceUrl}
              onChange={(e) => onChange({ sourceUrl: e.target.value })}
              style={inputStyle}
            />
          </FormField>
        )}
    </div>
  );
}

function Step3({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <StepHeader
        title="GitHub Repository"
        description="The EDS project Git repository. The AI will clone, analyze, create branches, and submit pull requests."
      />
      <FormField label="Repository" required hint="Format: owner/repository">
        <input
          id="github-repo"
          type="text"
          placeholder="my-org/my-eds-project"
          value={data.githubRepo}
          onChange={(e) => onChange({ githubRepo: e.target.value })}
          style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
        />
      </FormField>
      <FormField label="Default Branch">
        <input
          id="github-branch"
          type="text"
          placeholder="main"
          value={data.githubBranch}
          onChange={(e) => onChange({ githubBranch: e.target.value })}
          style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
        />
      </FormField>
      <FormField
        label="GitHub Token"
        hint="Personal Access Token with repo + workflow scopes. Stored encrypted — never logged or sent to the browser."
      >
        <input
          id="github-token"
          type="password"
          placeholder="ghp_..."
          value={data.githubToken}
          onChange={(e) => onChange({ githubToken: e.target.value })}
          style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
          autoComplete="new-password"
        />
      </FormField>
      <div
        style={{
          padding: "10px 14px",
          background: "var(--color-info-dim)",
          border: "1px solid #2563eb22",
          borderRadius: "var(--radius-md)",
          fontSize: "12px",
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "var(--color-info)" }}>Security:</strong> The
        GitHub token is encrypted with AES-256-GCM before being stored in the
        database. It is never sent to the browser or included in logs.
      </div>
    </div>
  );
}

function Step4({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <StepHeader
        title="AEM Configuration"
        description="Connect your AEM Cloud environment for content authoring and Universal Editor testing."
      />
      <FormField
        label="AEM Author URL"
        hint="e.g. https://author-p12345-e67890.adobeaemcloud.com"
      >
        <input
          id="aem-author-url"
          type="url"
          placeholder="https://author-p12345-e67890.adobeaemcloud.com"
          value={data.aemAuthorUrl}
          onChange={(e) => onChange({ aemAuthorUrl: e.target.value })}
          style={inputStyle}
        />
      </FormField>
      <FormField
        label="EDS Preview URL"
        hint="e.g. https://main--my-repo--my-org.hlx.page"
      >
        <input
          id="aem-preview-url"
          type="url"
          placeholder="https://main--my-repo--my-org.hlx.page"
          value={data.aemPreviewUrl}
          onChange={(e) => onChange({ aemPreviewUrl: e.target.value })}
          style={inputStyle}
        />
      </FormField>
      <FormField
        label="AEM Authoring Page Path"
        hint="Root or default JCR page path in AEM Cloud (e.g. /content/mysite/us/en)"
      >
        <input
          id="aem-authoring-path"
          type="text"
          placeholder="/content/mysite/us/en"
          value={data.aemAuthoringPath}
          onChange={(e) => onChange({ aemAuthoringPath: e.target.value })}
          style={inputStyle}
        />
      </FormField>
      <FormField label="Environment Name">
        <input
          id="aem-environment"
          type="text"
          placeholder="production / staging / development"
          value={data.aemEnvironment}
          onChange={(e) => onChange({ aemEnvironment: e.target.value })}
          style={inputStyle}
        />
      </FormField>
      <p
        style={{
          fontSize: "12px",
          color: "var(--text-tertiary)",
          fontStyle: "italic",
        }}
      >
        AEM credentials (Client ID, Secret, IMS Org) are configured in Settings
        and stored encrypted per project.
      </p>
    </div>
  );
}

function Step5({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  const providers = [
    { id: "OPENAI", label: "OpenAI", note: "GPT-4o, GPT-4-turbo" },
    { id: "ANTHROPIC", label: "Anthropic", note: "Claude 3.5 Sonnet, Haiku" },
    {
      id: "GOOGLE_GEMINI",
      label: "Google Gemini",
      note: "Gemini 1.5 Pro, Flash",
    },
    { id: "AZURE_OPENAI", label: "Azure OpenAI", note: "Hosted GPT-4 models" },
    {
      id: "OLLAMA",
      label: "Ollama (Local)",
      note: "Llama, Mistral, Qwen — free",
    },
    { id: "CUSTOM", label: "Custom", note: "Any OpenAI-compatible API" },
  ] as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <StepHeader
        title="AI Configuration"
        description="The LLM that the agent orchestrator uses for planning, code generation, and diagnosis."
      />
      <FormField label="Provider" required>
        <select
          id="llm-provider"
          value={data.llmProvider}
          onChange={(e) => onChange({ llmProvider: e.target.value })}
          style={{ ...inputStyle }}
        >
          <option value="">Select provider...</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} — {p.note}
            </option>
          ))}
        </select>
      </FormField>

      {data.llmProvider &&
        ["AZURE_OPENAI", "OLLAMA", "CUSTOM"].includes(data.llmProvider) && (
          <FormField label="API URL" required>
            <input
              id="llm-api-url"
              type="url"
              placeholder={
                data.llmProvider === "OLLAMA"
                  ? "http://localhost:11434"
                  : "https://..."
              }
              value={data.llmApiUrl}
              onChange={(e) => onChange({ llmApiUrl: e.target.value })}
              style={inputStyle}
            />
          </FormField>
        )}

      {data.llmProvider && !["OLLAMA"].includes(data.llmProvider) && (
        <FormField
          label="API Key"
          hint="Stored encrypted — never logged or sent to the browser."
        >
          <input
            id="llm-api-key"
            type="password"
            placeholder="sk-..."
            value={data.llmApiKey}
            onChange={(e) => onChange({ llmApiKey: e.target.value })}
            style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
            autoComplete="new-password"
          />
        </FormField>
      )}

      <FormField
        label="Model"
        required
        hint="e.g. gpt-4o, claude-3-5-sonnet-latest, llama3.3"
      >
        <input
          id="llm-model"
          type="text"
          placeholder="gpt-4o"
          value={data.llmModel}
          onChange={(e) => onChange({ llmModel: e.target.value })}
          style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
        />
      </FormField>
    </div>
  );
}

function Step6({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <StepHeader
        title="Quality Gates & Limits"
        description="Define what 'done' means. The AI will not create a PR until all configured gates pass."
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}
      >
        <FormField label="Visual Threshold %" hint="Default: 95">
          <input
            id="visual-threshold"
            type="number"
            min={0}
            max={100}
            value={data.visualThreshold}
            onChange={(e) =>
              onChange({ visualThreshold: Number(e.target.value) })
            }
            style={inputStyle}
          />
        </FormField>
        <FormField label="Accessibility Threshold %" hint="Default: 95">
          <input
            id="accessibility-threshold"
            type="number"
            min={0}
            max={100}
            value={data.accessibilityThreshold}
            onChange={(e) =>
              onChange({ accessibilityThreshold: Number(e.target.value) })
            }
            style={inputStyle}
          />
        </FormField>
        <FormField label="Performance Threshold %" hint="Default: 90">
          <input
            id="performance-threshold"
            type="number"
            min={0}
            max={100}
            value={data.performanceThreshold}
            onChange={(e) =>
              onChange({ performanceThreshold: Number(e.target.value) })
            }
            style={inputStyle}
          />
        </FormField>
        <FormField label="Max Fix Iterations" hint="Default: 5 (max: 20)">
          <input
            id="max-fix-iterations"
            type="number"
            min={1}
            max={20}
            value={data.maxFixIterations}
            onChange={(e) =>
              onChange({ maxFixIterations: Number(e.target.value) })
            }
            style={inputStyle}
          />
        </FormField>
        <FormField label="Max Runtime (minutes)" hint="Default: 30">
          <input
            id="max-runtime"
            type="number"
            min={5}
            max={120}
            value={data.maxRuntimeMinutes}
            onChange={(e) =>
              onChange({ maxRuntimeMinutes: Number(e.target.value) })
            }
            style={inputStyle}
          />
        </FormField>
        <FormField label="Max Tool Calls" hint="Default: 250">
          <input
            id="max-tool-calls"
            type="number"
            min={10}
            max={1000}
            value={data.maxToolCalls}
            onChange={(e) => onChange({ maxToolCalls: Number(e.target.value) })}
            style={inputStyle}
          />
        </FormField>
      </div>
    </div>
  );
}

function Step7({ data }: { data: FormData }) {
  const rows = [
    { label: "Project Name", value: data.name || "—" },
    { label: "Source Type", value: data.sourceType?.replace(/_/g, " ") || "—" },
    { label: "Source URL", value: data.sourceUrl || "—" },
    { label: "GitHub Repo", value: data.githubRepo || "—" },
    { label: "Branch", value: data.githubBranch || "main" },
    { label: "AEM Author", value: data.aemAuthorUrl || "—" },
    { label: "AEM Authoring Path", value: data.aemAuthoringPath || "—" },
    {
      label: "LLM Provider",
      value: data.llmProvider?.replace(/_/g, " ") || "—",
    },
    { label: "LLM Model", value: data.llmModel || "—" },
    { label: "Visual Threshold", value: `${data.visualThreshold}%` },
    {
      label: "Accessibility Threshold",
      value: `${data.accessibilityThreshold}%`,
    },
    { label: "Max Fix Iterations", value: String(data.maxFixIterations) },
    { label: "Max Runtime", value: `${data.maxRuntimeMinutes} minutes` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <StepHeader
        title="Review & Analyze"
        description="Confirm your configuration. The AI will analyze your repository and source before starting the build."
      />
      <div className="card-elevated" style={{ padding: "20px" }}>
        {rows.map((row, i) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom:
                i < rows.length - 1 ? "1px solid var(--border-subtle)" : "none",
              gap: "16px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                fontSize: "12px",
                color:
                  row.value === "—"
                    ? "var(--text-disabled)"
                    : "var(--text-primary)",
                fontFamily: "var(--font-mono)",
                maxWidth: "300px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textAlign: "right",
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: "12px 16px",
          background: "var(--color-ai-dim)",
          border: "1px solid #7c3aed33",
          borderRadius: "var(--radius-md)",
          fontSize: "12px",
          color: "var(--color-ai)",
          lineHeight: 1.6,
          display: "flex",
          gap: "10px",
          alignItems: "flex-start",
        }}
      >
        <Zap size={14} style={{ flexShrink: 0, marginTop: "1px" }} />
        <div>
          <strong>What happens next:</strong> The AI will clone your repository,
          analyze existing EDS blocks and conventions, analyze your source
          design, build an implementation plan, and present it for your review
          before proceeding. No code is written until you approve the plan.
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StepHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div style={{ marginBottom: "4px" }}>
      <h2
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--text-primary)",
          letterSpacing: "-0.01em",
          marginBottom: "6px",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: "13px",
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
    </div>
  );
}

function FormField({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--text-secondary)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.03em",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--color-error)", marginLeft: "4px" }}>
            *
          </span>
        )}
      </label>
      {children}
      {hint && (
        <span
          style={{
            fontSize: "11px",
            color: "var(--text-tertiary)",
            lineHeight: 1.5,
          }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  background: "var(--bg-base)",
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-primary)",
  fontSize: "13px",
  outline: "none",
  transition: "border-color 0.15s ease",
  fontFamily: "var(--font-ui)",
};

// ─── Form State ───────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  description: string;
  sourceType: string;
  sourceUrl: string;
  githubRepo: string;
  githubBranch: string;
  githubToken: string;
  aemAuthorUrl: string;
  aemAuthoringPath: string;
  aemPreviewUrl: string;
  aemEnvironment: string;
  llmProvider: string;
  llmApiUrl: string;
  llmApiKey: string;
  llmModel: string;
  visualThreshold: number;
  accessibilityThreshold: number;
  performanceThreshold: number;
  maxFixIterations: number;
  maxRuntimeMinutes: number;
  maxToolCalls: number;
}

const defaultFormData: FormData = {
  name: "",
  description: "",
  sourceType: "",
  sourceUrl: "",
  githubRepo: "",
  githubBranch: "main",
  githubToken: "",
  aemAuthorUrl: "",
  aemAuthoringPath: "",
  aemPreviewUrl: "",
  aemEnvironment: "",
  llmProvider: "",
  llmApiUrl: "",
  llmApiKey: "",
  llmModel: "",
  visualThreshold: 95,
  accessibilityThreshold: 95,
  performanceThreshold: 90,
  maxFixIterations: 5,
  maxRuntimeMinutes: 30,
  maxToolCalls: 250,
};

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function NewProjectWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateData = (partial: Partial<FormData>) =>
    setFormData((prev) => ({ ...prev, ...partial }));

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length > 0;
      case 2:
        return formData.sourceType.length > 0;
      case 3:
        return formData.githubRepo.trim().length > 0;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      saveProject(formData);
      await new Promise((r) => setTimeout(r, 600));
    } catch (e) {
      console.error("Error saving project:", e);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: "560px", width: "100%", textAlign: "center" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "var(--color-success-dim)",
            border: "2px solid var(--color-success)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <Check size={24} color="var(--color-success)" />
        </div>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "12px",
          }}
        >
          Project Created
        </h2>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            marginBottom: "32px",
            lineHeight: 1.6,
          }}
        >
          Your project{" "}
          <strong style={{ color: "var(--text-primary)" }}>
            {formData.name}
          </strong>{" "}
          is ready. The AI agent orchestrator will be available in Phase 4.
        </p>
        <a href="/dashboard" className="btn btn-primary">
          Return to Dashboard
        </a>
      </div>
    );
  }

  const stepComponents = [
    <Step1 key={1} data={formData} onChange={updateData} />,
    <Step2 key={2} data={formData} onChange={updateData} />,
    <Step3 key={3} data={formData} onChange={updateData} />,
    <Step4 key={4} data={formData} onChange={updateData} />,
    <Step5 key={5} data={formData} onChange={updateData} />,
    <Step6 key={6} data={formData} onChange={updateData} />,
    <Step7 key={7} data={formData} />,
  ];

  return (
    <div style={{ maxWidth: "640px", width: "100%" }}>
      {/* Step indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "32px",
          gap: "0",
        }}
      >
        {STEPS.map((step, i) => (
          <div
            key={step.id}
            style={{
              display: "flex",
              alignItems: "center",
              flex: i < STEPS.length - 1 ? 1 : "none",
            }}
          >
            <button
              onClick={() => currentStep > step.id && setCurrentStep(step.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                background: "none",
                border: "none",
                cursor: currentStep > step.id ? "pointer" : "default",
                padding: "0 2px",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  background:
                    currentStep > step.id
                      ? "var(--color-success)"
                      : currentStep === step.id
                        ? "var(--accent-primary)"
                        : "var(--bg-elevated)",
                  color:
                    currentStep >= step.id ? "#fff" : "var(--text-tertiary)",
                  border: `2px solid ${
                    currentStep > step.id
                      ? "var(--color-success)"
                      : currentStep === step.id
                        ? "var(--accent-primary)"
                        : "var(--border-default)"
                  }`,
                  transition: "all 0.2s ease",
                }}
              >
                {currentStep > step.id ? <Check size={12} /> : step.id}
              </div>
              <div
                style={{
                  fontSize: "9px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  color:
                    currentStep === step.id
                      ? "var(--accent-primary)"
                      : "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </div>
            </button>

            {i < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: "2px",
                  background:
                    currentStep > step.id
                      ? "var(--color-success)"
                      : "var(--border-subtle)",
                  marginBottom: "20px",
                  transition: "background 0.2s ease",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="card-elevated" style={{ padding: "28px" }}>
        {stepComponents[currentStep - 1]}
      </div>

      {/* Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "20px",
        }}
      >
        <button
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          disabled={currentStep === 1}
          className="btn btn-secondary"
          style={{ opacity: currentStep === 1 ? 0.4 : 1 }}
        >
          Back
        </button>

        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--text-tertiary)",
          }}
        >
          Step {currentStep} of {STEPS.length}
        </span>

        {currentStep < STEPS.length ? (
          <button
            onClick={() => setCurrentStep((s) => Math.min(STEPS.length, s + 1))}
            disabled={!canProceed()}
            className="btn btn-primary"
            style={{ opacity: !canProceed() ? 0.5 : 1 }}
          >
            Continue
            <ChevronRight size={14} />
          </button>
        ) : (
          <button
            id="analyze-project-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? (
              <>
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                    display: "inline-block",
                  }}
                />
                Creating...
              </>
            ) : (
              <>
                <Zap size={14} />
                Analyze Project
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
