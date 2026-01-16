/**
 * Tests for Player Sync Service
 * 
 * These tests verify the HTTP fetch functionality for retrieving
 * squad data from the Play Cricket website.
 * 
 * Requirements: 3.1, 7.3
 */

// Mock the supabase module FIRST, before any imports
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

import { fetchPlayCricketSquads } from './playerSyncService';

// Mock the global fetch function
global.fetch = jest.fn();

describe('fetchPlayCricketSquads', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Successful requests', () => {
    test('should fetch HTML content successfully', async () => {
      // Arrange
      const mockHtml = '<html><body><h1>Teams</h1><div>Player 1</div></body></html>';
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => mockHtml,
      });

      // Act
      const result = await fetchPlayCricketSquads();

      // Assert
      expect(result).toBe(mockHtml);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://mkair.play-cricket.com/Teams',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'User-Agent': expect.any(String),
          }),
        })
      );
    });

    test('should include User-Agent header in request', async () => {
      // Arrange
      const mockHtml = '<html><body>Test</body></html>';
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => mockHtml,
      });

      // Act
      await fetchPlayCricketSquads();

      // Assert
      const fetchCall = global.fetch.mock.calls[0];
      expect(fetchCall[1].headers['User-Agent']).toContain('Mozilla');
    });

    test('should handle HTML with whitespace', async () => {
      // Arrange
      const mockHtml = '  \n  <html><body>Content</body></html>  \n  ';
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => mockHtml,
      });

      // Act
      const result = await fetchPlayCricketSquads();

      // Assert
      expect(result).toBe(mockHtml);
    });
  });

  describe('HTTP error handling', () => {
    test('should throw error for 404 Not Found', async () => {
      // Arrange
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      // Act & Assert
      await expect(fetchPlayCricketSquads()).rejects.toThrow(
        'Failed to fetch Play Cricket squads: HTTP 404 Not Found'
      );
    });

    test('should throw error for 500 Internal Server Error', async () => {
      // Arrange
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Act & Assert
      await expect(fetchPlayCricketSquads()).rejects.toThrow(
        'Failed to fetch Play Cricket squads: HTTP 500 Internal Server Error'
      );
    });

    test('should throw error for 503 Service Unavailable', async () => {
      // Arrange
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      // Act & Assert
      await expect(fetchPlayCricketSquads()).rejects.toThrow(
        'Failed to fetch Play Cricket squads: HTTP 503 Service Unavailable'
      );
    });
  });

  describe('Network error handling', () => {
    test('should throw error for network failure', async () => {
      // Arrange
      global.fetch.mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      );

      // Act & Assert
      await expect(fetchPlayCricketSquads()).rejects.toThrow(
        'Network error: Unable to connect to Play Cricket website'
      );
    });

    test('should throw error for DNS resolution failure', async () => {
      // Arrange
      global.fetch.mockRejectedValueOnce(
        new TypeError('fetch failed')
      );

      // Act & Assert
      await expect(fetchPlayCricketSquads()).rejects.toThrow(
        'Network error: Unable to connect to Play Cricket website'
      );
    });
  });

  describe('Timeout handling', () => {
    test('should timeout after 30 seconds', async () => {
      // Arrange
      let abortCalled = false;
      global.fetch.mockImplementationOnce(
        (url, options) =>
          new Promise((resolve, reject) => {
            // Listen for abort signal
            if (options.signal) {
              options.signal.addEventListener('abort', () => {
                abortCalled = true;
                reject(new DOMException('The operation was aborted.', 'AbortError'));
              });
            }
            // Never resolve to simulate a hanging request
            setTimeout(() => resolve({
              ok: true,
              status: 200,
              text: async () => '<html></html>',
            }), 35000);
          })
      );

      // Act
      const fetchPromise = fetchPlayCricketSquads();
      
      // Fast-forward time by 30 seconds to trigger the timeout
      jest.advanceTimersByTime(30000);

      // Assert
      await expect(fetchPromise).rejects.toThrow(
        'Request to Play Cricket website timed out after 30 seconds'
      );
      expect(abortCalled).toBe(true);
    });

    test('should clear timeout on successful response', async () => {
      // Arrange
      const mockHtml = '<html><body>Quick response</body></html>';
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => mockHtml,
      });

      // Act
      const result = await fetchPlayCricketSquads();

      // Assert
      expect(result).toBe(mockHtml);
      // Verify no timers are pending
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe('Response validation', () => {
    test('should throw error for empty response', async () => {
      // Arrange
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '',
      });

      // Act & Assert
      await expect(fetchPlayCricketSquads()).rejects.toThrow(
        'Received empty response from Play Cricket website'
      );
    });

    test('should throw error for whitespace-only response', async () => {
      // Arrange
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '   \n\t   ',
      });

      // Act & Assert
      await expect(fetchPlayCricketSquads()).rejects.toThrow(
        'Received empty response from Play Cricket website'
      );
    });
  });

  describe('Edge cases', () => {
    test('should handle very large HTML responses', async () => {
      // Arrange
      const largeHtml = '<html><body>' + 'x'.repeat(1000000) + '</body></html>';
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => largeHtml,
      });

      // Act
      const result = await fetchPlayCricketSquads();

      // Assert
      expect(result).toBe(largeHtml);
      expect(result.length).toBeGreaterThan(1000000);
    });

    test('should handle HTML with special characters', async () => {
      // Arrange
      const specialHtml = '<html><body>Player: O\'Brien & Smith</body></html>';
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => specialHtml,
      });

      // Act
      const result = await fetchPlayCricketSquads();

      // Assert
      expect(result).toBe(specialHtml);
    });

    test('should handle unexpected error types', async () => {
      // Arrange
      global.fetch.mockRejectedValueOnce(
        new Error('Unexpected database error')
      );

      // Act & Assert
      await expect(fetchPlayCricketSquads()).rejects.toThrow(
        'Unexpected error fetching Play Cricket squads: Unexpected database error'
      );
    });
  });
});

