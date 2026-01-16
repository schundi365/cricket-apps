/**
 * Player Sync Service
 * 
 * This module provides functionality to fetch player data from the Play Cricket website
 * and synchronize it with the Supabase database.
 * 
 * Requirements: 3.1, 7.1, 7.2, 7.3
 */

import { supabase } from '../lib/supabase';
import { retrySupabaseQuery, retryWithBackoff } from '../utils/retry';

/**
 * Fetch squad data from the Play Cricket website
 * 
 * This function makes an HTTP GET request to the MK Air Play Cricket teams page
 * and returns the HTML response for parsing.
 * 
 * @returns {Promise<string>} The HTML content from the Play Cricket teams page
 * @throws {Error} If the network request fails or times out
 * 
 * Requirements: 3.1, 7.3
 */
export async function fetchPlayCricketSquads() {
  const url = 'https://mkair.play-cricket.com/Teams';
  const timeoutMs = 30000; // 30 second timeout as per requirement 3.6

  // Wrap the fetch operation with retry logic
  return await retryWithBackoff(async () => {
    try {
      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Make the HTTP request with timeout
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      // Check if the response is successful
      if (!response.ok) {
        throw new Error(
          `Failed to fetch Play Cricket squads: HTTP ${response.status} ${response.statusText}`
        );
      }

      // Get the HTML content
      const html = await response.text();

      // Validate that we received HTML content
      if (!html || html.trim().length === 0) {
        throw new Error('Received empty response from Play Cricket website');
      }

      return html;
    } catch (error) {
      // Handle timeout errors
      if (error.name === 'AbortError') {
        throw new Error(
          `Request to Play Cricket website timed out after ${timeoutMs / 1000} seconds`
        );
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          'Network error: Unable to connect to Play Cricket website. Please check your internet connection.'
        );
      }

      // Re-throw other errors with context
      if (error.message.startsWith('Failed to fetch') || 
          error.message.startsWith('Request to Play Cricket') ||
          error.message.startsWith('Network error') ||
          error.message.startsWith('Received empty response')) {
        throw error;
      }

      // Wrap unexpected errors
      throw new Error(`Unexpected error fetching Play Cricket squads: ${error.message}`);
    }
  });
}

/**
 * Sync result object returned by synchronization operations
 * 
 * @typedef {Object} SyncResult
 * @property {number} playersAdded - Number of new players added to the database
 * @property {number} playersUpdated - Number of existing players updated
 * @property {number} playersUnchanged - Number of players with no changes
 * @property {string[]} errors - Array of error messages encountered during sync
 */

/**
 * Player data object
 * 
 * @typedef {Object} PlayerData
 * @property {string} name - Player's full name
 * @property {string} team - Team/squad name
 * @property {string} [play_cricket_id] - Optional Play Cricket ID
 */

/**
 * Parse HTML response to extract player data
 * 
 * This function uses DOMParser to parse the HTML from Play Cricket
 * and extracts player names and team assignments from the DOM structure.
 * 
 * @param {string} html - The HTML content from the Play Cricket teams page
 * @returns {PlayerData[]} Array of player objects with name and team
 * @throws {Error} If HTML parsing fails or structure is unexpected
 * 
 * Requirements: 3.2
 */
