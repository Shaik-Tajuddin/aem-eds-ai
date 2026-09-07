# Figma Integration

Package: `@aeds/figma`

## Flow

```
Figma URL / file ID / node ID
  → FigmaClient (REST)
  → DesignIRConverter
  → Design IR
  → Architecture IR (EDSComponentIR)
  → Code
```

Never jump Figma → JavaScript.

## Components

| Class | Role |
|---|---|
| `FigmaUrlParser` | Extract fileKey / node-id |
| `FigmaClient` | REST with `X-Figma-Token` |
| `DesignIRConverter` | Tokens, components, layout, assets |

## Env

```bash
FIGMA_TOKEN=   # backend only
```

## Design IR extracts

Layout, components, spacing, typography, colors, images/icons, responsive rules, states, interactions, content.

## Errors

Client surfaces 401 / 404 / 429 distinctly — no fake design success without API data.
