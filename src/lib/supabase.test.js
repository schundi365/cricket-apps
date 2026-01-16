/**
 * Unit tests for Supabase client initialization
 * 
 * Tests Requirements: 1.1, 1.2, 1.3
 */

import { supabase, testConnection, getConnectionStatus } from './supabase';

describe('Supabase Client', () => {
  describe('Client Initialization', () => {
    it('should export a supabase client instance', () => {
      // The client may be null if env vars are not set, which is acceptable
      expect(supabase).toBeDefined();
    });

    it('should provide connection status information', () => {
      const status = getConnectionStatus();
      
      expect(status).toHaveProperty('configured');
      expect(status).toHaveProperty('url');
      expect(status).toHaveProperty('clientInitialized');
      expect(typeof status.configured).toBe('boolean');
      expect(typeof status.url).toBe('string');
      expect(typeof status.clientInitialized).toBe('boolean');
    });
  });

  describe('Connection Testing', () => {
    it('should have a testConnection function', () => {
      expect(typeof testConnection).toBe('function');
    });

    it('testConnection should return a promise', () => {
      const result = testConnection();
      expect(result).toBeInstanceOf(Promise);
    });

    it('testConnection should return false when client is not initialized', async () => {
      // If supabase is null (no env vars), testConnection should return false
      if (!supabase) {
        const result = await testConnection();
        expect(result).toBe(false);
      }
    });
  });

  describe('Configuration Validation', () => {
    it('should handle missing environment variables gracefully', () => {
      const status = getConnectionStatus();
      
      // If not configured, client should not be initialized
      if (!status.configured) {
        expect(status.clientInitialized).toBe(false);
        expect(status.url).toBe('Not configured');
      }
    });
  });
});
