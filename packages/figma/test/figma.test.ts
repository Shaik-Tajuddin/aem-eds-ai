import { describe, it, expect } from 'vitest';
import {
  FigmaClient,
  FigmaUrlParser,
  DesignIRConverter,
  FigmaError,
  FigmaErrorCode,
  type FigmaFileResponse,
} from '../src/index.js';

describe('@aeds/figma — Figma Client & Design IR Converter', () => {
  describe('FigmaUrlParser', () => {
    it('parses standard Figma file URLs', () => {
      const parsed = FigmaUrlParser.parse(
        'https://www.figma.com/file/abc123xyz/My-Design-System'
      );
      expect(parsed.fileKey).toBe('abc123xyz');
      expect(parsed.nodeId).toBeUndefined();
    });

    it('parses modern Figma design URLs with node-id query param', () => {
      const parsed = FigmaUrlParser.parse(
        'https://www.figma.com/design/xyz789def/Landing-Page?node-id=1-42&t=abcdef'
      );
      expect(parsed.fileKey).toBe('xyz789def');
      expect(parsed.nodeId).toBe('1:42');
    });

    it('rejects invalid or non-Figma URLs', () => {
      expect(() => FigmaUrlParser.parse('https://google.com')).toThrow(FigmaError);
      expect(() => FigmaUrlParser.parse('not-a-url')).toThrow(FigmaError);
    });
  });

  describe('FigmaClient Authentication Guard', () => {
    it('fails loudly when access token is missing', () => {
      expect(() => new FigmaClient({ accessToken: '' })).toThrow(FigmaError);
      try {
        new FigmaClient({ accessToken: '   ' });
      } catch (err: any) {
        expect(err.code).toBe(FigmaErrorCode.AUTHENTICATION_REQUIRED);
      }
    });

    it('initializes cleanly with valid token', () => {
      const client = new FigmaClient({ accessToken: 'figd_valid_token_123' });
      expect(client).toBeDefined();
    });
  });

  describe('DesignIRConverter', () => {
    const converter = new DesignIRConverter();

    it('converts float colors to hex and rgba strings accurately', () => {
      expect(
        DesignIRConverter.figmaColorToHex({ r: 1, g: 1, b: 1, a: 1 })
      ).toBe('#ffffff');
      expect(
        DesignIRConverter.figmaColorToHex({ r: 0, g: 0, b: 0, a: 1 })
      ).toBe('#000000');
      expect(
        DesignIRConverter.figmaColorToRgba({ r: 0.5, g: 0.5, b: 0.5, a: 0.8 })
      ).toBe('rgba(128, 128, 128, 0.8)');
    });

    it('transforms Figma node tree into canonical Design IR', () => {
      const mockFile: FigmaFileResponse = {
        name: 'Product Website',
        lastModified: '2026-09-06T00:00:00Z',
        version: '1.0',
        schemaVersion: 0,
        document: {
          id: '0:0',
          name: 'Document',
          type: 'DOCUMENT',
          children: [
            {
              id: '0:1',
              name: 'Page 1',
              type: 'CANVAS',
              children: [
                {
                  id: '1:2',
                  name: 'Hero Block',
                  type: 'FRAME',
                  layoutMode: 'HORIZONTAL',
                  itemSpacing: 24,
                  paddingTop: 48,
                  paddingBottom: 48,
                  paddingLeft: 32,
                  paddingRight: 32,
                  cornerRadius: 8,
                  absoluteBoundingBox: { x: 0, y: 0, width: 1440, height: 600 },
                  fills: [
                    {
                      type: 'SOLID',
                      color: { r: 15 / 255, g: 17 / 255, b: 23 / 255, a: 1 }, // #0f1117
                    },
                  ],
                  children: [
                    {
                      id: '1:3',
                      name: 'Headline',
                      type: 'TEXT',
                      characters: 'Modernize with AI',
                      style: {
                        fontFamily: 'Inter',
                        fontWeight: 700,
                        fontSize: 48,
                        lineHeightPx: 56,
                      },
                      fills: [
                        {
                          type: 'SOLID',
                          color: { r: 1, g: 1, b: 1, a: 1 },
                        },
                      ],
                    },
                    {
                      id: '1:4',
                      name: 'Arrow Icon',
                      type: 'VECTOR',
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      const ir = converter.convert(mockFile, 'test-key-123');

      expect(ir.source.type).toBe('figma');
      expect(ir.source.fileKey).toBe('test-key-123');
      expect(ir.pages).toHaveLength(1);
      expect(ir.pages[0]!.sections).toHaveLength(1);

      // Design tokens
      expect(ir.designTokens.colors['#0f1117']).toBeDefined();
      expect(ir.designTokens.colors['#ffffff']).toBeDefined();
      expect(ir.designTokens.typography['inter-48-700']).toBeDefined();
      expect(ir.designTokens.typography['inter-48-700']!.fontSize).toBe(48);
      expect(ir.designTokens.spacing).toContain(24);
      expect(ir.designTokens.spacing).toContain(48);
      expect(ir.designTokens.radii).toContain(8);

      // Component IR
      const hero = ir.components[0]!;
      expect(hero.name).toBe('Hero Block');
      expect(hero.dimensions.width).toBe(1440);
      expect(hero.dimensions.height).toBe(600);
      expect(hero.spacing.layoutMode).toBe('horizontal');
      expect(hero.spacing.gap).toBe(24);
      expect(hero.spacing.padding?.top).toBe(48);
      expect(hero.colors.background).toBe('#0f1117');

      // Children & assets
      expect(hero.children).toHaveLength(2);
      expect(hero.children![0]!.textContent).toBe('Modernize with AI');
      expect(ir.assets).toHaveLength(1);
      expect(ir.assets[0]!.type).toBe('svg');

      // Responsive rules
      expect(ir.responsiveRules).toHaveLength(3);
    });

    it('handles corrupted or missing document root node', () => {
      expect(() => converter.convert({} as any)).toThrow(FigmaError);
    });
  });
});
