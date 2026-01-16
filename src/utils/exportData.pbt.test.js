/**
 * Property-Based Tests for Excel Export Data Completeness
 * 
 * Feature: supabase-player-sync
 * Property 13: Export Data Completeness
 * 
 * Validates: Requirements 10.3
 */

import fc from 'fast-check';
import * as XLSX from 'xlsx';

/**
 * Mock function to simulate the downloadExcel logic
 * This extracts the core export logic for testing
 */
function generateExportData(players, ratingsMap, statistics) {
  const playersList = players.map(p => p.name).sort();
  
  // Helper to get rating for a player
  const getPlayerRating = (playerName) => {
    const player = players.find(p => p.name === playerName);
    if (!player) return null;
    return ratingsMap.get(player.id);
  };
  
  // Helper to get nets stats for a player
  const getPlayerNetsStats = (playerName) => {
    const player = players.find(p => p.name === playerName);
    if (!player) return null;
    return statistics.find(stat => stat.player_id === player.id);
  };
  
  // Build netsData object
  const netsData = {};
  players.forEach(player => {
    const stats = getPlayerNetsStats(player.name);
    if (stats) {
      netsData[player.name] = {
        presentInNets: stats.attended ? 1 : 0,
        worksOnTechnique: 'No',
        timesGotOut: stats.dismissals || 0,
        wicketsTaken: stats.wickets || 0,
        bowlingExtras: stats.extras || 0
      };
    }
  });
  
  // Helper to get player average
  const getPlayerAverage = (player) => {
    const playerRating = getPlayerRating(player);
    if (!playerRating) return 0;
    
    const values = [
      playerRating.batting,
      playerRating.bowling,
      playerRating.fielding,
      playerRating.fitness
    ].filter(v => v && v > 0);
    
    if (values.length === 0) return 0;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };
  
  const exportData = playersList.map(player => {
    const playerRating = getPlayerRating(player);
    const playerNets = netsData[player] || {};
    
    const row = {
      'Player Name': player,
      'Skills Average': getPlayerAverage(player),
      'Present in Nets': playerNets.presentInNets || 0,
      'Works on Technique': playerNets.worksOnTechnique || 'No',
      'Times Got Out': playerNets.timesGotOut || 0,
      'Wickets Taken': playerNets.wicketsTaken || 0,
      'Bowling Extras': playerNets.bowlingExtras || 0,
    };

    // Add skill ratings from database
    if (playerRating) {
      row['Batting'] = playerRating.batting || 0;
      row['Bowling'] = playerRating.bowling || 0;
      row['Fielding'] = playerRating.fielding || 0;
      row['Fitness'] = playerRating.fitness || 0;
    }

    // Add calculated stats
    if (playerNets.presentInNets > 0) {
      if (playerNets.timesGotOut > 0) {
        row['Dismissal Rate (%)'] = ((playerNets.timesGotOut / playerNets.presentInNets) * 100).toFixed(1);
      }
      if (playerNets.wicketsTaken > 0) {
        row['Wickets per Session'] = (playerNets.wicketsTaken / playerNets.presentInNets).toFixed(1);
      }
      if (playerNets.bowlingExtras > 0) {
        row['Extras per Session'] = (playerNets.bowlingExtras / playerNets.presentInNets).toFixed(1);
      }
    }

    return row;
  });
  
  return exportData;
}

describe('Excel Export Data Completeness', () => {
  // Feature: supabase-player-sync, Property 13: Export Data Completeness
  test('Property 13: All players in database are included in export', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random players
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 30 }),
            team: fc.option(fc.constantFrom('1st XI', '2nd XI', 'U19'), { nil: null })
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (players) => {
          // Create empty ratings and statistics
          const ratingsMap = new Map();
          const statistics = [];
          
          // Generate export data
          const exportData = generateExportData(players, ratingsMap, statistics);
          
          // Verify all players are included
          expect(exportData.length).toBe(players.length);
          
          // Verify each player appears in export
          players.forEach(player => {
            const exportRow = exportData.find(row => row['Player Name'] === player.name);
            expect(exportRow).toBeDefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: supabase-player-sync, Property 13: Export Data Completeness
  test('Property 13: All ratings are included in export', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random players with ratings
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 30 }),
            team: fc.option(fc.constantFrom('1st XI', '2nd XI', 'U19'), { nil: null })
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (players) => {
          // Create ratings for all players
          const ratingsMap = new Map();
          players.forEach(player => {
            ratingsMap.set(player.id, {
              player_id: player.id,
              batting: Math.floor(Math.random() * 11),
              bowling: Math.floor(Math.random() * 11),
              fielding: Math.floor(Math.random() * 11),
              fitness: Math.floor(Math.random() * 11)
            });
          });
          
          const statistics = [];
          
          // Generate export data
          const exportData = generateExportData(players, ratingsMap, statistics);
          
          // Verify all ratings are included
          players.forEach(player => {
            const exportRow = exportData.find(row => row['Player Name'] === player.name);
            const rating = ratingsMap.get(player.id);
            
            expect(exportRow['Batting']).toBe(rating.batting);
            expect(exportRow['Bowling']).toBe(rating.bowling);
            expect(exportRow['Fielding']).toBe(rating.fielding);
            expect(exportRow['Fitness']).toBe(rating.fitness);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: supabase-player-sync, Property 13: Export Data Completeness
  test('Property 13: All statistics are included in export', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random players with statistics
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 30 }),
            team: fc.option(fc.constantFrom('1st XI', '2nd XI', 'U19'), { nil: null })
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (players) => {
          const ratingsMap = new Map();
          
          // Create statistics for all players
          const statistics = players.map(player => ({
            player_id: player.id,
            session_id: 'test-session',
            attended: Math.random() > 0.5,
            dismissals: Math.floor(Math.random() * 10),
            wickets: Math.floor(Math.random() * 10),
            extras: Math.floor(Math.random() * 10)
          }));
          
          // Generate export data
          const exportData = generateExportData(players, ratingsMap, statistics);
          
          // Verify all statistics are included
          players.forEach(player => {
            const exportRow = exportData.find(row => row['Player Name'] === player.name);
            const stat = statistics.find(s => s.player_id === player.id);
            
            expect(exportRow['Present in Nets']).toBe(stat.attended ? 1 : 0);
            expect(exportRow['Times Got Out']).toBe(stat.dismissals);
            expect(exportRow['Wickets Taken']).toBe(stat.wickets);
            expect(exportRow['Bowling Extras']).toBe(stat.extras);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
