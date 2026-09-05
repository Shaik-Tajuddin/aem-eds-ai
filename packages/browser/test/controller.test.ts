import { describe, it, expect } from 'vitest';
import { BrowserController, BrowserError, BrowserErrorCode, VIEWPORT_PRESETS } from '../src/index.js';

describe('Browser Controller', () => {
  describe('Viewport Presets', () => {
    it('defines standard EDS testing viewports', () => {
      expect(VIEWPORT_PRESETS.desktop.width).toBe(1440);
      expect(VIEWPORT_PRESETS.desktop.height).toBe(900);
      expect(VIEWPORT_PRESETS.tablet.width).toBe(768);
      expect(VIEWPORT_PRESETS.mobile.width).toBe(375);
      expect(VIEWPORT_PRESETS.mobile.isMobile).toBe(true);
    });
  });

  describe('Error Mapping', () => {
    it('creates structured BrowserError with code and details', () => {
      const err = new BrowserError('Timeout occurred', BrowserErrorCode.NAVIGATION_TIMEOUT, { timeout: 30000 });
      expect(err.name).toBe('BrowserError');
      expect(err.code).toBe(BrowserErrorCode.NAVIGATION_TIMEOUT);
      expect(err.details).toEqual({ timeout: 30000 });
    });
  });

  describe('Controller Lifecycle', () => {
    it('initializes with default launch configuration', () => {
      const controller = new BrowserController();
      expect(controller).toBeDefined();
    });
  });
});
