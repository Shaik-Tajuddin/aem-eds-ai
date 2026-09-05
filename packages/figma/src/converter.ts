// ============================================================
// @aeds/figma — Design IR Converter
// Transforms Figma node trees into canonical Design IR contracts
// ============================================================

import { FigmaError, FigmaErrorCode } from './errors.js';
import type {
  FigmaFileResponse,
  FigmaNode,
  FigmaColor,
  DesignIR,
  DesignTokens,
  ColorToken,
  TypographyToken,
  ComponentIR,
  AssetIR,
  PageIR,
} from './types.js';

export class DesignIRConverter {
  /**
   * Converts a float (0..1) FigmaColor to hex string #RRGGBB
   */
  static figmaColorToHex(c: FigmaColor): string {
    const r = Math.round(Math.min(1, Math.max(0, c.r)) * 255)
      .toString(16)
      .padStart(2, '0');
    const g = Math.round(Math.min(1, Math.max(0, c.g)) * 255)
      .toString(16)
      .padStart(2, '0');
    const b = Math.round(Math.min(1, Math.max(0, c.b)) * 255)
      .toString(16)
      .padStart(2, '0');
    return `#${r}${g}${b}`.toLowerCase();
  }

  /**
   * Converts a float FigmaColor to rgba() CSS string
   */
  static figmaColorToRgba(c: FigmaColor): string {
    const r = Math.round(Math.min(1, Math.max(0, c.r)) * 255);
    const g = Math.round(Math.min(1, Math.max(0, c.g)) * 255);
    const b = Math.round(Math.min(1, Math.max(0, c.b)) * 255);
    const a = Number((c.a ?? 1).toFixed(2));
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  /**
   * Converts a FigmaFileResponse into canonical DesignIR
   */
  convert(file: FigmaFileResponse, fileKey = 'unknown'): DesignIR {
    if (!file?.document) {
      throw new FigmaError(
        'Invalid Figma file response: missing document root node',
        FigmaErrorCode.IR_CONVERSION_FAILED
      );
    }

    const colors: Record<string, ColorToken> = {};
    const typography: Record<string, TypographyToken> = {};
    const spacingSet = new Set<number>();
    const radiiSet = new Set<number>();
    const assets: AssetIR[] = [];

    // Helper: traverse node to collect tokens and assets
    const collectTokens = (node: FigmaNode) => {
      // 1. Colors from fills and strokes
      const paints = [...(node.fills ?? []), ...(node.strokes ?? [])];
      for (const paint of paints) {
        if (paint.type === 'SOLID' && paint.color) {
          const hex = DesignIRConverter.figmaColorToHex(paint.color);
          if (!colors[hex]) {
            colors[hex] = {
              hex,
              rgb: `rgb(${Math.round(paint.color.r * 255)}, ${Math.round(paint.color.g * 255)}, ${Math.round(paint.color.b * 255)})`,
              rgba: DesignIRConverter.figmaColorToRgba(paint.color),
              rawColor: paint.color,
            };
          }
        }
        if (paint.type === 'IMAGE') {
          assets.push({
            id: `asset-${node.id}`,
            nodeId: node.id,
            name: node.name || 'image',
            type: 'webp',
          });
        }
      }

      // 2. Typography from text nodes
      if (node.type === 'TEXT' && node.style) {
        const key = `${node.style.fontFamily}-${node.style.fontSize}-${node.style.fontWeight}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-');

        if (!typography[key]) {
          typography[key] = {
            fontFamily: node.style.fontFamily,
            fontSize: node.style.fontSize,
            fontWeight: node.style.fontWeight,
            lineHeight: node.style.lineHeightPx,
            letterSpacing: node.style.letterSpacing,
          };
        }
      }

      // 3. Spacing & layout
      if (node.itemSpacing && node.itemSpacing > 0) {
        spacingSet.add(node.itemSpacing);
      }
      if (node.paddingTop && node.paddingTop > 0) spacingSet.add(node.paddingTop);
      if (node.paddingLeft && node.paddingLeft > 0) spacingSet.add(node.paddingLeft);
      if (node.cornerRadius && node.cornerRadius > 0) radiiSet.add(node.cornerRadius);

      // 4. Vector icons
      if (node.type === 'VECTOR') {
        assets.push({
          id: `icon-${node.id}`,
          nodeId: node.id,
          name: node.name || 'icon',
          type: 'svg',
        });
      }

      if (node.children) {
        for (const child of node.children) {
          collectTokens(child);
        }
      }
    };

    collectTokens(file.document);

    // Build ComponentIR tree from top-level frames/components
    const components: ComponentIR[] = [];
    const canvas = file.document.children?.[0]; // Default page canvas
    const topFrames = canvas?.children ?? [];

    const convertNodeToComponent = (node: FigmaNode, parentHierarchy: string[] = []): ComponentIR => {
      const hierarchy = [...parentHierarchy, node.name];
      const dimensions = {
        width: node.absoluteBoundingBox?.width ?? 0,
        height: node.absoluteBoundingBox?.height ?? 0,
      };

      const layoutMode: 'horizontal' | 'vertical' | 'none' =
        node.layoutMode === 'HORIZONTAL'
          ? 'horizontal'
          : node.layoutMode === 'VERTICAL'
          ? 'vertical'
          : 'none';

      const padding =
        node.paddingTop !== undefined ||
        node.paddingRight !== undefined ||
        node.paddingBottom !== undefined ||
        node.paddingLeft !== undefined
          ? {
              top: node.paddingTop ?? 0,
              right: node.paddingRight ?? 0,
              bottom: node.paddingBottom ?? 0,
              left: node.paddingLeft ?? 0,
            }
          : undefined;

      const fill = node.fills?.find((f) => f.type === 'SOLID' && f.color);
      const bg = fill?.color ? DesignIRConverter.figmaColorToHex(fill.color) : undefined;

      const childrenIR = node.children
        ? node.children.map((c) => convertNodeToComponent(c, hierarchy))
        : undefined;

      return {
        id: node.id.replace(/[^a-zA-Z0-9-]/g, '-'),
        nodeId: node.id,
        name: node.name,
        type: node.type.toLowerCase(),
        hierarchy,
        dimensions,
        spacing: {
          layoutMode,
          gap: node.itemSpacing,
          padding,
        },
        typography:
          node.type === 'TEXT' && node.style
            ? {
                fontFamily: node.style.fontFamily,
                fontSize: node.style.fontSize,
                fontWeight: node.style.fontWeight,
                lineHeight: node.style.lineHeightPx,
                letterSpacing: node.style.letterSpacing,
              }
            : undefined,
        colors: {
          background: bg,
        },
        textContent: node.characters,
        assets: [],
        behavior: [],
        children: childrenIR,
      };
    };

    const sections: Array<{ id: string; name: string; components: ComponentIR[] }> = [];

    for (const frame of topFrames) {
      const comp = convertNodeToComponent(frame);
      components.push(comp);
      sections.push({
        id: frame.id.replace(/[^a-zA-Z0-9-]/g, '-'),
        name: frame.name,
        components: [comp],
      });
    }

    const designTokens: DesignTokens = {
      colors,
      typography,
      spacing: Array.from(spacingSet).sort((a, b) => a - b),
      radii: Array.from(radiiSet).sort((a, b) => a - b),
    };

    const pages: PageIR[] = [
      {
        id: 'page-default',
        name: file.name,
        sections,
      },
    ];

    return {
      source: {
        type: 'figma',
        fileKey,
        fileName: file.name,
        lastModified: file.lastModified,
      },
      pages,
      designTokens,
      components,
      assets,
      responsiveRules: [
        { breakpoint: 'desktop', minWidth: 1024 },
        { breakpoint: 'tablet', minWidth: 768, maxWidth: 1023 },
        { breakpoint: 'mobile', maxWidth: 767 },
      ],
      interactions: [],
    };
  }
}
