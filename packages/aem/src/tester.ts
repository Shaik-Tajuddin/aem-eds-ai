// ============================================================
// @aeds/aem — Universal Editor Authoring Tester
// Validates end-to-end authoring cycles: edit → save → reopen → render
// ============================================================

import type {
  AuthoringValidationReport,
  BlockAuthoringResult,
  AuthoringFieldCheck,
} from './types.js';

export class UniversalEditorTester {
  /**
   * Tests authoring cycle for an individual EDS block
   */
  async testBlockAuthoring(
    blockName: string,
    fieldTestCases: Array<{
      name: string;
      label: string;
      testValue: unknown;
      persistedValue: unknown;
      renderedValue: unknown;
    }>
  ): Promise<BlockAuthoringResult> {
    const fields: AuthoringFieldCheck[] = [];
    let blockPassed = true;

    for (const testCase of fieldTestCases) {
      const valuePersisted = testCase.persistedValue === testCase.testValue;
      const valueRendered = String(testCase.renderedValue).includes(String(testCase.testValue));
      const passed = valuePersisted && valueRendered;

      if (!passed) {
        blockPassed = false;
      }

      fields.push({
        fieldName: testCase.name,
        fieldLabel: testCase.label,
        passed,
        authoredValue: testCase.testValue,
        persistedValue: testCase.persistedValue,
        renderedValue: testCase.renderedValue,
        error: !passed
          ? !valuePersisted
            ? `Value failed to persist after save`
            : `Value persisted but did not render in DOM`
          : undefined,
      });
    }

    return {
      blockName,
      passed: blockPassed,
      fieldsTested: fields.length,
      fields,
    };
  }

  /**
   * Evaluates multiple blocks and generates a comprehensive Authoring Validation Report
   */
  generateReport(blockResults: BlockAuthoringResult[]): AuthoringValidationReport {
    const totalFields = blockResults.reduce((acc, b) => acc + b.fieldsTested, 0);
    const allPassed = blockResults.every((b) => b.passed);

    return {
      blocksTested: blockResults.length,
      fieldsTested: totalFields,
      passed: allPassed,
      results: blockResults,
      validatedAt: new Date().toISOString(),
    };
  }
}
