import React, { useState, useMemo } from 'react';
import { Calendar, Users, Plus, Edit2, Trash2, Save, X, Download, CheckCircle, Circle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useNetsSessions, usePlayers, useNetsStatistics } from '../hooks';

const SessionLogger = () => {
  const { sessions, loading, error, createSession, updateSession, deleteSession, refetch } = useNetsSessions();
  const { players } = usePlayers();
  const [editingSession, setEditingSession] = useState(null);
  const [showAddSession, setShowAddSession] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showAttendance, setShowAttendance] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  
  // Form state for new/edit session
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Form state for player detail modal
  const [playerFormData, setPlayerFormData] = useState({
    nets_attended: false,
    amount_due: '',
    session_batting_rating: '',
    session_bowling_rating: '',
    session_fielding_rating: '',
    session_fitness_rating: '',
    dismissals: '',
    wickets: '',
    extras: ''
  });

  // Get statistics for selected session
  const { statistics: sessionStats, updateStatistic, refetch: refetchStats } = useNetsStatistics(selectedSession?.id);

  // Reset form
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEditingSession(null);
    setShowAddSession(false);
  };

  // Handle create session
  const handleCreateSession = async () => {
    if (!formData.date) {
      alert('Please enter a session date');
      return;
    }

    try {
      const sessionId = await createSession({
        date: formData.date,
        notes: formData.notes || ''
      });
      
      // Create a session object to select immediately
      const newSession = {
        id: sessionId,
        session_date: formData.date,
        session_name: formData.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      resetForm();
      setSelectedSession(newSession);
    } catch (err) {
      alert(err.message || 'Failed to create session');
    }
  };

  // Handle update session
  const handleUpdateSession = async () => {
    if (!editingSession || !formData.date) {
      return;
    }

    try {
      await updateSession(editingSession.id, {
        session_date: formData.date,
        session_name: formData.notes || ''
      });
      resetForm();
      await refetch();
    } catch (err) {
      console.error('Update error:', err);
      alert(err.message || 'Failed to update session');
    }
  };

  // Handle delete session
  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session? This will also delete all associated statistics.')) {
      return;
    }

    try {
      await deleteSession(sessionId);
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
      await refetch();
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.message || 'Failed to delete session');
    }
  };

  // Update player session details (amount, skills, stats)
  const updatePlayerDetails = async (playerId, updates) => {
    if (!selectedSession) return;
    
    try {
      // Clean up the data - parse text to numbers where needed, or set to null
      const cleanedUpdates = { ...updates };
      
      // Parse amount_due: try to convert to number, otherwise null
      if (cleanedUpdates.amount_due === '' || cleanedUpdates.amount_due === null) {
        cleanedUpdates.amount_due = null;
      } else if (typeof cleanedUpdates.amount_due === 'string') {
        const parsed = parseFloat(cleanedUpdates.amount_due);
        cleanedUpdates.amount_due = isNaN(parsed) ? null : parsed;
      }
      
      // Parse rating fields: try to convert to integer, otherwise null
      const ratingFields = [
        'session_batting_rating',
        'session_bowling_rating', 
        'session_fielding_rating',
        'session_fitness_rating'
      ];
      
      ratingFields.forEach(field => {
        if (cleanedUpdates[field] === '' || cleanedUpdates[field] === null) {
          cleanedUpdates[field] = null;
        } else if (typeof cleanedUpdates[field] === 'string') {
          const parsed = parseInt(cleanedUpdates[field]);
          cleanedUpdates[field] = isNaN(parsed) ? null : parsed;
        }
      });
      
      // Parse performance stat fields: try to convert to integer, otherwise null
      const statFields = ['dismissals', 'wickets', 'extras'];
      statFields.forEach(field => {
        if (cleanedUpdates[field] === '' || cleanedUpdates[field] === null) {
          cleanedUpdates[field] = null;
        } else if (typeof cleanedUpdates[field] === 'string') {
          const parsed = parseInt(cleanedUpdates[field]);
          cleanedUpdates[field] = isNaN(parsed) ? null : parsed;
        }
      });
      
      await updateStatistic(playerId, cleanedUpdates);
      await refetchStats();
      setSelectedPlayer(null);
    } catch (err) {
      console.error('Update error:', err);
      alert(err.message || 'Failed to update player details');
    }
  };

  // Open player detail modal and initialize form
  const openPlayerModal = (player) => {
    const playerStat = sessionStats.find(s => s.player_id === player.id) || {};
    setPlayerFormData({
      nets_attended: playerStat.nets_attended || false,
      amount_due: playerStat.amount_due !== undefined && playerStat.amount_due !== null ? String(playerStat.amount_due) : '',
      session_batting_rating: playerStat.session_batting_rating !== undefined && playerStat.session_batting_rating !== null ? String(playerStat.session_batting_rating) : '',
      session_bowling_rating: playerStat.session_bowling_rating !== undefined && playerStat.session_bowling_rating !== null ? String(playerStat.session_bowling_rating) : '',
      session_fielding_rating: playerStat.session_fielding_rating !== undefined && playerStat.session_fielding_rating !== null ? String(playerStat.session_fielding_rating) : '',
      session_fitness_rating: playerStat.session_fitness_rating !== undefined && playerStat.session_fitness_rating !== null ? String(playerStat.session_fitness_rating) : '',
      dismissals: playerStat.dismissals !== undefined && playerStat.dismissals !== null ? String(playerStat.dismissals) : '',
      wickets: playerStat.wickets !== undefined && playerStat.wickets !== null ? String(playerStat.wickets) : '',
      extras: playerStat.extras !== undefined && playerStat.extras !== null ? String(playerStat.extras) : ''
    });
    setSelectedPlayer(player);
  };

  // Start editing a session
  const startEdit = (session) => {
    setEditingSession(session);
    setFormData({
      date: session.session_date,
      notes: session.session_name || ''
    });
    setShowAddSession(false);
  };

  // Calculate session statistics
  const getSessionStats = (sessionId) => {
    const stats = sessionStats.filter(s => s.session_id === sessionId);
    return {
      totalPlayers: stats.length,
      attended: stats.filter(s => s.nets_attended).length,
      totalDismissals: stats.reduce((sum, s) => sum + (s.dismissals || 0), 0),
      totalWickets: stats.reduce((sum, s) => sum + (s.wickets || 0), 0),
      totalExtras: stats.reduce((sum, s) => sum + (s.extras || 0), 0)
    };
  };

  // Export sessions to Excel with player-level details
  const exportToExcel = () => {
    // Create player-level export data
    const playerExportData = [];
    
    sessions.forEach(session => {
      const sessionPlayerStats = sessionStats.filter(s => s.session_id === session.id);
      
      sessionPlayerStats.forEach(stat => {
        const player = players.find(p => p.id === stat.player_id);
        if (player) {
          playerExportData.push({
            'Session Date': session.session_date,
            'Player Name': player.name,
            'Attended': stat.nets_attended ? 'Yes' : 'No',
            'Amount Due (£)': stat.amount_due || 0,
            'Batting Rating': stat.session_batting_rating || '',
            'Bowling Rating': stat.session_bowling_rating || '',
            'Fielding Rating': stat.session_fielding_rating || '',
            'Fitness Rating': stat.session_fitness_rating || '',
            'Dismissals': stat.dismissals || 0,
            'Wickets': stat.wickets || 0,
            'Extras': stat.extras || 0,
            'Session Notes': session.session_name || ''
          });
        }
      });
    });

    // Create session summary data
    const sessionSummaryData = sessions.map(session => {
      const stats = getSessionStats(session.id);
      const sessionPlayerStats = sessionStats.filter(s => s.session_id === session.id);
      const totalAmountDue = sessionPlayerStats.reduce((sum, s) => sum + (s.amount_due || 0), 0);
      
      return {
        'Date': session.session_date,
        'Players Attended': stats.attended,
        'Total Amount Due (£)': totalAmountDue.toFixed(2),
        'Total Dismissals': stats.totalDismissals,
        'Total Wickets': stats.totalWickets,
        'Total Extras': stats.totalExtras,
        'Notes': session.session_name || ''
      };
    });

    // Create workbook with two sheets
    const workbook = XLSX.utils.book_new();
    
    // Add player details sheet
    const playerSheet = XLSX.utils.json_to_sheet(playerExportData);
    playerSheet['!cols'] = [
      { wch: 12 },  // Session Date
      { wch: 20 },  // Player Name
      { wch: 10 },  // Attended
      { wch: 15 },  // Amount Due
      { wch: 14 },  // Batting Rating
      { wch: 14 },  // Bowling Rating
      { wch: 15 },  // Fielding Rating
      { wch: 14 },  // Fitness Rating
      { wch: 12 },  // Dismissals
      { wch: 10 },  // Wickets
      { wch: 10 },  // Extras
      { wch: 30 }   // Session Notes
    ];
    XLSX.utils.book_append_sheet(workbook, playerSheet, 'Player Details');
    
    // Add session summary sheet
    const summarySheet = XLSX.utils.json_to_sheet(sessionSummaryData);
    summarySheet['!cols'] = [
      { wch: 12 },  // Date
      { wch: 15 },  // Players Attended
      { wch: 18 },  // Total Amount Due
      { wch: 15 },  // Total Dismissals
      { wch: 12 },  // Total Wickets
      { wch: 12 },  // Total Extras
      { wch: 30 }   // Notes
    ];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Session Summary');
    
    XLSX.writeFile(workbook, `Cricket_Sessions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Sort sessions by date (newest first)
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => new Date(b.session_date) - new Date(a.session_date));
  }, [sessions]);

  // Calculate totals
  const totals = useMemo(() => {
    return {
      totalSessions: sessions.length
    };
  }, [sessions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Session Logger</h1>
              <p className="text-gray-600">Track nets sessions, dates, and amounts due</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddSession(true)}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
              >
                <Plus size={20} />
                <span>New Session</span>
              </button>
              <button
                onClick={exportToExcel}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
              >
                <Download size={20} />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="text-blue-600" size={32} />
                <div>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-800">{totals.totalSessions}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="text-purple-600" size={32} />
                <div>
                  <p className="text-sm text-gray-600">Total Players</p>
                  <p className="text-2xl font-bold text-gray-800">{players.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-blue-700 font-medium">Loading sessions...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-6 mb-6">
            <p className="text-red-700">{error.message}</p>
          </div>
        )}

        {/* Add/Edit Session Form */}
        {(showAddSession || editingSession) && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
              {editingSession ? 'Edit Session' : 'Add New Session'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={editingSession ? handleUpdateSession : handleCreateSession}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Save size={18} />
                {editingSession ? 'Update Session' : 'Create Session'}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Players Attended
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dismissals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wickets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Extras
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedSessions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <Calendar className="mx-auto mb-3 text-gray-400" size={48} />
                      <p className="text-lg font-medium">No sessions yet</p>
                      <p className="text-sm">Click "New Session" to create your first session</p>
                    </td>
                  </tr>
                ) : (
                  sortedSessions.map((session) => {
                    const stats = getSessionStats(session.id);
                    const isSelected = selectedSession?.id === session.id;
                    
                    return (
                      <tr 
                        key={session.id}
                        className={`hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-green-50' : ''}`}
                        onClick={() => setSelectedSession(session)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {new Date(session.session_date).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {stats.attended} players
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {stats.totalDismissals}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {stats.totalWickets}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {stats.totalExtras}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 truncate max-w-xs block">
                            {session.session_name || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(session);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit session"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSession(session.id);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete session"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Session Details */}
        {selectedSession && (
          <div className="mt-6 space-y-6">
            {/* Session Info Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  Session Details - {new Date(selectedSession.session_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </h3>
                <button
                  onClick={() => setShowAttendance(!showAttendance)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Users size={18} />
                  {showAttendance ? 'Hide' : 'Manage'} Attendance
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Session Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{selectedSession.session_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Notes:</span>
                      <span className="font-medium">{selectedSession.session_name || 'No notes'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Session Statistics</h4>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const stats = getSessionStats(selectedSession.id);
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Players Attended:</span>
                            <span className="font-medium">{stats.attended}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Dismissals:</span>
                            <span className="font-medium">{stats.totalDismissals}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Wickets:</span>
                            <span className="font-medium">{stats.totalWickets}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Extras:</span>
                            <span className="font-medium">{stats.totalExtras}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Player Attendance Card */}
            {showAttendance && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h4 className="text-lg font-bold mb-4">Player Session Details</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Click on a player to log attendance, amount due, skills, and performance
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {players.map(player => {
                    const playerStat = sessionStats.find(s => s.player_id === player.id);
                    const isPresent = playerStat?.nets_attended || false;
                    const amountDue = playerStat?.amount_due || 0;
                    
                    return (
                      <button
                        key={player.id}
                        onClick={() => openPlayerModal(player)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          isPresent
                            ? 'border-green-500 bg-green-50 hover:bg-green-100'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{player.name}</span>
                          {isPresent ? (
                            <CheckCircle className="text-green-600" size={20} />
                          ) : (
                            <Circle className="text-gray-400" size={20} />
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {isPresent ? 'Present' : 'Absent'}
                          {amountDue > 0 && ` • £${amountDue.toFixed(2)}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {players.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No players found. Add players first to mark attendance.
                  </p>
                )}
              </div>
            )}

            {/* Player Detail Modal */}
            {selectedPlayer && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-800">{selectedPlayer.name}</h3>
                      <button
                        onClick={() => setSelectedPlayer(null)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Attendance */}
                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={playerFormData.nets_attended}
                            onChange={(e) => setPlayerFormData({ ...playerFormData, nets_attended: e.target.checked })}
                            className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                          />
                          <span className="font-semibold text-gray-700">Player Attended Session</span>
                        </label>
                      </div>

                      {/* Amount Due */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount Due (£)
                        </label>
                        <input
                          type="text"
                          value={playerFormData.amount_due}
                          onChange={(e) => setPlayerFormData({ ...playerFormData, amount_due: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          placeholder="e.g., 15.00"
                        />
                      </div>

                      {/* Session Skills */}
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-3">Session Performance Ratings</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Batting</label>
                            <input
                              type="text"
                              value={playerFormData.session_batting_rating}
                              onChange={(e) => setPlayerFormData({ ...playerFormData, session_batting_rating: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                              placeholder="Enter rating"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bowling</label>
                            <input
                              type="text"
                              value={playerFormData.session_bowling_rating}
                              onChange={(e) => setPlayerFormData({ ...playerFormData, session_bowling_rating: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                              placeholder="Enter rating"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Fielding</label>
                            <input
                              type="text"
                              value={playerFormData.session_fielding_rating}
                              onChange={(e) => setPlayerFormData({ ...playerFormData, session_fielding_rating: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                              placeholder="Enter rating"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Fitness</label>
                            <input
                              type="text"
                              value={playerFormData.session_fitness_rating}
                              onChange={(e) => setPlayerFormData({ ...playerFormData, session_fitness_rating: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                              placeholder="Enter rating"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Performance Stats */}
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-3">Performance Statistics</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Dismissals</label>
                            <input
                              type="text"
                              value={playerFormData.dismissals}
                              onChange={(e) => setPlayerFormData({ ...playerFormData, dismissals: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                              placeholder="Enter count"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Wickets</label>
                            <input
                              type="text"
                              value={playerFormData.wickets}
                              onChange={(e) => setPlayerFormData({ ...playerFormData, wickets: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                              placeholder="Enter count"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Extras</label>
                            <input
                              type="text"
                              value={playerFormData.extras}
                              onChange={(e) => setPlayerFormData({ ...playerFormData, extras: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                              placeholder="Enter count"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t">
                        <button
                          onClick={() => updatePlayerDetails(selectedPlayer.id, playerFormData)}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                        >
                          Save Details
                        </button>
                        <button
                          onClick={() => setSelectedPlayer(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionLogger;
