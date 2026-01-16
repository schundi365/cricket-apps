/**
 * Admin Panel Component
 * 
 * Provides administrative controls for player synchronization from Play Cricket website.
 * Displays sync status, results, and error messages.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import React, { useState, useEffect } from 'react';
import { syncPlayersFromPlayCricket } from '../services/playerSyncService';

const LAST_SYNC_KEY = 'lastPlayerSyncTimestamp';

export function AdminPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Load last sync time from localStorage on mount
  useEffect(() => {
    const storedTime = localStorage.getItem(LAST_SYNC_KEY);
    if (storedTime) {
      setLastSyncTime(new Date(storedTime));
    }
  }, []);

  // Handle sync button click
  const handleSyncPlayers = async () => {
    setLoading(true);
    setError(null);
    setSyncResult(null);

    try {
      const result = await syncPlayersFromPlayCricket();
      
      // Check if there were errors
      if (result.errors && result.errors.length > 0) {
        setError(result.errors.join('; '));
      } else {
        setSyncResult(result);
        
        // Save sync timestamp to localStorage
        const now = new Date();
        localStorage.setItem(LAST_SYNC_KEY, now.toISOString());
        setLastSyncTime(now);
      }
    } catch (err) {
      setError(`Sync failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (date) => {
    if (!date) return 'Never';
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Admin Panel</h2>
      
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Player Synchronization</h3>
        
        {/* Last Sync Timestamp */}
        <div style={styles.infoBox}>
          <strong>Last Sync:</strong> {formatTimestamp(lastSyncTime)}
        </div>

        {/* Sync Button */}
        <button
          onClick={handleSyncPlayers}
          disabled={loading}
          style={{
            ...styles.button,
            ...(loading && styles.buttonDisabled)
          }}
        >
          {loading ? (
            <span style={styles.buttonContent}>
              <span style={styles.spinner}></span>
              Syncing Players...
            </span>
          ) : (
            'Sync Players from Play Cricket'
          )}
        </button>

        {/* Loading Spinner (alternative display) */}
        {loading && (
          <div style={styles.loadingMessage}>
            <div style={styles.spinnerLarge}></div>
            <p>Fetching player data from Play Cricket website...</p>
          </div>
        )}

        {/* Success Result */}
        {syncResult && !error && (
          <div style={styles.successBox}>
            <h4 style={styles.resultTitle}>✓ Sync Completed Successfully</h4>
            <div style={styles.resultStats}>
              <div style={styles.statItem}>
                <span style={styles.statNumber}>{syncResult.playersAdded}</span>
                <span style={styles.statLabel}>Players Added</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statNumber}>{syncResult.playersUpdated}</span>
                <span style={styles.statLabel}>Players Updated</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statNumber}>{syncResult.playersUnchanged}</span>
                <span style={styles.statLabel}>Unchanged</span>
              </div>
            </div>
            <div style={styles.totalCount}>
              Total: {syncResult.playersAdded + syncResult.playersUpdated + syncResult.playersUnchanged} players processed
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={styles.errorBox}>
            <h4 style={styles.errorTitle}>✗ Sync Failed</h4>
            <p style={styles.errorMessage}>{error}</p>
            <button
              onClick={handleSyncPlayers}
              style={styles.retryButton}
            >
              Retry Sync
            </button>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div style={styles.helpText}>
        <p><strong>About Player Sync:</strong></p>
        <p>
          This tool fetches the latest squad information from the MK Air Play Cricket website
          and updates the player database. New players will be added, and team assignments
          will be updated for existing players.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
  },
  title: {
    marginTop: 0,
    marginBottom: '20px',
    color: '#333',
    fontSize: '28px',
    borderBottom: '2px solid #007bff',
    paddingBottom: '10px'
  },
  section: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px'
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: '15px',
    color: '#555',
    fontSize: '20px'
  },
  infoBox: {
    padding: '12px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    marginBottom: '15px',
    fontSize: '14px',
    color: '#495057'
  },
  button: {
    width: '100%',
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
    opacity: 0.7
  },
  buttonContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #ffffff',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.8s linear infinite'
  },
  loadingMessage: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#e7f3ff',
    border: '1px solid #b3d9ff',
    borderRadius: '4px',
    textAlign: 'center',
    color: '#004085'
  },
  spinnerLarge: {
    width: '40px',
    height: '40px',
    border: '4px solid #007bff',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    margin: '0 auto 15px',
    animation: 'spin 0.8s linear infinite'
  },
  successBox: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '4px',
    color: '#155724'
  },
  resultTitle: {
    marginTop: 0,
    marginBottom: '15px',
    fontSize: '18px',
    color: '#155724'
  },
  resultStats: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '15px',
    gap: '10px'
  },
  statItem: {
    flex: 1,
    textAlign: 'center',
    padding: '15px',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    border: '1px solid #c3e6cb'
  },
  statNumber: {
    display: 'block',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: '5px'
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  totalCount: {
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#155724'
  },
  errorBox: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '4px',
    color: '#721c24'
  },
  errorTitle: {
    marginTop: 0,
    marginBottom: '10px',
    fontSize: '18px',
    color: '#721c24'
  },
  errorMessage: {
    marginBottom: '15px',
    fontSize: '14px',
    lineHeight: '1.5'
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  helpText: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#6c757d',
    lineHeight: '1.6'
  }
};

// Add CSS animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default AdminPanel;