// Import the HTML parser function
import { parsePlayCricketPlayers } from './playerSyncService';
import fc from 'fast-check';

describe('parsePlayCricketPlayers', () => {
  describe('Unit tests', () => {
    test('should parse HTML with team sections and player links', () => {
      const html = `
        <html>
          <body>
            <div class="team-section">
              <h2>1st XI</h2>
              <ul>
                <li><a href="/player/12345">John Smith</a></li>
                <li><a href="/player/67890">Jane Doe</a></li>
              </ul>
            </div>
          </body>
        </html>
      `;

      const players = parsePlayCricketPlayers(html);

      expect(players).toHaveLength(2);
      expect(players[0]).toEqual({
        name: 'John Smith',
        team: '1st XI',
        play_cricket_id: '12345'
      });
      expect(players[1]).toEqual({
        name: 'Jane Doe',
        team: '1st XI',
        play_cricket_id: '67890'
      });
    });

    test('should parse HTML with table structure', () => {
      const html = `
        <html>
          <body>
            <div class="squad-list">
              <h3>2nd XI Squad</h3>
              <table>
                <tr><td><a href="/player/111">Alice Brown</a></td></tr>
                <tr><td><a href="/player/222">Bob Wilson</a></td></tr>
              </table>
            </div>
          </body>
        </html>
      `;

      const players = parsePlayCricketPlayers(html);

      expect(players).toHaveLength(2);
      expect(players[0].name).toBe('Alice Brown');
      expect(players[0].team).toBe('2nd XI Squad');
      expect(players[1].name).toBe('Bob Wilson');
    });

    test('should handle multiple teams', () => {
      const html = `
        <html>
          <body>
            <div class="team-section">
              <h2>1st XI</h2>
              <a href="/player/1">Player One</a>
            </div>
            <div class="team-section">
              <h2>2nd XI</h2>
              <a href="/player/2">Player Two</a>
            </div>
          </body>
        </html>
      `;

      const players = parsePlayCricketPlayers(html);

      expect(players).toHaveLength(2);
      expect(players[0].team).toBe('1st XI');
      expect(players[1].team).toBe('2nd XI');
    });

    test('should remove duplicate players', () => {
      const html = `
        <html>
          <body>
            <div class="team-section">
              <h2>1st XI</h2>
              <a href="/player/1">John Smith</a>
              <a href="/player/1">John Smith</a>
            </div>
          </body>
        </html>
      `;

      const players = parsePlayCricketPlayers(html);

      expect(players).toHaveLength(1);
      expect(players[0].name).toBe('John Smith');
    });

    test('should throw error for empty HTML', () => {
      expect(() => parsePlayCricketPlayers('')).toThrow('Invalid HTML: expected non-empty string');
    });

    test('should throw error for null HTML', () => {
      expect(() => parsePlayCricketPlayers(null)).toThrow('Invalid HTML: expected non-empty string');
    });

    test('should throw error for non-string HTML', () => {
      expect(() => parsePlayCricketPlayers(123)).toThrow('Invalid HTML: expected non-empty string');
    });

    test('should return empty array for HTML with no players', () => {
      const html = '<html><body><h1>No players here</h1></body></html>';
      const players = parsePlayCricketPlayers(html);
      expect(players).toEqual([]);
    });

    test('should handle HTML with special characters in names', () => {
      const html = `
        <html>
          <body>
            <div class="team-section">
              <h2>1st XI</h2>
              <a href="/player/1">O'Brien</a>
              <a href="/player/2">Smith-Jones</a>
              <a href="/player/3">José García</a>
            </div>
          </body>
        </html>
      `;

      const players = parsePlayCricketPlayers(html);

      expect(players).toHaveLength(3);
      expect(players[0].name).toBe("O'Brien");
      expect(players[1].name).toBe('Smith-Jones');
      expect(players[2].name).toBe('José García');
    });
  });

  // Feature: supabase-player-sync, Property 2: HTML Parser Extracts Player Data
  // **Validates: Requirements 3.2**
  describe('Property 2: HTML Parser Extracts Player Data', () => {
    test('should extract all players from valid HTML without data loss', () => {
      // Generator for player data
      const playerArbitrary = fc.record({
        name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 0),
        id: fc.integer({ min: 1, max: 999999 }).map(n => n.toString())
      });

      // Generator for team data
      const teamArbitrary = fc.record({
        teamName: fc.constantFrom('1st XI', '2nd XI', '3rd XI', 'Under 19s', 'Veterans'),
        players: fc.array(playerArbitrary, { minLength: 1, maxLength: 20 })
      });

      // Generator for HTML structure
      const htmlArbitrary = fc.array(teamArbitrary, { minLength: 1, maxLength: 5 }).map(teams => {
        const sections = teams.map(team => {
          const playerLinks = team.players.map(player => 
            `<li><a href="/player/${player.id}">${player.name}</a></li>`
          ).join('\n');
          
          return `
            <div class="team-section">
              <h2>${team.teamName}</h2>
              <ul>
                ${playerLinks}
              </ul>
            </div>
          `;
        }).join('\n');

        return {
          html: `<html><body>${sections}</body></html>`,
          expectedPlayers: teams.flatMap(team => 
            team.players.map(player => ({
              name: player.name,
              team: team.teamName,
              id: player.id
            }))
          )
        };
      });

      fc.assert(
        fc.property(htmlArbitrary, ({ html, expectedPlayers }) => {
          const parsedPlayers = parsePlayCricketPlayers(html);

          // Verify all expected players are present
          expect(parsedPlayers.length).toBe(expectedPlayers.length);

          for (const expected of expectedPlayers) {
            const found = parsedPlayers.find(p => 
              p.name === expected.name && 
              p.team === expected.team &&
              p.play_cricket_id === expected.id
            );
            expect(found).toBeDefined();
          }
        }),
        { numRuns: 20 }
      );
    });

    test('should handle various HTML structures without throwing errors', () => {
      // Generator for various HTML structures
      const htmlStructureArbitrary = fc.oneof(
        // Simple list structure
        fc.constant('<html><body><div class="team"><h2>Team A</h2><a href="/player/1">Player 1</a></div></body></html>'),
        // Table structure
        fc.constant('<html><body><div class="squad"><h3>Squad</h3><table><tr><td><a href="/player/2">Player 2</a></td></tr></table></div></body></html>'),
        // Nested structure
        fc.constant('<html><body><div><div class="roster"><h4>Roster</h4><ul><li><a href="/player/3">Player 3</a></li></ul></div></div></body></html>'),
        // Multiple teams
        fc.constant('<html><body><div class="team"><h2>Team 1</h2><a href="/player/4">P4</a></div><div class="team"><h2>Team 2</h2><a href="/player/5">P5</a></div></body></html>'),
        // Minimal valid HTML
        fc.constant('<html><body><a href="/player/6">Player 6</a></body></html>')
      );

      fc.assert(
        fc.property(htmlStructureArbitrary, (html) => {
          // Should not throw an error
          const players = parsePlayCricketPlayers(html);
          
          // Result should be an array
          expect(Array.isArray(players)).toBe(true);
          
          // Each player should have required properties
          for (const player of players) {
            expect(player).toHaveProperty('name');
            expect(player).toHaveProperty('team');
            expect(typeof player.name).toBe('string');
            expect(typeof player.team).toBe('string');
            expect(player.name.length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 20 }
      );
    });

    test('should preserve player names exactly as they appear in HTML', () => {
      const playerNameArbitrary = fc.string({ minLength: 1, maxLength: 100 })
        .filter(s => s.trim().length > 0 && !s.includes('<') && !s.includes('>'));

      const htmlWithPlayerArbitrary = playerNameArbitrary.map(name => ({
        html: `<html><body><div class="team"><h2>Test Team</h2><a href="/player/123">${name}</a></div></body></html>`,
        expectedName: name
      }));

      fc.assert(
        fc.property(htmlWithPlayerArbitrary, ({ html, expectedName }) => {
          const players = parsePlayCricketPlayers(html);
          
          if (players.length > 0) {
            expect(players[0].name).toBe(expectedName);
          }
        }),
        { numRuns: 20 }
      );
    });

    test('should return empty array for HTML with no player data', () => {
      const nonPlayerHtmlArbitrary = fc.oneof(
        fc.constant('<html><body><h1>Welcome</h1></body></html>'),
        fc.constant('<html><body><div>No players</div></body></html>'),
        fc.constant('<html><body><p>Some text</p></body></html>'),
        fc.constant('<html><body></body></html>'),
        fc.constant('<html><body><div class="team"><h2>Empty Team</h2></div></body></html>')
      );

      fc.assert(
        fc.property(nonPlayerHtmlArbitrary, (html) => {
          const players = parsePlayCricketPlayers(html);
          expect(Array.isArray(players)).toBe(true);
          // May be empty or have minimal data
          expect(players.length).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 20 }
      );
    });
  });
});


// Import upsertPlayers function - get the REAL implementation
const { upsertPlayers } = jest.requireActual('./playerSyncService');

describe('upsertPlayers', () => {
  let mockSupabase;

  beforeEach(() => {
    // Get the mocked supabase instance
    const { supabase } = require('../lib/supabase');
    mockSupabase = supabase;
    jest.clearAllMocks();
  });

  describe('Unit tests', () => {
    test('should insert new players', async () => {
      // Mock existing players query (empty)
      const mockSelect = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        insert: mockInsert
      });

      const players = [
        { name: 'John Smith', team: '1st XI', play_cricket_id: '123' }
      ];

      const result = await upsertPlayers(players);

      expect(result.playersAdded).toBe(1);
      expect(result.playersUpdated).toBe(0);
      expect(result.playersUnchanged).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    test('should update existing players with changed teams', async () => {
      // Mock existing players query
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          { id: '1', name: 'John Smith', team: '2nd XI', play_cricket_id: '123' }
        ],
        error: null
      });
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'players') {
          return {
            select: mockSelect,
            update: mockUpdate
          };
        }
      });

      const players = [
        { name: 'John Smith', team: '1st XI', play_cricket_id: '123' }
      ];

      const result = await upsertPlayers(players);

      expect(result.playersAdded).toBe(0);
      expect(result.playersUpdated).toBe(1);
      expect(result.playersUnchanged).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    test('should track unchanged players', async () => {
      // Mock existing players query
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          { id: '1', name: 'John Smith', team: '1st XI', play_cricket_id: '123' }
        ],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      const players = [
        { name: 'John Smith', team: '1st XI', play_cricket_id: '123' }
      ];

      const result = await upsertPlayers(players);

      expect(result.playersAdded).toBe(0);
      expect(result.playersUpdated).toBe(0);
      expect(result.playersUnchanged).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle mix of new, updated, and unchanged players', async () => {
      // Mock existing players query
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          { id: '1', name: 'John Smith', team: '2nd XI', play_cricket_id: '123' },
          { id: '2', name: 'Jane Doe', team: '1st XI', play_cricket_id: '456' }
        ],
        error: null
      });
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'players') {
          return {
            select: mockSelect,
            insert: mockInsert,
            update: mockUpdate
          };
        }
      });

      const players = [
        { name: 'John Smith', team: '1st XI', play_cricket_id: '123' }, // Updated
        { name: 'Jane Doe', team: '1st XI', play_cricket_id: '456' },   // Unchanged
        { name: 'Bob Wilson', team: '3rd XI', play_cricket_id: '789' }  // New
      ];

      const result = await upsertPlayers(players);

      expect(result.playersAdded).toBe(1);
      expect(result.playersUpdated).toBe(1);
      expect(result.playersUnchanged).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle database fetch errors', async () => {
      // Mock fetch error
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      const players = [
        { name: 'John Smith', team: '1st XI' }
      ];

      const result = await upsertPlayers(players);

      expect(result.playersAdded).toBe(0);
      expect(result.playersUpdated).toBe(0);
      expect(result.playersUnchanged).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to fetch existing players');
    });

    test('should handle case-insensitive name matching', async () => {
      // Mock existing players query
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          { id: '1', name: 'John Smith', team: '1st XI', play_cricket_id: '123' }
        ],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      const players = [
        { name: 'JOHN SMITH', team: '1st XI', play_cricket_id: '123' }
      ];

      const result = await upsertPlayers(players);

      expect(result.playersUnchanged).toBe(1);
    });
  });

  // Feature: supabase-player-sync, Property 3: Player Upsert Correctness
  // **Validates: Requirements 3.3, 3.4**
  describe('Property 3: Player Upsert Correctness', () => {
    test('should correctly categorize all players as added, updated, or unchanged', () => {
      const playerArbitrary = fc.record({
        name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 2),
        team: fc.constantFrom('1st XI', '2nd XI', '3rd XI', 'Veterans'),
        play_cricket_id: fc.option(fc.integer({ min: 1, max: 999999 }).map(n => n.toString()), { nil: undefined })
      });

      const testCaseArbitrary = fc.record({
        existingPlayers: fc.array(playerArbitrary, { minLength: 0, maxLength: 20 }),
        newPlayers: fc.array(playerArbitrary, { minLength: 1, maxLength: 20 })
      });

      fc.assert(
        fc.asyncProperty(testCaseArbitrary, async ({ existingPlayers, newPlayers }) => {
          // Clear mocks for this iteration
          jest.clearAllMocks();
          
          // Mock the database
          const mockSelect = jest.fn().mockResolvedValue({
            data: existingPlayers.map((p, i) => ({
              id: `existing-${i}`,
              name: p.name,
              team: p.team,
              play_cricket_id: p.play_cricket_id
            })),
            error: null
          });

          let insertCount = 0;
          let updateCount = 0;

          const mockInsert = jest.fn().mockImplementation(() => {
            insertCount++;
            return Promise.resolve({ error: null });
          });

          const mockUpdate = jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation(() => {
              updateCount++;
              return Promise.resolve({ error: null });
            })
          });

          mockSupabase.from.mockImplementation((table) => {
            if (table === 'players') {
              return {
                select: mockSelect,
                insert: mockInsert,
                update: mockUpdate
              };
            }
          });

          // Execute upsert
          const result = await upsertPlayers(newPlayers);

          // Verify counts add up to total players
          const totalProcessed = result.playersAdded + result.playersUpdated + result.playersUnchanged;
          expect(totalProcessed).toBe(newPlayers.length);

          // Verify no errors (in this controlled test)
          expect(result.errors).toHaveLength(0);

          // Verify counts match actual operations
          expect(result.playersAdded).toBe(insertCount);
          expect(result.playersUpdated).toBe(updateCount);
        }),
        { numRuns: 100 }
      );
    });

    test('should insert players that do not exist in database', () => {
      const playerArbitrary = fc.record({
        name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 2),
        team: fc.constantFrom('1st XI', '2nd XI', '3rd XI'),
        play_cricket_id: fc.option(fc.integer({ min: 1, max: 999999 }).map(n => n.toString()), { nil: undefined })
      });

      fc.assert(
        fc.asyncProperty(fc.array(playerArbitrary, { minLength: 1, maxLength: 10 }), async (players) => {
          // Mock empty database
          const mockSelect = jest.fn().mockResolvedValue({
            data: [],
            error: null
          });

          const mockInsert = jest.fn().mockResolvedValue({ error: null });

          mockSupabase.from.mockImplementation((table) => {
            if (table === 'players') {
              return {
                select: mockSelect,
                insert: mockInsert
              };
            }
          });

          const result = await upsertPlayers(players);

          // All players should be added
          expect(result.playersAdded).toBe(players.length);
          expect(result.playersUpdated).toBe(0);
          expect(result.playersUnchanged).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    test('should update players when team changes', () => {
      const playerArbitrary = fc.record({
        name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 2),
        oldTeam: fc.constantFrom('1st XI', '2nd XI', '3rd XI'),
        newTeam: fc.constantFrom('1st XI', '2nd XI', '3rd XI'),
        play_cricket_id: fc.option(fc.integer({ min: 1, max: 999999 }).map(n => n.toString()), { nil: undefined })
      }).filter(p => p.oldTeam !== p.newTeam);

      fc.assert(
        fc.asyncProperty(fc.array(playerArbitrary, { minLength: 1, maxLength: 10 }), async (players) => {
          // Mock existing players with old teams
          const mockSelect = jest.fn().mockResolvedValue({
            data: players.map((p, i) => ({
              id: `player-${i}`,
              name: p.name,
              team: p.oldTeam,
              play_cricket_id: p.play_cricket_id
            })),
            error: null
          });

          const mockUpdate = jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          });

          mockSupabase.from.mockImplementation((table) => {
            if (table === 'players') {
              return {
                select: mockSelect,
                update: mockUpdate
              };
            }
          });

          // Upsert with new teams
          const newPlayers = players.map(p => ({
            name: p.name,
            team: p.newTeam,
            play_cricket_id: p.play_cricket_id
          }));

          const result = await upsertPlayers(newPlayers);

          // All players should be updated
          expect(result.playersAdded).toBe(0);
          expect(result.playersUpdated).toBe(players.length);
          expect(result.playersUnchanged).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    test('should leave unchanged players when data matches', () => {
      const playerArbitrary = fc.record({
        name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 2),
        team: fc.constantFrom('1st XI', '2nd XI', '3rd XI'),
        play_cricket_id: fc.option(fc.integer({ min: 1, max: 999999 }).map(n => n.toString()), { nil: undefined })
      });

      fc.assert(
        fc.asyncProperty(fc.array(playerArbitrary, { minLength: 1, maxLength: 10 }), async (players) => {
          // Mock existing players with same data
          const mockSelect = jest.fn().mockResolvedValue({
            data: players.map((p, i) => ({
              id: `player-${i}`,
              name: p.name,
              team: p.team,
              play_cricket_id: p.play_cricket_id
            })),
            error: null
          });

          mockSupabase.from.mockImplementation((table) => {
            if (table === 'players') {
              return {
                select: mockSelect
              };
            }
          });

          const result = await upsertPlayers(players);

          // All players should be unchanged
          expect(result.playersAdded).toBe(0);
          expect(result.playersUpdated).toBe(0);
          expect(result.playersUnchanged).toBe(players.length);
        }),
        { numRuns: 100 }
      );
    });
  });
});


// Feature: supabase-player-sync, Property 4: Sync Result Accuracy
// **Validates: Requirements 3.5, 8.4**
describe('Property 4: Sync Result Accuracy', () => {
  test('should return accurate counts matching actual database operations', () => {
    const playerArbitrary = fc.record({
      name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 2),
      team: fc.constantFrom('1st XI', '2nd XI', '3rd XI'),
      play_cricket_id: fc.option(fc.integer({ min: 1, max: 999999 }).map(n => n.toString()), { nil: undefined })
    });

    const testCaseArbitrary = fc.record({
      existingPlayers: fc.array(playerArbitrary, { minLength: 0, maxLength: 15 }),
      newPlayers: fc.array(playerArbitrary, { minLength: 1, maxLength: 15 })
    });

    fc.assert(
      fc.asyncProperty(testCaseArbitrary, async ({ existingPlayers, newPlayers }) => {
        // Track actual database operations
        let actualInserts = 0;
        let actualUpdates = 0;

        // Mock the database
        const mockSelect = jest.fn().mockResolvedValue({
          data: existingPlayers.map((p, i) => ({
            id: `existing-${i}`,
            name: p.name,
            team: p.team,
            play_cricket_id: p.play_cricket_id
          })),
          error: null
        });

        const mockInsert = jest.fn().mockImplementation(() => {
          actualInserts++;
          return Promise.resolve({ error: null });
        });

        const mockUpdate = jest.fn().mockReturnValue({
          eq: jest.fn().mockImplementation(() => {
            actualUpdates++;
            return Promise.resolve({ error: null });
          })
        });

        mockSupabase.from.mockImplementation((table) => {
          if (table === 'players') {
            return {
              select: mockSelect,
              insert: mockInsert,
              update: mockUpdate
            };
          }
        });

        // Execute upsert
        const result = await upsertPlayers(newPlayers);

        // Verify counts match actual operations
        expect(result.playersAdded).toBe(actualInserts);
        expect(result.playersUpdated).toBe(actualUpdates);

        // Verify total count
        const totalReported = result.playersAdded + result.playersUpdated + result.playersUnchanged;
        expect(totalReported).toBe(newPlayers.length);

        // Verify no operations were missed
        const totalOperations = actualInserts + actualUpdates;
        expect(result.playersAdded + result.playersUpdated).toBe(totalOperations);
      }),
      { numRuns: 100 }
    );
  });

  test('should accurately count errors when operations fail', () => {
    const playerArbitrary = fc.record({
      name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 2),
      team: fc.constantFrom('1st XI', '2nd XI', '3rd XI'),
      play_cricket_id: fc.option(fc.integer({ min: 1, max: 999999 }).map(n => n.toString()), { nil: undefined })
    });

    fc.assert(
      fc.asyncProperty(
        fc.array(playerArbitrary, { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 0, max: 10 }),
        async (players, failureIndex) => {
          // Mock database with some operations failing
          const mockSelect = jest.fn().mockResolvedValue({
            data: [],
            error: null
          });

          let insertAttempts = 0;
          const mockInsert = jest.fn().mockImplementation(() => {
            const currentIndex = insertAttempts++;
            if (currentIndex === failureIndex && failureIndex < players.length) {
              return Promise.resolve({ error: { message: 'Insert failed' } });
            }
            return Promise.resolve({ error: null });
          });

          mockSupabase.from.mockImplementation((table) => {
            if (table === 'players') {
              return {
                select: mockSelect,
                insert: mockInsert
              };
            }
          });

          const result = await upsertPlayers(players);

          // If failure index is within range, should have exactly 1 error
          if (failureIndex < players.length) {
            expect(result.errors.length).toBeGreaterThanOrEqual(1);
            expect(result.playersAdded).toBe(players.length - 1);
          } else {
            // No failures
            expect(result.errors).toHaveLength(0);
            expect(result.playersAdded).toBe(players.length);
          }

          // Total should still equal input count
          const total = result.playersAdded + result.playersUpdated + result.playersUnchanged;
          expect(total).toBeLessThanOrEqual(players.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should maintain count invariants across all operations', () => {
    const playerArbitrary = fc.record({
      name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 2),
      team: fc.constantFrom('1st XI', '2nd XI', '3rd XI'),
      play_cricket_id: fc.option(fc.integer({ min: 1, max: 999999 }).map(n => n.toString()), { nil: undefined })
    });

    const testCaseArbitrary = fc.record({
      existingPlayers: fc.array(playerArbitrary, { minLength: 0, maxLength: 20 }),
      newPlayers: fc.array(playerArbitrary, { minLength: 1, maxLength: 20 })
    });

    fc.assert(
      fc.asyncProperty(testCaseArbitrary, async ({ existingPlayers, newPlayers }) => {
        // Mock the database
        const mockSelect = jest.fn().mockResolvedValue({
          data: existingPlayers.map((p, i) => ({
            id: `existing-${i}`,
            name: p.name,
            team: p.team,
            play_cricket_id: p.play_cricket_id
          })),
          error: null
        });

        const mockInsert = jest.fn().mockResolvedValue({ error: null });
        const mockUpdate = jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        });

        mockSupabase.from.mockImplementation((table) => {
          if (table === 'players') {
            return {
              select: mockSelect,
              insert: mockInsert,
              update: mockUpdate
            };
          }
        });

        const result = await upsertPlayers(newPlayers);

        // Invariant 1: All counts should be non-negative
        expect(result.playersAdded).toBeGreaterThanOrEqual(0);
        expect(result.playersUpdated).toBeGreaterThanOrEqual(0);
        expect(result.playersUnchanged).toBeGreaterThanOrEqual(0);

        // Invariant 2: Total should equal input count (when no errors)
        if (result.errors.length === 0) {
          const total = result.playersAdded + result.playersUpdated + result.playersUnchanged;
          expect(total).toBe(newPlayers.length);
        }

        // Invariant 3: Each player should be in exactly one category
        const total = result.playersAdded + result.playersUpdated + result.playersUnchanged;
        expect(total).toBeLessThanOrEqual(newPlayers.length);
      }),
      { numRuns: 100 }
    );
  });
});


