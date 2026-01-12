import React, { useState } from 'react';
import { Search, TrendingUp, Award, Users, Calendar, UserPlus, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const TrainingTracker = () => {
  const players = [
    "Aditya Aggarwal", "Deepak Aggarwal", "Vijay Anand Pandian", "Sankar Krishna Anne",
    "Vijay Baburaj", "Basil Baby", "Deepak Balakrishnan", "Sathiya Sriram Balakrishnan",
    "Santosh Ballary", "Sunny Batra", "Viren Bhatia", "Deepak Bhatt", "Rohit Bhola",
    "Anand Kumar Billakanti", "Arun Bonam", "Vijay Bude", "Harish Shetty", "Varun Chadha",
    "Abdallah Mohammed Zubair Chaiwalla", "Khurram Chaiwalla", "Utham Kumar Chandra",
    "Krishna Chandran", "Prasanna Chandran", "Praveen Chandran", "Ashlesh Chandrapu",
    "Deepender Chauhan", "Naga Sushen Chukka", "Srikanth Chundi", "Samik Dandy",
    "Mohan Raj Deenathayalan", "Vijay Dorepally", "Kapil Dubey", "Maneesh G", "Sunil Gaurav",
    "Karthik Gogga", "Ashok K Govada", "Rahul Gupta", "Shree Hande", "Abhinav Iarala",
    "Advait Reddy Jakku", "Balaji Kumar Jinka", "Gimil Joseph", "Taran Jouhal",
    "Surender Karanam", "Karan Kashyap", "Shankker Kasinath", "Neel Kavali",
    "Mohamed Khalid", "Shashi Kiran", "Aravind Kolapalli", "Nithin Kothakota",
    "Adi Kotian", "Deva P", "Aniket Kulkarni", "Arjun Kulkarni", "Devesh Kumar",
    "Senthil Kumar", "Sharad Kumar", "Vijeth Kumar", "Vinodh Kumar", "Ravikumar Kumashi",
    "Jayesh Magodia", "Ibrahim Malik", "Vaman Mallipedda", "Vandit Maram",
    "Shailendra Mayekar", "Kavinshankar Meenakshisundaram",
    "Mohammed Zubair Mohammed Yousuf Chaiwalla", "Vasu Muvvala",
    "Ramasubramanian Namachivayam", "Shiva Namala", "Rajesh Varma", "Yash Reddy",
    "Srinidhi Narasimhan", "Siddhu Narreddy", "Abilash Natarajan", "Himmat Natkar",
    "Eashaan Nune", "Manas Ranjan Panda", "Jeen Pandya", "Jignesh Pandya",
    "Aditya Panwar", "Purus Paran", "Vikram Paritala", "Naresh Paruchuri",
    "Pinakin Patel", "Sai Parasurama Pilla", "Yashaswi Pokklandra Kumar", "Anshul Poothi",
    "Chander Poothi", "Saish Prabhu", "Brijesh Pradhan", "Surya Prakash Kv",
    "Swarish Pulimi", "Sharat Putta", "Aneesh Pyaraka", "Raghav Pyaraka", "Rishi Raavi",
    "Harish Radhakrishnan", "Rajesh Rajamannaar", "Prasana R", "Venkatesh Ravikumar",
    "Nandeep Ravindranath", "Rama Reddy", "Suprabath Reddy", "Saravana S",
    "Sri Baba Narayan Sakamuri", "Pradeep Samiappan", "Chandan Reddy Sappidi",
    "Yatin Sapra", "Sunit Sar", "Daniel Seelam", "Manoj Nirupth Seelapaga",
    "Amardeep Sehgal", "Dipak Senapati", "Vatsan S", "Jayesh Shah", "Abhishek Sharma",
    "Gorang Sharma", "Jatin Sharma", "Rajeev Sharma", "Sumeet Sharma",
    "Niraj Shetgaonkar", "Mangal Singh", "Venkat Siva", "Anup Sreekumaran",
    "Dhandapani Srinivasan", "Nirmal Sudan", "Amir Taj", "Nirav Thakkar",
    "Punit Thakkar", "Praveen Thottempudi", "Ashwin Tigdoli", "Kian Tigdoli",
    "Chris Timms", "Amit Trivedi", "Srikiran Valluripalli", "Sree Vatsan",
    "Charantej Venkata", "Amit Verma", "Srishty Raj Vij", "Veeresh Vishnupanthulu",
    "Aravindan Vivekanandan", "Pravin Yadav", "Arbaaz Zahid"
  ];

  const skillCategories = [
    { name: 'Batting', skills: ['Technique', 'Shot Selection', 'Footwork', 'Power'] },
    { name: 'Bowling', skills: ['Accuracy', 'Pace/Spin', 'Variation', 'Line & Length'] },
    { name: 'Fielding', skills: ['Catching', 'Throwing', 'Ground Fielding', 'Agility'] },
    { name: 'Fitness', skills: ['Stamina', 'Speed', 'Strength', 'Flexibility'] }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [ratings, setRatings] = useState({});
  const [netsData, setNetsData] = useState({});
  const [view, setView] = useState('list');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [playersList, setPlayersList] = useState(players);

  const filteredPlayers = playersList.filter(player =>
    player.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addPlayer = () => {
    if (newPlayerName.trim() && !playersList.includes(newPlayerName.trim())) {
      setPlayersList([...playersList, newPlayerName.trim()].sort());
      setNewPlayerName('');
      setShowAddPlayer(false);
    }
  };

  const downloadExcel = () => {
    const exportData = playersList.map(player => {
      const playerRatings = ratings[player] || {};
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

      // Add all skill ratings
      skillCategories.forEach(category => {
        category.skills.forEach(skill => {
          const key = `${category.name}-${skill}`;
          row[`${category.name} - ${skill}`] = playerRatings[key] || 0;
        });
      });

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

  const updateRating = (player, category, skill, value) => {
    setRatings(prev => ({
      ...prev,
      [player]: {
        ...prev[player],
        [`${category}-${skill}`]: value
      }
    }));
  };

  const updateNetsData = (player, field, value) => {
    setNetsData(prev => ({
      ...prev,
      [player]: {
        ...prev[player],
        [field]: value
      }
    }));
  };

  const getPlayerAverage = (player) => {
    const playerRatings = ratings[player] || {};
    const values = Object.values(playerRatings).filter(v => v > 0);
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
              >
                <Users size={20} />
              </button>
              <button
                onClick={() => setView('leaderboard')}
                className={`px-4 py-2 rounded-lg ${view === 'leaderboard' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
              >
                <Award size={20} />
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
                      type="number"
                      min="0"
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
                    <select
                      value={netsData[selectedPlayer]?.worksOnTechnique || 'No'}
                      onChange={(e) => updateNetsData(selectedPlayer, 'worksOnTechnique', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="No">No</option>
                      <option value="Sometimes">Sometimes</option>
                      <option value="Yes">Yes</option>
                      <option value="Always">Always</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Times Got Out
                    </label>
                    <input
                      type="number"
                      min="0"
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
                      type="number"
                      min="0"
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
                      type="number"
                      min="0"
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
              {skillCategories.map(category => (
                <div key={category.name} className="mb-6 pb-6 border-b last:border-b-0">
                  <h4 className="text-md font-bold text-gray-700 mb-4">{category.name}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.skills.map(skill => {
                      const key = `${category.name}-${skill}`;
                      const currentRating = ratings[selectedPlayer]?.[key] || 0;
                      
                      return (
                        <div key={skill} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between mb-2">
                            <span className="font-medium text-gray-700">{skill}</span>
                            <span className="font-bold text-green-600">{currentRating}/10</span>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
                              <button
                                key={value}
                                onClick={() => updateRating(selectedPlayer, category.name, skill, value)}
                                className={`flex-1 h-8 rounded transition-colors ${
                                  value <= currentRating
                                    ? 'bg-green-500 hover:bg-green-600'
                                    : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingTracker;