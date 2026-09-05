// ============================================================
// @aeds/aem — Universal Editor Validator
// Validates component schemas and EDS DOM instrumentation
// ============================================================

import { AemError, AemErrorCode } from './errors.js';
import type {
  ComponentDefinition,
  ComponentModel,
  InstrumentationCheck,
} from './types.js';

export class UniversalEditorValidator {
  /**
   * Validates component definitions array
   */
  validateDefinitions(definitions: ComponentDefinition[]): boolean {
    if (!Array.isArray(definitions) || definitions.length === 0) {
      throw new AemError(
        'Component definitions must be a non-empty array',
        AemErrorCode.INVALID_COMPONENT_MODEL
      );
    }

    for (const def of definitions) {
      if (!def.id || typeof def.id !== 'string') {
        throw new AemError(
          `Component definition missing valid id: ${JSON.stringify(def)}`,
          AemErrorCode.INVALID_COMPONENT_MODEL
        );
      }
      if (!def.title || typeof def.title !== 'string') {
        throw new AemError(
          `Component definition "${def.id}" missing required title`,
          AemErrorCode.INVALID_COMPONENT_MODEL
        );
      }
    }

    return true;
  }

  /**
   * Validates component models array
   */
  validateModels(models: ComponentModel[]): boolean {
    if (!Array.isArray(models) || models.length === 0) {
      throw new AemError(
        'Component models must be a non-empty array',
        AemErrorCode.INVALID_COMPONENT_MODEL
      );
    }

    for (const model of models) {
      if (!model.id || typeof model.id !== 'string') {
        throw new AemError(
          `Component model missing valid id`,
          AemErrorCode.INVALID_COMPONENT_MODEL
        );
      }
      if (!Array.isArray(model.fields)) {
        throw new AemError(
          `Component model "${model.id}" must have a fields array`,
          AemErrorCode.INVALID_COMPONENT_MODEL
        );
      }
      for (const field of model.fields) {
        if (!field.id || !field.component) {
          throw new AemError(
            `Field in model "${model.id}" missing id or component widget type`,
            AemErrorCode.INVALID_COMPONENT_MODEL
          );
        }
      }
    }

    return true;
  }

  /**
   * Inspects block HTML or DOM string for required Universal Editor instrumentation
   */
  validateBlockInstrumentation(
    html: string,
    expectedBlockName: string,
    expectedFields: string[] = []
  ): InstrumentationCheck {
    const missing: string[] = [];

    // Check container attributes
    if (!html.includes('data-aue-resource')) {
      missing.push('data-aue-resource');
    }
    if (!html.includes('data-aue-type="component"')) {
      missing.push('data-aue-type="component"');
    }
    if (!html.includes('data-aue-model')) {
      missing.push('data-aue-model');
    }

    // Check specific fields if required
    for (const field of expectedFields) {
      if (!html.includes(`data-aue-prop="${field}"`)) {
        missing.push(`data-aue-prop="${field}"`);
      }
    }

    const valid = missing.length === 0;

    return {
      valid,
      missingAttributes: missing,
      blockName: expectedBlockName,
    };
  }
}
