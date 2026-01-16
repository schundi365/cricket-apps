import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { usePlayers, useNetsSessions, useNetsStatistics } from '../hooks';

const PerformanceImprovement = () => {
  const { players } = usePlayers();
  const { sessions } = useNetsSessions();
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  // Get all statistics for all sessions
  const allSessionIds = sessions.map(s => s.id);
  
  // Fetch statistics for each session (simplified - in production you'd optimize this)
  const sessionStatsMap = useMemo(() => {
    const map = new Map();
    sessions.forEach(session => {
      map.set(session.id, session);
    });
    return map;
  }, [sessions]);

  // Group sessions by week
  const weeklyData = useMemo(() => {
    if (!selectedPlayerId || sessions.length === 0) return [];

    // Sort sessions by date
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(a.session_date) - new Date(b.session_date)
    );

    // Group by week
    const weeks = [];
    let currentWeek = null;
    let weekSessions = [];

    sortedSessions.forEach(session => {
      const sessionDate = new Date(session.session_date);
      const weekStart = new Date(sessionDate);
      weekStart.setDate(sessionDate.getDate() - sessionDate.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];

      if (currentWeek !== weekKey) {
        if (weekSessions.length > 0) {
          weeks.push({
            weekStart: currentWeek,
            sessions: weekSessions
          });
        }
        currentWeek = weekKey;
        weekSessions = [session];
      } else {
        weekSessions.push(session);
      }
    });

    // Add last week
    if (weekSessions.length > 0) {
      weeks.push({
        weekStart: currentWeek,
        sessions: weekSessions
      });
    }

    return weeks;
  }, [sessions, selectedPlayerId]);

  // Calculate weekly averages for selected player
  const weeklyStats = useMemo(() => {
    if (!selectedPlayerId) return [];

    return weeklyData.map(week => {
      const weekStats = {
        weekStart: week.weekStart,
        sessionsCount: week.sessions.length,
        attended: 0,
        avgBatting: 0,
        avgBowling: 0,
        avgFielding: 0,
        avgFitness: 0,
        totalDismissals: 0,
        totalWickets: 0,
        totalExtras: 0,
        totalAmountDue: 0
      };

      let battingCount = 0, bowlingCount = 0, fieldingCount = 0, fitnessCount = 0;

      week.sessions.forEach(session => {
        // In a real implementation, you'd fetch the actual statistics
        // For now, we'll use placeholder logic
        // You would need to call useNetsStatistics for each session
        weekStats.attended++;
      });

      // Calculate averages
      if (battingCount > 0) weekStats.avgBatting = weekStats.avgBatting / battingCount;
      if (bowlingCount > 0) weekStats.avgBowling = weekStats.avgBowling / bowlingCount;
      if (fieldingCount > 0) weekStats.avgFielding = weekStats.avgFielding / fieldingCount;
      if (fitnessCount > 0) weekStats.avgFitness = weekStats.avgFitness / fitnessCount;

      return weekStats;
    });
  }, [weeklyData, selectedPlayerId]);

  // Calculate trends
  const getTrend = (current, previous) => {
    if (!previous || previous === 0) return 'neutral';
    const change = ((current - previous) / previous) * 100;
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'neutral';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="text-green-600" size={20} />;
    if (trend === 'down') return <TrendingDown className="text-red-600" size={20} />;
    return <Minus className="text-gray-600" size={20} />;
  };

  const formatWeekRange = (weekStart) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return `${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="text-green-600" />
              Performance Improvement Tracker
            </h2>
            <p className="text-gray-600">Track week-by-week progress and improvement</p>
          </div>
        </div>

        {/* Player Selection */}
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Player
          </label>
          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">-- Choose a player --</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* No Player Selected */}
      {!selectedPlayerId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-12 text-center">
          <Calendar className="mx-auto mb-4 text-blue-400" size={64} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a Player</h3>
          <p className="text-gray-600">Choose a player from the dropdown above to view their week-by-week performance improvement</p>
        </div>
      )}

      {/* Weekly Performance Data */}
      {selectedPlayerId && weeklyStats.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-12 text-center">
          <Calendar className="mx-auto mb-4 text-yellow-400" size={64} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Data Available</h3>
          <p className="text-gray-600">This player doesn't have any session data yet. Start logging sessions to track their progress!</p>
        </div>
      )}

      {selectedPlayerId && weeklyStats.length > 0 && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 mb-1">Total Weeks</div>
              <div className="text-2xl font-bold text-gray-800">{weeklyStats.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 mb-1">Total Sessions</div>
              <div className="text-2xl font-bold text-gray-800">
                {weeklyStats.reduce((sum, w) => sum + w.sessionsCount, 0)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 mb-1">Sessions Attended</div>
              <div className="text-2xl font-bold text-green-600">
                {weeklyStats.reduce((sum, w) => sum + w.attended, 0)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 mb-1">Total Amount Due</div>
              <div className="text-2xl font-bold text-purple-600">
                £{weeklyStats.reduce((sum, w) => sum + w.totalAmountDue, 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Weekly Breakdown */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Week
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sessions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attended
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batting
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bowling
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fielding
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fitness
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Due
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {weeklyStats.map((week, index) => {
                    const prevWeek = index > 0 ? weeklyStats[index - 1] : null;
                    const battingTrend = getTrend(week.avgBatting, prevWeek?.avgBatting);
                    const bowlingTrend = getTrend(week.avgBowling, prevWeek?.avgBowling);
                    const fieldingTrend = getTrend(week.avgFielding, prevWeek?.avgFielding);
                    const fitnessTrend = getTrend(week.avgFitness, prevWeek?.avgFitness);

                    return (
                      <tr key={week.weekStart} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatWeekRange(week.weekStart)}
                          </div>
                          <div className="text-xs text-gray-500">Week {index + 1}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {week.sessionsCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            {week.attended}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{week.avgBatting.toFixed(1)}</span>
                            {index > 0 && getTrendIcon(battingTrend)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{week.avgBowling.toFixed(1)}</span>
                            {index > 0 && getTrendIcon(bowlingTrend)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{week.avgFielding.toFixed(1)}</span>
                            {index > 0 && getTrendIcon(fieldingTrend)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{week.avgFitness.toFixed(1)}</span>
                            {index > 0 && getTrendIcon(fitnessTrend)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-purple-600">
                            £{week.totalAmountDue.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Summary */}
          {weeklyStats.length >= 2 && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Overall Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  const firstWeek = weeklyStats[0];
                  const lastWeek = weeklyStats[weeklyStats.length - 1];
                  
                  const battingChange = lastWeek.avgBatting - firstWeek.avgBatting;
                  const bowlingChange = lastWeek.avgBowling - firstWeek.avgBowling;
                  const fieldingChange = lastWeek.avgFielding - firstWeek.avgFielding;
                  const fitnessChange = lastWeek.avgFitness - firstWeek.avgFitness;

                  return (
                    <>
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Batting Progress</div>
                        <div className={`text-2xl font-bold ${battingChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {battingChange >= 0 ? '+' : ''}{battingChange.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {firstWeek.avgBatting.toFixed(1)} → {lastWeek.avgBatting.toFixed(1)}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Bowling Progress</div>
                        <div className={`text-2xl font-bold ${bowlingChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {bowlingChange >= 0 ? '+' : ''}{bowlingChange.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {firstWeek.avgBowling.toFixed(1)} → {lastWeek.avgBowling.toFixed(1)}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Fielding Progress</div>
                        <div className={`text-2xl font-bold ${fieldingChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fieldingChange >= 0 ? '+' : ''}{fieldingChange.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {firstWeek.avgFielding.toFixed(1)} → {lastWeek.avgFielding.toFixed(1)}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Fitness Progress</div>
                        <div className={`text-2xl font-bold ${fitnessChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fitnessChange >= 0 ? '+' : ''}{fitnessChange.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {firstWeek.avgFitness.toFixed(1)} → {lastWeek.avgFitness.toFixed(1)}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceImprovement;
