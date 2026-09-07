// ============================================================
// @aeds/aem — Universal Editor Model Generator
// Builds definition / model / filter payloads for Universal Editor.
// XWalk EDS repos: write sources under models/_*.json + blocks/*/_*.json;
// build:json compiles root aggregates component-definition.json,
// component-models.json, and component-filters.json (no leading underscore).
// ============================================================

import type {
  BlockManifest,
  ComponentDefinition,
  ComponentModel,
  ComponentField,
  ComponentFilter,
  UniversalEditorFieldType,
} from './types.js';

export class UniversalEditorModelGenerator {
  /**
   * Infers Universal Editor field widget type from field name and optional hint
   */
  static inferFieldType(fieldName: string, hint?: UniversalEditorFieldType): UniversalEditorFieldType {
    if (hint) return hint;
    const lower = fieldName.toLowerCase();
    if (lower.includes('image') || lower.includes('photo') || lower.includes('icon') || lower.includes('asset')) {
      return 'reference';
    }
    if (lower.includes('body') || lower.includes('description') || lower.includes('copy') || lower.includes('content') || lower.includes('richtext')) {
      return 'richtext';
    }
    if (lower.includes('link') || lower.includes('url') || lower.includes('href') || lower.includes('cta')) {
      return 'aem-content';
    }
    if (lower.startsWith('is') || lower.startsWith('has') || lower.startsWith('enable') || lower.startsWith('show')) {
      return 'boolean';
    }
    if (lower.includes('count') || lower.includes('number') || lower.includes('order')) {
      return 'number';
    }
    return 'text';
  }

  /**
   * Generates a single ComponentField
   */
  static createField(
    name: string,
    label?: string,
    type?: UniversalEditorFieldType,
    required = false,
    options?: Array<{ name: string; value: string }>
  ): ComponentField {
    const component = this.inferFieldType(name, type);
    const field: ComponentField = {
      id: name,
      label: label ?? name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1'),
      component,
      required,
    };

    if (component === 'number') {
      field.valueType = 'number';
    } else if (component === 'boolean') {
      field.valueType = 'boolean';
    } else {
      field.valueType = 'string';
    }

    if (options && options.length > 0) {
      field.component = 'select';
      field.options = options;
    }

    return field;
  }

  /**
   * Generates component definition entries (compiled into component-definition.json).
   */
  generateDefinitions(manifests: BlockManifest[]): ComponentDefinition[] {
    return manifests.map((m) => ({
      id: m.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      title: m.title ?? m.name.charAt(0).toUpperCase() + m.name.slice(1).replace(/([A-Z])/g, ' $1'),
      category: m.category ?? 'EDS Blocks',
      description: m.description ?? `${m.name} block for Edge Delivery Services`,
      plugins: {
        aem: {
          asset: true,
          text: true,
        },
      },
    }));
  }

  /**
   * Generates component model entries (compiled into component-models.json).
   */
  generateModels(manifests: BlockManifest[]): ComponentModel[] {
    return manifests.map((m) => {
      const modelId = m.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const fields: ComponentField[] = m.fields.map((f) =>
        UniversalEditorModelGenerator.createField(
          f.name,
          f.label,
          f.type,
          f.required ?? false,
          f.options
        )
      );

      return {
        id: modelId,
        fields,
      };
    });
  }

  /**
   * Generates component filter entries (compiled into component-filters.json).
   */
  generateFilters(
    manifests: BlockManifest[],
    containerId = 'main-container'
  ): ComponentFilter[] {
    const allBlockIds = manifests.map((m) =>
      m.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    );

    return [
      {
        id: containerId,
        components: allBlockIds,
      },
    ];
  }

  /**
   * Bundles definitions, models, and filters into a complete Universal Editor manifest package
   */
  generateFullSchemaPackage(manifests: BlockManifest[]) {
    return {
      definitions: this.generateDefinitions(manifests),
      models: this.generateModels(manifests),
      filters: this.generateFilters(manifests),
    };
  }
}
