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
  
  // Form state for new/edit session
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: ''
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
      await createSession({
        date: formData.date,
        notes: formData.notes || ''
      });
      resetForm();
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

  // Toggle player attendance
  const toggleAttendance = async (playerId, currentStatus) => {
    if (!selectedSession) return;
    
    try {
      await updateStatistic(playerId, {
        nets_attended: !currentStatus
      });
      await refetchStats();
    } catch (err) {
      console.error('Attendance error:', err);
      alert(err.message || 'Failed to update attendance');
    }
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

  // Export sessions to Excel
  const exportToExcel = () => {
    const exportData = sessions.map(session => {
      const stats = getSessionStats(session.id);
      return {
        'Date': session.session_date,
        'Players Attended': stats.attended,
        'Total Dismissals': stats.totalDismissals,
        'Total Wickets': stats.totalWickets,
        'Total Extras': stats.totalExtras,
        'Notes': session.session_name || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sessions');
    
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 30 }
    ];
    
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
                <h4 className="text-lg font-bold mb-4">Player Attendance</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Click on a player to mark them as present or absent for this session
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {players.map(player => {
                    const playerStat = sessionStats.find(s => s.player_id === player.id);
                    const isPresent = playerStat?.nets_attended || false;
                    
                    return (
                      <button
                        key={player.id}
                        onClick={() => toggleAttendance(player.id, isPresent)}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionLogger;
