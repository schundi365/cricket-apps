/**
 * Component to verify the players table was created correctly
 * 
 * This component provides a UI to test the players table structure
 * and basic operations after running the migration.
 * 
 * Requirements: 2.1
 */

import React, { useState } from 'react';
import { runAllVerificationTests } from '../lib/verifyPlayersTable';

function VerifyPlayersTable() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      // Capture console output
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };

      const success = await runAllVerificationTests();

      // Restore console.log
      console.log = originalLog;

      setResults({
        success,
        logs
      });
    } catch (error) {
      setResults({
        success: false,
        logs: [`Error running tests: ${error.message}`]
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '800px',
      margin: '20px auto',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h2 style={{ marginTop: 0 }}>Players Table Verification</h2>
      
      <p>
        This tool verifies that the players table was created correctly in Supabase.
        It will test:
      </p>
      
      <ul>
        <li>Table exists and can be queried</li>
        <li>Can insert new players</li>
        <li>Unique constraint on play_cricket_id works</li>
        <li>Table structure is correct</li>
      </ul>

      <button
        onClick={handleRunTests}
        disabled={isRunning}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: isRunning ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          marginTop: '10px'
        }}
      >
        {isRunning ? 'Running Tests...' : 'Run Verification Tests'}
      </button>

      {results && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: results.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${results.success ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px'
        }}>
          <h3 style={{ 
            marginTop: 0,
            color: results.success ? '#155724' : '#721c24'
          }}>
            {results.success ? '✓ All Tests Passed!' : '✗ Some Tests Failed'}
          </h3>
          
          <div style={{
            backgroundColor: '#fff',
            padding: '10px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            maxHeight: '400px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {results.logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '4px'
      }}>
        <h4 style={{ marginTop: 0 }}>Instructions:</h4>
        <ol>
          <li>Make sure you've run the SQL migration in Supabase SQL Editor</li>
          <li>Click "Run Verification Tests" above</li>
          <li>Check the results to ensure all tests pass</li>
          <li>Open the browser console (F12) to see detailed logs</li>
        </ol>
        <p style={{ marginBottom: 0 }}>
          <strong>Note:</strong> If tests fail, check that:
          <ul>
            <li>Your .env file has correct Supabase credentials</li>
            <li>The migration was run successfully in Supabase SQL Editor</li>
            <li>Your Supabase project is active and accessible</li>
          </ul>
        </p>
      </div>
    </div>
  );
}

export default VerifyPlayersTable;