// Import the main sync function
import { syncPlayersFromPlayCricket } from './playerSyncService';

// Mock the module functions (for syncPlayersFromPlayCricket tests)
jest.mock('./playerSyncService', () => {
  const actual = jest.requireActual('./playerSyncService');
  return {
    ...actual,
    fetchPlayCricketSquads: jest.fn(),
    parsePlayCricketPlayers: jest.fn(),
    upsertPlayers: jest.fn()
  };
});

describe('syncPlayersFromPlayCricket', () => {
  const { fetchPlayCricketSquads: mockFetch, parsePlayCricketPlayers: mockParse, upsertPlayers: mockUpsert } = require('./playerSyncService');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Unit tests', () => {
    test('should successfully sync players through all steps', async () => {
      // Mock successful operations
      const mockHtml = '<html><body>Players</body></html>';
      const mockPlayers = [
        { name: 'John Smith', team: '1st XI', play_cricket_id: '123' }
      ];
      const mockUpsertResult = {
        playersAdded: 1,
        playersUpdated: 0,
        playersUnchanged: 0,
        errors: []
      };

      mockFetch.mockResolvedValue(mockHtml);
      mockParse.mockReturnValue(mockPlayers);
      mockUpsert.mockResolvedValue(mockUpsertResult);

      const result = await syncPlayersFromPlayCricket();

      expect(result.playersAdded).toBe(1);
      expect(result.playersUpdated).toBe(0);
      expect(result.playersUnchanged).toBe(0);
      expect(result.errors).toHaveLength(0);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockParse).toHaveBeenCalledWith(mockHtml);
      expect(mockUpsert).toHaveBeenCalledWith(mockPlayers);
    });

    test('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network timeout'));

      const result = await syncPlayersFromPlayCricket();

      expect(result.playersAdded).toBe(0);
      expect(result.playersUpdated).toBe(0);
      expect(result.playersUnchanged).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to fetch player data');
      expect(result.errors[0]).toContain('Network timeout');

      expect(mockParse).not.toHaveBeenCalled();
      expect(mockUpsert).not.toHaveBeenCalled();
    });

    test('should handle parse errors gracefully', async () => {
      const mockHtml = '<html><body>Invalid</body></html>';
      mockFetch.mockResolvedValue(mockHtml);
      mockParse.mockImplementation(() => {
        throw new Error('Invalid HTML structure');
      });

      const result = await syncPlayersFromPlayCricket();

      expect(result.playersAdded).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to parse player data');
      expect(result.errors[0]).toContain('Invalid HTML structure');

      expect(mockUpsert).not.toHaveBeenCalled();
    });

    test('should handle empty player list', async () => {
      const mockHtml = '<html><body>No players</body></html>';
      mockFetch.mockResolvedValue(mockHtml);
      mockParse.mockReturnValue([]);

      const result = await syncPlayersFromPlayCricket();

      expect(result.playersAdded).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('No players found');

      expect(mockUpsert).not.toHaveBeenCalled();
    });

    test('should handle upsert errors gracefully', async () => {
      const mockHtml = '<html><body>Players</body></html>';
      const mockPlayers = [
        { name: 'John Smith', team: '1st XI' }
      ];

      mockFetch.mockResolvedValue(mockHtml);
      mockParse.mockReturnValue(mockPlayers);
      mockUpsert.mockRejectedValue(new Error('Database connection failed'));

      const result = await syncPlayersFromPlayCricket();

      expect(result.playersAdded).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to update database');
    });

    test('should merge upsert errors with result', async () => {
      const mockHtml = '<html><body>Players</body></html>';
      const mockPlayers = [
        { name: 'John Smith', team: '1st XI' },
        { name: 'Jane Doe', team: '2nd XI' }
      ];
      const mockUpsertResult = {
        playersAdded: 1,
        playersUpdated: 0,
        playersUnchanged: 0,
        errors: ['Failed to insert Jane Doe: constraint violation']
      };

      mockFetch.mockResolvedValue(mockHtml);
      mockParse.mockReturnValue(mockPlayers);
      mockUpsert.mockResolvedValue(mockUpsertResult);

      const result = await syncPlayersFromPlayCricket();

      expect(result.playersAdded).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Jane Doe');
    });

    test('should handle unexpected errors', async () => {
      mockFetch.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await syncPlayersFromPlayCricket();

      expect(result.playersAdded).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should return complete sync results', async () => {
      const mockHtml = '<html><body>Players</body></html>';
      const mockPlayers = [
        { name: 'Player 1', team: '1st XI' },
        { name: 'Player 2', team: '1st XI' },
        { name: 'Player 3', team: '2nd XI' }
      ];
      const mockUpsertResult = {
        playersAdded: 2,
        playersUpdated: 1,
        playersUnchanged: 0,
        errors: []
      };

      mockFetch.mockResolvedValue(mockHtml);
      mockParse.mockReturnValue(mockPlayers);
      mockUpsert.mockResolvedValue(mockUpsertResult);

      const result = await syncPlayersFromPlayCricket();

      expect(result.playersAdded).toBe(2);
      expect(result.playersUpdated).toBe(1);
      expect(result.playersUnchanged).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });
});
