// ============================================================
// @aeds/figma — Types & Data Contracts
// Figma REST API & Design Intermediate Representation (Design IR)
// ============================================================

export interface FigmaClientConfig {
  accessToken: string;
  apiUrl?: string;
  timeoutMs?: number;
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaTypeStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  fontWeight: number;
  fontSize: number;
  textAlignHorizontal?: 'LEFT' | 'RIGHT' | 'CENTER' | 'JUSTIFIED';
  letterSpacing?: number;
  lineHeightPx?: number;
  lineHeightPercent?: number;
}

export interface FigmaPaint {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE';
  visible?: boolean;
  opacity?: number;
  color?: FigmaColor;
}

export interface FigmaBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FigmaNode {
  id: string;
  name: string;
  type:
    | 'DOCUMENT'
    | 'CANVAS'
    | 'FRAME'
    | 'GROUP'
    | 'VECTOR'
    | 'BOOLEAN_OPERATION'
    | 'STAR'
    | 'LINE'
    | 'ELLIPSE'
    | 'REGULAR_POLYGON'
    | 'RECTANGLE'
    | 'TEXT'
    | 'SLICE'
    | 'COMPONENT'
    | 'COMPONENT_SET'
    | 'INSTANCE';
  children?: FigmaNode[];
  fills?: FigmaPaint[];
  strokes?: FigmaPaint[];
  strokeWeight?: number;
  cornerRadius?: number;
  absoluteBoundingBox?: FigmaBoundingBox;
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  itemSpacing?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  characters?: string;
  style?: FigmaTypeStyle;
  componentId?: string;
}

export interface FigmaFileResponse {
  name: string;
  lastModified: string;
  thumbnailUrl?: string;
  version: string;
  document: FigmaNode;
  components?: Record<string, { key: string; name: string; description: string }>;
  schemaVersion: number;
}

// ─── Design IR Contracts (Product Vision §8) ─────────────────────────────────

export interface ColorToken {
  hex: string;
  rgb: string;
  rgba: string;
  rawColor: FigmaColor;
}

export interface TypographyToken {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight?: number;
  letterSpacing?: number;
}

export interface DesignTokens {
  colors: Record<string, ColorToken>;
  typography: Record<string, TypographyToken>;
  spacing: number[];
  radii: number[];
}

export interface ComponentDimensions {
  width: number;
  height: number;
}

export interface ComponentSpacing {
  layoutMode: 'horizontal' | 'vertical' | 'none';
  gap?: number;
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ComponentColors {
  background?: string;
  text?: string;
  border?: string;
}

export interface ComponentIR {
  id: string;
  nodeId: string;
  name: string;
  type: string;
  hierarchy: string[];
  dimensions: ComponentDimensions;
  spacing: ComponentSpacing;
  typography?: TypographyToken;
  colors: ComponentColors;
  textContent?: string;
  assets: string[];
  behavior: string[];
  children?: ComponentIR[];
}

export interface AssetIR {
  id: string;
  nodeId: string;
  name: string;
  type: 'svg' | 'png' | 'webp';
  url?: string;
}

export interface PageIR {
  id: string;
  name: string;
  sections: Array<{
    id: string;
    name: string;
    components: ComponentIR[];
  }>;
}

export interface ResponsiveRule {
  breakpoint: 'desktop' | 'tablet' | 'mobile';
  minWidth?: number;
  maxWidth?: number;
}

export interface InteractionIR {
  targetId: string;
  trigger: 'click' | 'hover';
  action: 'navigate' | 'open-modal' | 'toggle';
  destinationUrl?: string;
}

export interface DesignIR {
  source: {
    type: 'figma';
    fileKey: string;
    fileName?: string;
    lastModified?: string;
  };
  pages: PageIR[];
  designTokens: DesignTokens;
  components: ComponentIR[];
  assets: AssetIR[];
  responsiveRules: ResponsiveRule[];
  interactions: InteractionIR[];
}
