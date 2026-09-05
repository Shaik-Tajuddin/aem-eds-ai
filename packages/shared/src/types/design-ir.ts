// ============================================================
// Design IR — Internal Representation of a design source
// Contract between design analysis and implementation agents
// ============================================================

export type DesignSource = 'figma' | 'website' | 'screenshot' | 'aem-page';

export interface DesignIR {
  id: string;
  source: DesignSource;
  sourceUrl?: string;
  capturedAt: string;
  pages: PageIR[];
  designTokens: DesignTokens;
  components: ComponentIR[];
  assets: AssetIR[];
  responsiveRules: ResponsiveRule[];
  interactions: InteractionIR[];
  metadata: Record<string, unknown>;
}

export interface PageIR {
  id: string;
  name: string;
  url?: string;
  title?: string;
  width: number;
  height: number;
  sections: SectionIR[];
  screenshot?: string; // storage path
}

export interface SectionIR {
  id: string;
  name: string;
  type: string;
  order: number;
  components: string[]; // ComponentIR ids
}

export interface ComponentIR {
  id: string;
  name: string;
  type: string;
  hierarchy: string[];
  dimensions: Dimensions;
  spacing: Spacing;
  typography: Typography[];
  colors: Colors;
  assets: string[];
  behavior: BehaviorIR[];
  children?: ComponentIR[];
  uncertainty?: string; // flag when AI is uncertain about intent
}

export interface Dimensions {
  width: number;
  height: number;
  aspectRatio?: number;
}

export interface Spacing {
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  gap?: number;
}

export interface Typography {
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
  color?: string;
  role?: 'heading' | 'subheading' | 'body' | 'label' | 'caption' | 'cta';
}

export interface Colors {
  background?: string;
  text?: string;
  border?: string;
  accent?: string;
  overlay?: string;
}

export interface BehaviorIR {
  trigger: string;
  action: string;
  target?: string;
}

export interface AssetIR {
  id: string;
  type: 'image' | 'icon' | 'video' | 'font';
  url?: string;
  alt?: string;
  width?: number;
  height?: number;
  storagePath?: string;
}

export interface DesignTokens {
  colors: Record<string, string>;
  typography: Record<string, TypographyToken>;
  spacing: Record<string, number>;
  breakpoints: Record<string, number>;
  shadows?: Record<string, string>;
  radii?: Record<string, number>;
}

export interface TypographyToken {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
}

export interface ResponsiveRule {
  breakpoint: string;
  minWidth?: number;
  maxWidth?: number;
  adjustments: Record<string, unknown>;
}

export interface InteractionIR {
  componentId: string;
  trigger: 'click' | 'hover' | 'scroll' | 'focus' | 'keypress';
  behavior: string;
}
