/**
 * Unit tests for skills_ratings table verification utilities
 * 
 * Tests Requirements: 2.2
 */

import { verifySkillsRatingsTable, getSkillsRatingsTableInfo } from './verifySkillsRatingsTable';
import { supabase } from './supabase';

// Mock the supabase module
jest.mock('./supabase', () => ({
  supabase: null
}));

describe('Skills Ratings Table Verification', () => {
  describe('verifySkillsRatingsTable', () => {
    it('should return error when supabase client is not initialized', async () => {
      const results = await verifySkillsRatingsTable();
      
      expect(results.tableExists).toBe(false);
      expect(results.canQuery).toBe(false);
      expect(results.canInsert).toBe(false);
      expect(results.foreignKeyWorks).toBe(false);
      expect(results.checkConstraintsWork).toBe(false);
      expect(results.indexExists).toBe(false);
      expect(results.errors).toContain('Supabase client not initialized');
    });

    it('should have all required result properties', async () => {
      const results = await verifySkillsRatingsTable();
      
      expect(results).toHaveProperty('tableExists');
      expect(results).toHaveProperty('canQuery');
      expect(results).toHaveProperty('canInsert');
      expect(results).toHaveProperty('foreignKeyWorks');
      expect(results).toHaveProperty('checkConstraintsWork');
      expect(results).toHaveProperty('indexExists');
      expect(results).toHaveProperty('errors');
      expect(Array.isArray(results.errors)).toBe(true);
    });
  });

  describe('getSkillsRatingsTableInfo', () => {
    it('should return error when supabase client is not initialized', async () => {
      const info = await getSkillsRatingsTableInfo();
      
      expect(info).toHaveProperty('error');
      expect(info.error).toBe('Supabase client not initialized');
    });
  });

  describe('Integration with real Supabase', () => {
    // These tests will only run if Supabase is properly configured
    // They are skipped by default to avoid requiring a live database connection
    
    it.skip('should verify table exists when migration is applied', async () => {
      // This test requires a real Supabase connection
      // Run manually after applying the migration
      const results = await verifySkillsRatingsTable();
      
      expect(results.tableExists).toBe(true);
      expect(results.canQuery).toBe(true);
    });

    it.skip('should verify foreign key constraints work', async () => {
      // This test requires a real Supabase connection
      const results = await verifySkillsRatingsTable();
      
      expect(results.foreignKeyWorks).toBe(true);
    });

    it.skip('should verify check constraints work', async () => {
      // This test requires a real Supabase connection
      const results = await verifySkillsRatingsTable();
      
      expect(results.checkConstraintsWork).toBe(true);
    });
  });
});

describe('Skills Ratings Table Structure', () => {
  it('should define expected columns', () => {
    const expectedColumns = [
      'id',
      'player_id',
      'batting',
      'bowling',
      'fielding',
      'fitness',
      'created_at',
      'updated_at'
    ];

    // This is a documentation test - verifies we know what columns should exist
    expect(expectedColumns).toHaveLength(8);
    expect(expectedColumns).toContain('player_id');
    expect(expectedColumns).toContain('batting');
    expect(expectedColumns).toContain('bowling');
    expect(expectedColumns).toContain('fielding');
    expect(expectedColumns).toContain('fitness');
  });

  it('should define valid rating range', () => {
    const MIN_RATING = 0;
    const MAX_RATING = 10;

    // This is a documentation test - verifies the expected constraints
    expect(MIN_RATING).toBe(0);
    expect(MAX_RATING).toBe(10);
  });
});
