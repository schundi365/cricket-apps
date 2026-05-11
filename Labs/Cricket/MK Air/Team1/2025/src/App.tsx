import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Data Scientist CV Generator</h1>
        <p>Professional CV generator specifically tailored for Data Scientist positions</p>
      </header>
      <main>
        <div className="container">
          <p>
            Welcome to the Data Scientist CV Generator! This application will help you create
            professional, ATS-optimized CVs tailored specifically for data science roles.
          </p>
          <div className="features">
            <h2>Features</h2>
            <ul>
              <li>✨ Professional templates optimized for data science roles</li>
              <li>📊 Technical skills organization with proficiency levels</li>
              <li>🎯 ATS-friendly formatting for better job application success</li>
              <li>📄 Export to PDF and Word formats</li>
              <li>🔍 Real-time preview and validation</li>
              <li>💼 Project portfolio integration</li>
            </ul>
          </div>
          <div className="getting-started">
            <h2>Getting Started</h2>
            <p>The application is currently under development. Core features will be available soon!</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;