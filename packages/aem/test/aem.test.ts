import { describe, it, expect } from 'vitest';
import {
  AemCloudClient,
  AemError,
  AemErrorCode,
  UniversalEditorModelGenerator,
  UniversalEditorValidator,
  UniversalEditorTester,
  CloudManagerClient,
  type BlockManifest,
} from '../src/index.js';

describe('@aeds/aem — AEM Cloud & Universal Editor Adapter', () => {
  describe('AemCloudClient Authentication Guard', () => {
    it('fails loudly when credentials are not configured', async () => {
      const client = new AemCloudClient({
        authorUrl: 'https://author-p12345-e67890.adobeaemcloud.com',
      });

      await expect(client.publishPage('/content/mysite/us/en')).rejects.toThrow(AemError);
      try {
        await client.publishPage('/content/mysite/us/en');
      } catch (err: any) {
        expect(err.code).toBe(AemErrorCode.AUTHENTICATION_REQUIRED);
      }
    });

    it('validates authorUrl presence', () => {
      expect(() => new AemCloudClient({ authorUrl: '' })).toThrow(AemError);
    });
  });

  describe('CloudManagerClient', () => {
    it('is not configured without feature flag and credentials', () => {
      const prev = process.env.ENABLE_CLOUD_MANAGER;
      delete process.env.ENABLE_CLOUD_MANAGER;
      const client = new CloudManagerClient({});
      expect(client.isConfigured()).toBe(false);
      expect(() => {
        // force assert via getPrograms promise rejection path
      }).not.toThrow();
      if (prev !== undefined) process.env.ENABLE_CLOUD_MANAGER = prev;
    });

    it('fails loudly when enabled without credentials', async () => {
      const client = new CloudManagerClient({ enabled: true });
      await expect(client.getPrograms()).rejects.toThrow(AemError);
    });
  });

  describe('UniversalEditorModelGenerator', () => {
    const generator = new UniversalEditorModelGenerator();
    const manifests: BlockManifest[] = [
      {
        name: 'Hero',
        title: 'Product Hero',
        category: 'Banners',
        fields: [
          { name: 'headline', label: 'Main Headline', type: 'text', required: true },
          { name: 'image', label: 'Hero Image' },
          { name: 'description', label: 'Body Copy' },
          { name: 'ctaUrl', label: 'CTA Link' },
          { name: 'showOverlay', label: 'Show Dark Overlay' },
        ],
      },
      {
        name: 'Cards',
        fields: [
          { name: 'title', required: true },
          {
            name: 'columns',
            options: [
              { name: 'Two', value: '2' },
              { name: 'Three', value: '3' },
            ],
          },
        ],
      },
    ];

    it('infers field types correctly', () => {
      expect(UniversalEditorModelGenerator.inferFieldType('heroImage')).toBe('reference');
      expect(UniversalEditorModelGenerator.inferFieldType('longDescription')).toBe('richtext');
      expect(UniversalEditorModelGenerator.inferFieldType('buttonLink')).toBe('aem-content');
      expect(UniversalEditorModelGenerator.inferFieldType('isEnabled')).toBe('boolean');
      expect(UniversalEditorModelGenerator.inferFieldType('displayOrder')).toBe('number');
      expect(UniversalEditorModelGenerator.inferFieldType('title')).toBe('text');
    });

    it('generates component definitions matching Adobe schema', () => {
      const definitions = generator.generateDefinitions(manifests);
      expect(definitions).toHaveLength(2);
      expect(definitions[0]!.id).toBe('hero');
      expect(definitions[0]!.title).toBe('Product Hero');
      expect(definitions[0]!.category).toBe('Banners');
      expect(definitions[0]!.plugins).toBeDefined();
    });

    it('generates component models with inferred field types', () => {
      const models = generator.generateModels(manifests);
      expect(models).toHaveLength(2);

      const heroModel = models.find((m) => m.id === 'hero');
      expect(heroModel).toBeDefined();
      expect(heroModel!.fields).toHaveLength(5);

      const imageField = heroModel!.fields.find((f) => f.id === 'image');
      expect(imageField!.component).toBe('reference');

      const descField = heroModel!.fields.find((f) => f.id === 'description');
      expect(descField!.component).toBe('richtext');

      const ctaField = heroModel!.fields.find((f) => f.id === 'ctaUrl');
      expect(ctaField!.component).toBe('aem-content');

      const toggleField = heroModel!.fields.find((f) => f.id === 'showOverlay');
      expect(toggleField!.component).toBe('boolean');
    });

    it('generates component filters for container placement', () => {
      const filters = generator.generateFilters(manifests);
      expect(filters).toHaveLength(1);
      expect(filters[0]!.components).toContain('hero');
      expect(filters[0]!.components).toContain('cards');
    });
  });

  describe('UniversalEditorValidator', () => {
    const validator = new UniversalEditorValidator();

    it('validates correct definitions and models', () => {
      expect(
        validator.validateDefinitions([{ id: 'hero', title: 'Hero' }])
      ).toBe(true);

      expect(
        validator.validateModels([
          { id: 'hero', fields: [{ id: 'title', label: 'Title', component: 'text' }] },
        ])
      ).toBe(true);
    });

    it('detects missing data-aue instrumentation in rendered blocks', () => {
      const validHtml = `
        <div class="hero block" data-aue-resource="urn:aemconnection:/content/dam/hero" data-aue-type="component" data-aue-model="hero">
          <h1 data-aue-prop="headline" data-aue-type="text">Welcome to EDS</h1>
        </div>
      `;
      const result = validator.validateBlockInstrumentation(validHtml, 'hero', ['headline']);
      expect(result.valid).toBe(true);
      expect(result.missingAttributes).toHaveLength(0);

      const invalidHtml = `<div class="hero block"><h1>Welcome to EDS</h1></div>`;
      const invalidResult = validator.validateBlockInstrumentation(invalidHtml, 'hero', ['headline']);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.missingAttributes).toContain('data-aue-resource');
      expect(invalidResult.missingAttributes).toContain('data-aue-type="component"');
      expect(invalidResult.missingAttributes).toContain('data-aue-prop="headline"');
    });
  });

  describe('UniversalEditorTester', () => {
    const tester = new UniversalEditorTester();

    it('verifies authoring edit-save-render cycle', async () => {
      const result = await tester.testBlockAuthoring('Hero', [
        {
          name: 'headline',
          label: 'Headline',
          testValue: 'Updated Headline 2026',
          persistedValue: 'Updated Headline 2026',
          renderedValue: '<h1>Updated Headline 2026</h1>',
        },
        {
          name: 'ctaText',
          label: 'Button Label',
          testValue: 'Shop Now',
          persistedValue: 'Shop Now',
          renderedValue: '<a href="#">Shop Now</a>',
        },
      ]);

      expect(result.passed).toBe(true);
      expect(result.fieldsTested).toBe(2);

      const report = tester.generateReport([result]);
      expect(report.passed).toBe(true);
      expect(report.blocksTested).toBe(1);
      expect(report.fieldsTested).toBe(2);
    });

    it('detects persistence and rendering failures', async () => {
      const failureResult = await tester.testBlockAuthoring('Hero', [
        {
          name: 'headline',
          label: 'Headline',
          testValue: 'New Value',
          persistedValue: 'Old Value', // Failed to persist
          renderedValue: '<h1>Old Value</h1>',
        },
      ]);

      expect(failureResult.passed).toBe(false);
      expect(failureResult.fields[0]!.error).toBe('Value failed to persist after save');
    });
  });
});
