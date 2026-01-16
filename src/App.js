import React, { useState, useMemo } from 'react';
import { Search, TrendingUp, Award, Users, Calendar, UserPlus, Download, Settings, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import AdminPanel from './components/AdminPanel';
import SessionLogger from './components/SessionLogger';
import PerformanceImprovement from './components/PerformanceImprovement';
import { usePlayers, useSkillsRatings, useNetsSessions, useNetsStatistics } from './hooks';

const TrainingTracker = () => {
  // Fetch players from Supabase
  const { players: playersFromDb, loading: playersLoading, error: playersError, refetch: refetchPlayers } = usePlayers();
  
  // Fetch skills ratings from Supabase
  const { ratings: ratingsMap, loading: ratingsLoading, error: ratingsError, updateRating: updateRatingInDb } = useSkillsRatings();
  
  // Fetch nets sessions from Supabase
  const { sessions, loading: sessionsLoading, error: sessionsError } = useNetsSessions();
  
  // For simplicity, we'll use the most recent session or create a default one
  // In a full implementation, you'd have UI to select/create sessions
  const currentSessionId = sessions.length > 0 ? sessions[0].id : null;
  
  // Fetch nets statistics for current session
  const { statistics, loading: statisticsLoading, error: statisticsError, updateStatistic } = useNetsStatistics(currentSessionId);

  const skillCategories = [
    { name: 'Batting', skills: ['Technique', 'Shot Selection', 'Footwork', 'Power'] },
    { name: 'Bowling', skills: ['Accuracy', 'Pace/Spin', 'Variation', 'Line & Length'] },
    { name: 'Fielding', skills: ['Catching', 'Throwing', 'Ground Fielding', 'Agility'] },
    { name: 'Fitness', skills: ['Stamina', 'Speed', 'Strength', 'Flexibility'] }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [view, setView] = useState('list');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  // Use players directly from database
  const playersList = playersFromDb.map(player => player.name).sort();
  
  // Helper function to get player ID by name
  const getPlayerIdByName = (playerName) => {
    const player = playersFromDb.find(p => p.name === playerName);
    return player?.id;
  };
  
  // Helper function to get rating for a player by name
  const getPlayerRating = (playerName) => {
    const playerId = getPlayerIdByName(playerName);
    if (!playerId) return null;
    return ratingsMap.get(playerId);
  };
  
  // Helper function to get nets statistics for a player
  const getPlayerNetsStats = (playerName) => {
    const playerId = getPlayerIdByName(playerName);
    if (!playerId) return null;
    return statistics.find(stat => stat.player_id === playerId);
  };
  
  // Aggregate nets data across all sessions for display
  // Note: This is a simplified implementation. In production, you'd aggregate across all sessions
  const netsData = useMemo(() => {
    const data = {};
    playersFromDb.forEach(player => {
      const stats = getPlayerNetsStats(player.name);
      if (stats) {
        data[player.name] = {
          presentInNets: stats.attended ? 1 : 0,
          worksOnTechnique: 'No', // This field doesn't exist in DB, keeping for UI compatibility
          timesGotOut: stats.dismissals || 0,
          wicketsTaken: stats.wickets || 0,
          bowlingExtras: stats.extras || 0
        };
      }
    });
    return data;
  }, [playersFromDb, statistics]);

  const filteredPlayers = playersList.filter(player =>
    player.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addPlayer = () => {
    // TODO: Implement database insertion for new players
    // This will be implemented in a future task
    if (newPlayerName.trim()) {
      alert('Adding players to the database will be implemented in a future update.');
      setNewPlayerName('');
      setShowAddPlayer(false);
    }
  };

  const downloadExcel = () => {
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

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Player Stats');
    
    // Auto-size columns
    const maxWidth = exportData.reduce((w, r) => Math.max(w, Object.keys(r).length), 10);
    worksheet['!cols'] = Array(maxWidth).fill({ wch: 15 });
    
    XLSX.writeFile(workbook, `MK_Air_Cricket_Club_Stats_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const updateRating = async (player, category, skill, value) => {
    const playerId = getPlayerIdByName(player);
    if (!playerId) {
      console.error('Player not found:', player);
      return;
    }

    // Map category to database field
    const fieldMap = {
      'Batting': 'batting',
      'Bowling': 'bowling',
      'Fielding': 'fielding',
      'Fitness': 'fitness'
    };

    const field = fieldMap[category];
    if (!field) {
      console.error('Unknown category:', category);
      return;
    }

    try {
      await updateRatingInDb(playerId, { [field]: value });
    } catch (err) {
      console.error('Failed to update rating:', err);
      alert(err.message || 'Failed to save rating. Please try again.');
    }
  };

  const updateNetsData = async (player, field, value) => {
    const playerId = getPlayerIdByName(player);
    if (!playerId || !currentSessionId) {
      console.error('Player or session not found:', player, currentSessionId);
      return;
    }

    // Map UI fields to database fields
    const fieldMap = {
      'presentInNets': 'attended',
      'timesGotOut': 'dismissals',
      'wicketsTaken': 'wickets',
      'bowlingExtras': 'extras'
    };

    const dbField = fieldMap[field];
    if (!dbField) {
      // worksOnTechnique is not in DB, skip it
      if (field === 'worksOnTechnique') return;
      console.error('Unknown field:', field);
      return;
    }

    try {
      // Convert presentInNets (number) to attended (boolean)
      const dbValue = field === 'presentInNets' ? value > 0 : value;
      await updateStatistic(playerId, { [dbField]: dbValue });
    } catch (err) {
      console.error('Failed to update nets data:', err);
      alert(err.message || 'Failed to save nets data. Please try again.');
    }
  };

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

  const getTopPerformers = () => {
    return playersList
      .map(player => ({ 
        name: player, 
        avg: parseFloat(getPlayerAverage(player)),
        netsAttendance: netsData[player]?.presentInNets || 0
      }))
      .filter(p => p.avg > 0)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);
  };

  const getBestAttendance = () => {
    return playersList
      .map(player => ({ 
        name: player, 
        attendance: netsData[player]?.presentInNets || 0
      }))
      .filter(p => p.attendance > 0)
      .sort((a, b) => b.attendance - a.attendance)
      .slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">MK Air Cricket Club</h1>
              <p className="text-gray-600">Training Skills Tracker</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-lg ${view === 'list' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
                title="Player List"
              >
                <Users size={20} />
              </button>
              <button
                onClick={() => setView('leaderboard')}
                className={`px-4 py-2 rounded-lg ${view === 'leaderboard' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
                title="Leaderboard"
              >
                <Award size={20} />
              </button>
              <button
                onClick={() => setView('performance')}
                className={`px-4 py-2 rounded-lg ${view === 'performance' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
                title="Performance Improvement"
              >
                <TrendingUp size={20} />
              </button>
              <button
                onClick={() => setView('sessions')}
                className={`px-4 py-2 rounded-lg ${view === 'sessions' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
                title="Session Logger"
              >
                <FileText size={20} />
              </button>
              <button
                onClick={() => setView('admin')}
                className={`px-4 py-2 rounded-lg ${view === 'admin' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
                title="Admin Panel"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={() => setShowAddPlayer(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
              >
                <UserPlus size={20} />
                <span className="hidden md:inline">Add Player</span>
              </button>
              <button
                onClick={downloadExcel}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
              >
                <Download size={20} />
                <span className="hidden md:inline">Export</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Loading State */}
        {(playersLoading || ratingsLoading || sessionsLoading || statisticsLoading) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-blue-700 font-medium">Loading data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {(playersError || ratingsError || sessionsError || statisticsError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold mb-1">Error Loading Data</h3>
                {playersError && <p className="text-red-700 mb-2">{playersError.message}</p>}
                {ratingsError && <p className="text-red-700 mb-2">{ratingsError.message}</p>}
                {sessionsError && <p className="text-red-700 mb-2">{sessionsError.message}</p>}
                {statisticsError && <p className="text-red-700 mb-2">{statisticsError.message}</p>}
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Player Modal */}
        {showAddPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Add New Player</h3>
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                placeholder="Enter player name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={addPlayer}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add Player
                </button>
                <button
                  onClick={() => {
                    setShowAddPlayer(false);
                    setNewPlayerName('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard View */}
        {view === 'leaderboard' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Award className="text-yellow-500" />
                Top Performers (Skills)
              </h2>
              <div className="space-y-3">
                {getTopPerformers().map((player, index) => (
                  <div key={player.name} className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-green-50 rounded-lg">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-green-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{player.name}</p>
                      <p className="text-sm text-gray-600">{player.netsAttendance} nets sessions</p>
                    </div>
                    <div className="text-2xl font-bold text-green-700">{player.avg}</div>
                  </div>
                ))}
                {getTopPerformers().length === 0 && (
                  <p className="text-gray-500 text-center py-8">No ratings yet. Start rating players!</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="text-blue-500" />
                Best Attendance
              </h2>
              <div className="space-y-3">
                {getBestAttendance().map((player, index) => (
                  <div key={player.name} className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{player.name}</p>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">{player.attendance}</div>
                  </div>
                ))}
                {getBestAttendance().length === 0 && (
                  <p className="text-gray-500 text-center py-8">No attendance recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Admin View */}
        {view === 'admin' && (
          <div className="bg-white rounded-lg shadow-lg">
            <AdminPanel />
          </div>
        )}

        {/* Session Logger View */}
        {view === 'sessions' && (
          <SessionLogger />
        )}

        {/* Performance Improvement View */}
        {view === 'performance' && (
          <PerformanceImprovement />
        )}

        {/* Player List View */}
        {view === 'list' && !selectedPlayer && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Select a Player ({filteredPlayers.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {filteredPlayers.map(player => {
                const playerNetsData = netsData[player] || {};
                const attendance = playerNetsData.presentInNets || 0;
                
                return (
                  <button
                    key={player}
                    onClick={() => setSelectedPlayer(player)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{player}</span>
                      <div className="flex flex-col items-end gap-1">
                        {getPlayerAverage(player) > 0 && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                            {getPlayerAverage(player)}
                          </span>
                        )}
                        {attendance > 0 && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                            {attendance} nets
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Player Rating View */}
        {view === 'list' && selectedPlayer && (
          <div className="space-y-4">
            <button
              onClick={() => setSelectedPlayer(null)}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              ← Back to Player List
            </button>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedPlayer}</h2>
                  <p className="text-gray-600">Training Performance Tracker</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">{getPlayerAverage(selectedPlayer)}</div>
                  <div className="text-sm text-gray-500">Skills Average</div>
                </div>
              </div>

              {/* Nets Session Data */}
              <div className="mb-8 p-6 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-bold text-gray-700 mb-4">Nets Session Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Present in Nets
                    </label>
                    <input
                      type="text"
                      value={netsData[selectedPlayer]?.presentInNets || ''}
                      onChange={(e) => updateNetsData(selectedPlayer, 'presentInNets', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Works on Technique
                    </label>
                    <input
                      type="text"
                      value={netsData[selectedPlayer]?.worksOnTechnique || ''}
                      onChange={(e) => updateNetsData(selectedPlayer, 'worksOnTechnique', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter notes"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Times Got Out
                    </label>
                    <input
                      type="text"
                      value={netsData[selectedPlayer]?.timesGotOut || ''}
                      onChange={(e) => updateNetsData(selectedPlayer, 'timesGotOut', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wickets Taken
                    </label>
                    <input
                      type="text"
                      value={netsData[selectedPlayer]?.wicketsTaken || ''}
                      onChange={(e) => updateNetsData(selectedPlayer, 'wicketsTaken', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bowling Extras
                    </label>
                    <input
                      type="text"
                      value={netsData[selectedPlayer]?.bowlingExtras || ''}
                      onChange={(e) => updateNetsData(selectedPlayer, 'bowlingExtras', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Stats Summary */}
                {netsData[selectedPlayer]?.presentInNets > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {netsData[selectedPlayer]?.timesGotOut > 0 && (
                      <div className="bg-white p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-600">Dismissal Rate</div>
                        <div className="text-lg font-bold text-red-600">
                          {((netsData[selectedPlayer].timesGotOut / netsData[selectedPlayer].presentInNets) * 100).toFixed(1)}%
                        </div>
                      </div>
                    )}
                    {netsData[selectedPlayer]?.wicketsTaken > 0 && (
                      <div className="bg-white p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-600">Wickets/Session</div>
                        <div className="text-lg font-bold text-green-600">
                          {(netsData[selectedPlayer].wicketsTaken / netsData[selectedPlayer].presentInNets).toFixed(1)}
                        </div>
                      </div>
                    )}
                    {netsData[selectedPlayer]?.bowlingExtras > 0 && (
                      <div className="bg-white p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-600">Extras/Session</div>
                        <div className="text-lg font-bold text-orange-600">
                          {(netsData[selectedPlayer].bowlingExtras / netsData[selectedPlayer].presentInNets).toFixed(1)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Skills Rating */}
              <h3 className="text-lg font-bold text-gray-700 mb-4">Skills Rating (1-10)</h3>
              {skillCategories.map(category => {
                const playerRating = getPlayerRating(selectedPlayer);
                const fieldMap = {
                  'Batting': 'batting',
                  'Bowling': 'bowling',
                  'Fielding': 'fielding',
                  'Fitness': 'fitness'
                };
                const field = fieldMap[category.name];
                const currentRating = playerRating?.[field] || 0;
                
                return (
                  <div key={category.name} className="mb-6 pb-6 border-b last:border-b-0">
                    <h4 className="text-md font-bold text-gray-700 mb-4">{category.name}</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-700">Overall {category.name} Rating</span>
                        <span className="font-bold text-green-600">{currentRating}/10</span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
                          <button
                            key={value}
                            onClick={() => updateRating(selectedPlayer, category.name, null, value)}
                            className={`flex-1 h-8 rounded transition-colors ${
                              value <= currentRating
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Skills: {category.skills.join(', ')}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingTracker;