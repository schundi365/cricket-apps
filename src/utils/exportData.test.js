/**
 * Unit Tests for Excel Export Format Compatibility
 * 
 * Validates: Requirements 10.4
 */

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

describe('Excel Export Format Compatibility', () => {
  test('exported Excel has correct base columns', () => {
    const players = [
      { id: '1', name: 'John Doe', team: '1st XI' },
      { id: '2', name: 'Jane Smith', team: '2nd XI' }
    ];
    
    const ratingsMap = new Map();
    const statistics = [];
    
    const exportData = generateExportData(players, ratingsMap, statistics);
    
    // Check that base columns exist
    const requiredColumns = [
      'Player Name',
      'Skills Average',
      'Present in Nets',
      'Works on Technique',
      'Times Got Out',
      'Wickets Taken',
      'Bowling Extras'
    ];
    
    exportData.forEach(row => {
      requiredColumns.forEach(column => {
        expect(row).toHaveProperty(column);
      });
    });
  });

  test('data is formatted correctly with ratings', () => {
    const players = [
      { id: '1', name: 'John Doe', team: '1st XI' }
    ];
    
    const ratingsMap = new Map([
      ['1', {
        player_id: '1',
        batting: 8,
        bowling: 7,
        fielding: 9,
        fitness: 6
      }]
    ]);
    
    const statistics = [];
    
    const exportData = generateExportData(players, ratingsMap, statistics);
    
    expect(exportData[0]['Player Name']).toBe('John Doe');
    expect(exportData[0]['Batting']).toBe(8);
    expect(exportData[0]['Bowling']).toBe(7);
    expect(exportData[0]['Fielding']).toBe(9);
    expect(exportData[0]['Fitness']).toBe(6);
    expect(exportData[0]['Skills Average']).toBe('7.5'); // (8+7+9+6)/4 = 7.5
  });

  test('data is formatted correctly with statistics', () => {
    const players = [
      { id: '1', name: 'John Doe', team: '1st XI' }
    ];
    
    const ratingsMap = new Map();
    
    const statistics = [
      {
        player_id: '1',
        session_id: 'session-1',
        attended: true,
        dismissals: 3,
        wickets: 5,
        extras: 2
      }
    ];
    
    const exportData = generateExportData(players, ratingsMap, statistics);
    
    expect(exportData[0]['Player Name']).toBe('John Doe');
    expect(exportData[0]['Present in Nets']).toBe(1);
    expect(exportData[0]['Times Got Out']).toBe(3);
    expect(exportData[0]['Wickets Taken']).toBe(5);
    expect(exportData[0]['Bowling Extras']).toBe(2);
  });

  test('calculated fields are accurate', () => {
    const players = [
      { id: '1', name: 'John Doe', team: '1st XI' }
    ];
    
    const ratingsMap = new Map();
    
    const statistics = [
      {
        player_id: '1',
        session_id: 'session-1',
        attended: true,
        dismissals: 4,
        wickets: 6,
        extras: 3
      }
    ];
    
    const exportData = generateExportData(players, ratingsMap, statistics);
    
    // Dismissal Rate = (4/1) * 100 = 400%
    expect(exportData[0]['Dismissal Rate (%)']).toBe('400.0');
    
    // Wickets per Session = 6/1 = 6.0
    expect(exportData[0]['Wickets per Session']).toBe('6.0');
    
    // Extras per Session = 3/1 = 3.0
    expect(exportData[0]['Extras per Session']).toBe('3.0');
  });

  test('handles players with no ratings gracefully', () => {
    const players = [
      { id: '1', name: 'John Doe', team: '1st XI' }
    ];
    
    const ratingsMap = new Map();
    const statistics = [];
    
    const exportData = generateExportData(players, ratingsMap, statistics);
    
    expect(exportData[0]['Player Name']).toBe('John Doe');
    expect(exportData[0]['Skills Average']).toBe(0);
    expect(exportData[0]['Batting']).toBeUndefined();
    expect(exportData[0]['Bowling']).toBeUndefined();
  });

  test('handles players with no statistics gracefully', () => {
    const players = [
      { id: '1', name: 'John Doe', team: '1st XI' }
    ];
    
    const ratingsMap = new Map();
    const statistics = [];
    
    const exportData = generateExportData(players, ratingsMap, statistics);
    
    expect(exportData[0]['Player Name']).toBe('John Doe');
    expect(exportData[0]['Present in Nets']).toBe(0);
    expect(exportData[0]['Times Got Out']).toBe(0);
    expect(exportData[0]['Wickets Taken']).toBe(0);
    expect(exportData[0]['Bowling Extras']).toBe(0);
  });

  test('players are sorted alphabetically', () => {
    const players = [
      { id: '3', name: 'Charlie Brown', team: '1st XI' },
      { id: '1', name: 'Alice Smith', team: '2nd XI' },
      { id: '2', name: 'Bob Jones', team: '1st XI' }
    ];
    
    const ratingsMap = new Map();
    const statistics = [];
    
    const exportData = generateExportData(players, ratingsMap, statistics);
    
    expect(exportData[0]['Player Name']).toBe('Alice Smith');
    expect(exportData[1]['Player Name']).toBe('Bob Jones');
    expect(exportData[2]['Player Name']).toBe('Charlie Brown');
  });

  test('skills average calculation excludes zero ratings', () => {
    const players = [
      { id: '1', name: 'John Doe', team: '1st XI' }
    ];
    
    const ratingsMap = new Map([
      ['1', {
        player_id: '1',
        batting: 8,
        bowling: 0,
        fielding: 6,
        fitness: 0
      }]
    ]);
    
    const statistics = [];
    
    const exportData = generateExportData(players, ratingsMap, statistics);
    
    // Average should be (8+6)/2 = 7.0, not (8+0+6+0)/4 = 3.5
    expect(exportData[0]['Skills Average']).toBe('7.0');
  });
});