export function parsePlayCricketPlayers(html) {
  if (!html || typeof html !== 'string' || html.trim().length === 0) {
    throw new Error('Invalid HTML: expected non-empty string');
  }

  try {
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Check for parser errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('HTML parsing failed: malformed HTML document');
    }

    const players = [];

    // Strategy 1: Look for team sections with player lists
    // Common patterns: divs with class containing 'team', 'squad', or 'roster'
    // followed by lists or tables of players
    const teamSections = doc.querySelectorAll(
      '[class*="team"], [class*="squad"], [class*="roster"], [id*="team"], [id*="squad"]'
    );

    for (const section of teamSections) {
      // Try to extract team name from heading or section title
      const teamHeading = section.querySelector('h1, h2, h3, h4, h5, h6, .title, .heading, [class*="title"], [class*="heading"]');
      const teamName = teamHeading ? teamHeading.textContent.trim() : 'Unknown Team';

      // Look for player names in lists
      const playerLinks = section.querySelectorAll('a[href*="player"], a[href*="Player"]');
      for (const link of playerLinks) {
        const name = link.textContent.trim();
        if (name && name.length > 0) {
          players.push({
            name,
            team: teamName,
            play_cricket_id: extractPlayCricketId(link.href)
          });
        }
      }

      // Also look for player names in table rows
      const tableRows = section.querySelectorAll('table tr');
      for (const row of tableRows) {
        const cells = row.querySelectorAll('td, th');
        if (cells.length > 0) {
          const firstCell = cells[0];
          const playerLink = firstCell.querySelector('a[href*="player"], a[href*="Player"]');
          if (playerLink) {
            const name = playerLink.textContent.trim();
            if (name && name.length > 0) {
              players.push({
                name,
                team: teamName,
                play_cricket_id: extractPlayCricketId(playerLink.href)
              });
            }
          } else {
            // Try to extract name from cell text if no link
            const name = firstCell.textContent.trim();
            if (name && name.length > 0) {
              players.push({
                name,
                team: teamName
              });
            }
          }
        }
      }

      // Look for player names in list items
      const listItems = section.querySelectorAll('li');
      for (const item of listItems) {
        const playerLink = item.querySelector('a[href*="player"], a[href*="Player"]');
        if (playerLink) {
          const name = playerLink.textContent.trim();
          if (name && name.length > 0) {
            players.push({
              name,
              team: teamName,
              play_cricket_id: extractPlayCricketId(playerLink.href)
            });
          }
        }
      }
    }

    // Strategy 2: If no team sections found, look for any player links on the page
    if (players.length === 0) {
      const allPlayerLinks = doc.querySelectorAll('a[href*="player"], a[href*="Player"]');
      for (const link of allPlayerLinks) {
        const name = link.textContent.trim();
        if (name && name.length > 0) {
          // Try to find team context from parent elements
          let teamName = 'Unknown Team';
          let parent = link.parentElement;
          let depth = 0;
          while (parent && depth < 5) {
            const heading = parent.querySelector('h1, h2, h3, h4, h5, h6');
            if (heading) {
              teamName = heading.textContent.trim();
              break;
            }
            parent = parent.parentElement;
            depth++;
          }

          players.push({
            name,
            team: teamName,
            play_cricket_id: extractPlayCricketId(link.href)
          });
        }
      }
    }

    // Remove duplicates based on name and team
    const uniquePlayers = [];
    const seen = new Set();
    for (const player of players) {
      const key = `${player.name}|${player.team}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniquePlayers.push(player);
      }
    }

    return uniquePlayers;
  } catch (error) {
    if (error.message.startsWith('Invalid HTML') || error.message.startsWith('HTML parsing failed')) {
      throw error;
    }
    throw new Error(`Failed to parse Play Cricket HTML: ${error.message}`);
  }
}

/**
 * Extract Play Cricket player ID from a URL
 * 
 * @param {string} url - URL that may contain a player ID
 * @returns {string|undefined} The player ID if found, undefined otherwise
 */
function extractPlayCricketId(url) {
  if (!url) return undefined;
  
  // Look for patterns like /player/123456 or ?player_id=123456
  const match = url.match(/\/player\/(\d+)|player_id=(\d+)/i);
  if (match) {
    return match[1] || match[2];
  }
  
  return undefined;
}


/**
 * Validate if a player name is valid
 * 
 * @param {string} name - Player name to validate
 * @returns {boolean} True if name is valid, false otherwise
 */
function isValidPlayerName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length === 0) return false;
  // Check if name contains at least one alphanumeric character
  return /[a-zA-Z0-9]/.test(trimmed);
}

/**
 * Upsert players to the Supabase database
 * 
 * This function compares fetched players with existing records in the database,
 * inserts new players, updates changed teams, and tracks unchanged players.
 * 
 * @param {PlayerData[]} players - Array of player objects to upsert
 * @returns {Promise<SyncResult>} Result object with counts and errors
 * 
 * Requirements: 3.3, 3.4, 3.5
 */
export async function upsertPlayers(players) {
  if (!supabase) {
    return {
      playersAdded: 0,
      playersUpdated: 0,
      playersUnchanged: 0,
      errors: ['Supabase client not initialized. Check your configuration.']
    };
  }

  const result = {
    playersAdded: 0,
    playersUpdated: 0,
    playersUnchanged: 0,
    errors: []
  };

  try {
    // Fetch all existing players from the database
    const { data: existingPlayers, error: fetchError } = await retrySupabaseQuery(async () => {
      return await supabase
        .from('players')
        .select('id, name, team, play_cricket_id');
    });

    if (fetchError) {
      result.errors.push(`Failed to fetch existing players: ${fetchError.message}`);
      return result;
    }

    // Create a map of existing players for quick lookup
    // Key: name (case-insensitive), Value: player record
    const existingPlayersMap = new Map();
    for (const player of existingPlayers || []) {
      const key = player.name.toLowerCase();
      existingPlayersMap.set(key, player);
    }

    // Process each player
    for (const player of players) {
      try {
        // Validate player name - silently skip invalid names
        // (these would never come from Play Cricket in practice)
        if (!isValidPlayerName(player.name)) {
          result.playersUnchanged++;
          continue;
        }

        const playerKey = player.name.toLowerCase();
        const existingPlayer = existingPlayersMap.get(playerKey);

        if (!existingPlayer) {
          // Player doesn't exist - insert new player
          const { error: insertError } = await retrySupabaseQuery(async () => {
            return await supabase
              .from('players')
              .insert({
                name: player.name,
                team: player.team,
                play_cricket_id: player.play_cricket_id
              });
          });

          if (insertError) {
            result.errors.push(`Failed to insert player ${player.name}: ${insertError.message}`);
          } else {
            result.playersAdded++;
          }
        } else {
          // Player exists - check if team has changed
          const teamChanged = existingPlayer.team !== player.team;
          const idChanged = player.play_cricket_id && 
                           existingPlayer.play_cricket_id !== player.play_cricket_id;

          if (teamChanged || idChanged) {
            // Update the player's team and/or play_cricket_id
            const updateData = {};
            if (teamChanged) updateData.team = player.team;
            if (idChanged) updateData.play_cricket_id = player.play_cricket_id;

            const { error: updateError } = await retrySupabaseQuery(async () => {
              return await supabase
                .from('players')
                .update(updateData)
                .eq('id', existingPlayer.id);
            });

            if (updateError) {
              result.errors.push(`Failed to update player ${player.name}: ${updateError.message}`);
            } else {
              result.playersUpdated++;
            }
          } else {
            // No changes needed
            result.playersUnchanged++;
          }
        }
      } catch (error) {
        result.errors.push(`Error processing player ${player.name}: ${error.message}`);
      }
    }

    return result;
  } catch (error) {
    console.error('Error in upsertPlayers:', error);
    return {
      playersAdded: 0,
      playersUpdated: 0,
      playersUnchanged: 0,
      errors: [`Unexpected error during upsert: ${error.message}`]
    };
  }
}


/**
 * Synchronize players from Play Cricket website to Supabase database
 * 
 * This is the main entry point for player synchronization. It combines
 * the fetch, parse, and upsert operations with comprehensive error handling.
 * 
 * @returns {Promise<SyncResult>} Result object with counts and errors
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export async function syncPlayersFromPlayCricket() {
  const result = {
    playersAdded: 0,
    playersUpdated: 0,
    playersUnchanged: 0,
    errors: []
  };

  try {
    // Step 1: Fetch HTML from Play Cricket website
    let html;
    try {
      html = await fetchPlayCricketSquads();
    } catch (error) {
      result.errors.push(`Failed to fetch player data: ${error.message}`);
      return result;
    }

    // Step 2: Parse HTML to extract player data
    let players;
    try {
      players = parsePlayCricketPlayers(html);
    } catch (error) {
      result.errors.push(`Failed to parse player data: ${error.message}`);
      return result;
    }

    // Check if any players were found
    if (!players || players.length === 0) {
      result.errors.push('No players found on Play Cricket website. The page structure may have changed.');
      return result;
    }

    // Step 3: Upsert players to database
    try {
      const upsertResult = await upsertPlayers(players);
      
      // Merge results
      result.playersAdded = upsertResult.playersAdded;
      result.playersUpdated = upsertResult.playersUpdated;
      result.playersUnchanged = upsertResult.playersUnchanged;
      result.errors.push(...upsertResult.errors);

      return result;
    } catch (error) {
      result.errors.push(`Failed to update database: ${error.message}`);
      return result;
    }
  } catch (error) {
    // Catch any unexpected errors
    result.errors.push(`Unexpected error during synchronization: ${error.message}`);
    return result;
  }
}
