/**
 * Type Definitions for Cricket App
 * 
 * This file contains JSDoc type definitions for the cricket app data models.
 * These types can be used for IDE autocomplete and type checking.
 * 
 * Requirements: 5.6
 * 
 * Usage:
 * 
 * To use these types in your JavaScript files, import them using JSDoc:
 * 
 * @example
 * // In your JavaScript file:
 * 
 * // Import the type
 * /**
 *  * @typedef {import('./types').NetsStatistic} NetsStatistic
 *  *\/
 * 
 * // Use the type in function parameters or return types
 * /**
 *  * @param {NetsStatistic} statistic - A nets statistic object
 *  * @returns {number} Total points
 *  *\/
 * function calculateTotalPoints(statistic) {
 *   return statistic.batting_points + 
 *          statistic.bowling_points + 
 *          statistic.fielding_points +
 *          statistic.technique_points +
 *          statistic.punctuality_points;
 * }
 * 
 * // Use Partial<Type> for partial objects
 * /**
 *  * @param {Partial<NetsStatistic>} updates - Partial statistic updates
 *  *\/
 * function updateStatistic(updates) {
 *   // ...
 * }
 */

/**
 * @typedef {Object} NetsStatistic
 * @property {string} id - UUID primary key
 * @property {string} session_id - UUID foreign key to nets_sessions
 * @property {string} player_id - UUID foreign key to players
 * @property {string} session_date - ISO date string (denormalized from nets_sessions)
 * @property {boolean} nets_attended - Whether the player attended the session (renamed from attended)
 * @property {boolean} works_on_technique - Whether player worked on technique during session
 * @property {boolean} punctual_to_training - Whether player arrived on time to session
 * @property {number} dismissals - Number of dismissals
 * @property {number} wickets - Number of wickets
 * @property {number} extras - Number of extras
 * @property {number} batting_points - Points awarded for batting performance
 * @property {number} bowling_points - Points awarded for bowling performance
 * @property {number} fielding_points - Points awarded for fielding performance
 * @property {number} technique_points - Points awarded for technique work (1 if works_on_technique, 0 otherwise)
 * @property {number} punctuality_points - Points awarded for punctuality (1 if punctual_to_training, 0 otherwise)
 * @property {string} created_at - ISO timestamp when record was created
 * @property {string} updated_at - ISO timestamp when record was last updated
 */

/**
 * @typedef {Object} NetsSession
 * @property {string} id - UUID primary key
 * @property {string} date - ISO date string
 * @property {string} notes - Session notes
 * @property {string} created_at - ISO timestamp when record was created
 * @property {string} updated_at - ISO timestamp when record was last updated
 */

/**
 * @typedef {Object} Player
 * @property {string} id - UUID primary key
 * @property {string} name - Player name
 * @property {string} team - Team name
 * @property {string} play_cricket_id - Play Cricket ID
 * @property {string} created_at - ISO timestamp when record was created
 * @property {string} updated_at - ISO timestamp when record was last updated
 */

/**
 * @typedef {Object} SkillsRating
 * @property {string} id - UUID primary key
 * @property {string} player_id - UUID foreign key to players
 * @property {number} batting - Batting rating
 * @property {number} bowling - Bowling rating
 * @property {number} fielding - Fielding rating
 * @property {string} created_at - ISO timestamp when record was created
 * @property {string} updated_at - ISO timestamp when record was last updated
 */

// Export empty object to make this a module
export {};
