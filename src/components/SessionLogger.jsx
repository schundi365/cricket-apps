import React, { useState, useMemo } from 'react';
import { Calendar, DollarSign, Users, Plus, Edit2, Trash2, Save, X, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useNetsSessions, usePlayers, useNetsStatistics } from '../hooks';

const SessionLogger = () => {
  const { sessions, loading, error, createSession, updateSession, deleteSession } = useNetsSessions();
  const { players } = usePlayers();
  const [editingSession, setEditingSession] = useState(null);
  const [showAddSession, setShowAddSession] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  
  // Form state for new/edit session
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount_due: '',
    notes: ''
  });

  // Get statistics for selected session
  const { statistics: sessionStats } = useNetsStatistics(selectedSession?.id);

  // Reset form
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount_due: '',
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
        amount_due: parseFloat(formData.amount_due) || 0,
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
        date: formData.date,
        amount_due: parseFloat(formData.amount_due) || 0,
        notes: formData.notes || ''
      });
      resetForm();
    } catch (err) {
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
    } catch (err) {
      alert(err.message || 'Failed to delete session');
    }
  };

  // Start editing a session
  const startEdit = (session) => {
    setEditingSession(session);
    setFormData({
      date: session.date,
      amount_due: session.amount_due || '',
      notes: session.notes || ''
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
        'Date': session.date,
        'Amount Due': session.amount_due || 0,
        'Players Attended': stats.attended,
        'Total Dismissals': stats.totalDismissals,
        'Total Wickets': stats.totalWickets,
        'Total Extras': stats.totalExtras,
        'Notes': session.notes || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sessions');
    
    worksheet['!cols'] = [
      { wch: 12 },
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
    return [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [sessions]);

  // Calculate totals
  const totals = useMemo(() => {
    return {
      totalSessions: sessions.length,
      totalAmountDue: sessions.reduce((sum, s) => sum + (s.amount_due || 0), 0),
      averageAmountDue: sessions.length > 0 
        ? sessions.reduce((sum, s) => sum + (s.amount_due || 0), 0) / sessions.length 
        : 0
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="text-blue-600" size={32} />
                <div>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-800">{totals.totalSessions}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="text-green-600" size={32} />
                <div>
                  <p className="text-sm text-gray-600">Total Amount Due</p>
                  <p className="text-2xl font-bold text-gray-800">₹{totals.totalAmountDue.toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="text-purple-600" size={32} />
                <div>
                  <p className="text-sm text-gray-600">Average Amount/Session</p>
                  <p className="text-2xl font-bold text-gray-800">₹{totals.averageAmountDue.toFixed(2)}</p>
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                  Amount Due (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount_due}
                  onChange={(e) => setFormData({ ...formData, amount_due: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
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
                    Amount Due
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
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
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
                              {new Date(session.date).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <DollarSign size={16} className="text-green-600" />
                            <span className="font-semibold text-green-700">
                              ₹{(session.amount_due || 0).toFixed(2)}
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
                            {session.notes || '-'}
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
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">
              Session Details - {new Date(selectedSession.date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Session Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{selectedSession.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Due:</span>
                    <span className="font-medium text-green-700">₹{(selectedSession.amount_due || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Notes:</span>
                    <span className="font-medium">{selectedSession.notes || 'No notes'}</span>
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
        )}
      </div>
    </div>
  );
};

export default SessionLogger;
