/**
 * Component to verify the skills_ratings table
 * 
 * This component provides a UI to run verification tests for the skills_ratings table
 * after the migration has been applied.
 * 
 * Requirements: 2.2
 */

import React, { useState } from 'react';
import { runAllVerificationTests } from '../lib/verifySkillsRatingsTable';

export function VerifySkillsRatingsTable() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [logs, setLogs] = useState([]);

  const handleRunTests = async () => {
    setIsRunning(true);
    setResults(null);
    setLogs([]);

    // Capture console.log output
    const originalLog = console.log;
    const capturedLogs = [];
    console.log = (...args) => {
      capturedLogs.push(args.join(' '));
      originalLog(...args);
    };

    try {
      const allPassed = await runAllVerificationTests();
      setResults(allPassed);
      setLogs(capturedLogs);
    } catch (error) {
      capturedLogs.push(`Error: ${error.message}`);
      setResults(false);
      setLogs(capturedLogs);
    } finally {
      console.log = originalLog;
      setIsRunning(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '20px auto',
      fontFamily: 'monospace'
    }}>
      <h2>Skills Ratings Table Verification</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p>This tool verifies that the skills_ratings table was created correctly with:</p>
        <ul>
          <li>Proper table structure</li>
          <li>Foreign key constraint to players table</li>
          <li>Check constraints for rating values (0-10)</li>
          <li>Index on player_id</li>
          <li>CASCADE delete behavior</li>
        </ul>
      </div>

      <button 
        onClick={handleRunTests}
        disabled={isRunning}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: isRunning ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isRunning ? 'not-allowed' : 'pointer'
        }}
      >
        {isRunning ? 'Running Tests...' : 'Run Verification Tests'}
      </button>

      {results !== null && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: results ? '#d4edda' : '#f8d7da',
          border: `1px solid ${results ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          color: results ? '#155724' : '#721c24'
        }}>
          <strong>
            {results ? '✓ All tests passed!' : '✗ Some tests failed'}
          </strong>
        </div>
      )}

      {logs.length > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <h3>Test Output:</h3>
          <pre style={{ 
            margin: 0, 
            whiteSpace: 'pre-wrap',
            fontSize: '12px'
          }}>
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </pre>
        </div>
      )}

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '4px'
      }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Make sure you've run the migration <code>002_create_skills_ratings_table.sql</code> in Supabase SQL Editor</li>
          <li>Click "Run Verification Tests" to verify the table was created correctly</li>
          <li>Review the test output to see detailed results</li>
          <li>If any tests fail, check the error messages and verify the migration was applied correctly</li>
        </ol>
      </div>
    </div>
  );
}
