/**
 * React component to verify nets_sessions and nets_statistics tables
 * 
 * This component provides a UI to run verification tests for the nets tables
 * and displays the results in a user-friendly format.
 * 
 * Requirements: 2.3, 2.4
 */

import React, { useState } from 'react';
import { verifyNetsTables, getNetsTablesInfo } from '../lib/verifyNetsTables';

function VerifyNetsTables() {
  const [results, setResults] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runVerification = async () => {
    setIsRunning(true);
    setResults(null);
    setTableInfo(null);

    try {
      console.log('Starting nets tables verification...');
      const verificationResults = await verifyNetsTables();
      setResults(verificationResults);

      const info = await getNetsTablesInfo();
      setTableInfo(info);
    } catch (error) {
      setResults({
        sessionsTableExists: false,
        statisticsTableExists: false,
        errors: [`Unexpected error: ${error.message}`]
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status) => {
    return status ? '✓' : '✗';
  };

  const getStatusColor = (status) => {
    return status ? 'green' : 'red';
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Nets Tables Verification</h2>
      <p>
        This tool verifies that the nets_sessions and nets_statistics tables 
        were created correctly with all constraints and indexes.
      </p>

      <button
        onClick={runVerification}
        disabled={isRunning}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: isRunning ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {isRunning ? 'Running Tests...' : 'Run Verification Tests'}
      </button>

      {results && (
        <div style={{ marginTop: '20px' }}>
          <h3>Verification Results</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <h4>Table Existence</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ color: getStatusColor(results.sessionsTableExists) }}>
                {getStatusIcon(results.sessionsTableExists)} Sessions table exists
              </li>
              <li style={{ color: getStatusColor(results.statisticsTableExists) }}>
                {getStatusIcon(results.statisticsTableExists)} Statistics table exists
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4>Query Operations</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ color: getStatusColor(results.canQuerySessions) }}>
                {getStatusIcon(results.canQuerySessions)} Can query sessions
              </li>
              <li style={{ color: getStatusColor(results.canQueryStatistics) }}>
                {getStatusIcon(results.canQueryStatistics)} Can query statistics
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4>Insert Operations</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ color: getStatusColor(results.canInsertSession) }}>
                {getStatusIcon(results.canInsertSession)} Can insert session
              </li>
              <li style={{ color: getStatusColor(results.canInsertStatistic) }}>
                {getStatusIcon(results.canInsertStatistic)} Can insert statistic
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4>Constraints</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ color: getStatusColor(results.foreignKeysWork) }}>
                {getStatusIcon(results.foreignKeysWork)} Foreign key constraints work
              </li>
              <li style={{ color: getStatusColor(results.uniqueConstraintWorks) }}>
                {getStatusIcon(results.uniqueConstraintWorks)} Unique constraint works
              </li>
              <li style={{ color: getStatusColor(results.cascadeDeleteWorks) }}>
                {getStatusIcon(results.cascadeDeleteWorks)} CASCADE delete works
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4>Performance</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ color: getStatusColor(results.indexesExist) }}>
                {getStatusIcon(results.indexesExist)} Indexes exist
              </li>
            </ul>
          </div>

          {results.errors && results.errors.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ color: 'red' }}>Errors</h4>
              <ul style={{ color: 'red' }}>
                {results.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {tableInfo && tableInfo.success && (
            <div style={{ marginTop: '20px' }}>
              <h4>Table Structures</h4>
              
              <div style={{ marginBottom: '15px' }}>
                <h5>nets_sessions</h5>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  {tableInfo.sessionsMessage}
                </p>
                {tableInfo.sessionsStructure.length > 0 && (
                  <p style={{ fontSize: '14px', fontFamily: 'monospace' }}>
                    Columns: {tableInfo.sessionsStructure.join(', ')}
                  </p>
                )}
              </div>

              <div>
                <h5>nets_statistics</h5>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  {tableInfo.statisticsMessage}
                </p>
                {tableInfo.statisticsStructure.length > 0 && (
                  <p style={{ fontSize: '14px', fontFamily: 'monospace' }}>
                    Columns: {tableInfo.statisticsStructure.join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}

          <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
            <h4>Overall Status</h4>
            <p style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: results.errors.length === 0 && 
                     results.sessionsTableExists && 
                     results.statisticsTableExists &&
                     results.foreignKeysWork &&
                     results.uniqueConstraintWorks &&
                     results.cascadeDeleteWorks ? 'green' : 'red'
            }}>
              {results.errors.length === 0 && 
               results.sessionsTableExists && 
               results.statisticsTableExists &&
               results.foreignKeysWork &&
               results.uniqueConstraintWorks &&
               results.cascadeDeleteWorks
                ? '✓ All tests passed!'
                : '✗ Some tests failed'}
            </p>
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
        <h4>Instructions</h4>
        <ol>
          <li>Make sure you have run the migration file <code>003_create_nets_tables.sql</code> in Supabase SQL Editor</li>
          <li>Click "Run Verification Tests" to verify the tables were created correctly</li>
          <li>Check the console for detailed test output</li>
          <li>All tests should pass if the migration was successful</li>
        </ol>
      </div>
    </div>
  );
}

export default VerifyNetsTables;
