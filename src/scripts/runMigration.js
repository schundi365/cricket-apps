/**
 * Migration Script
 * 
 * This script migrates hardcoded player data to Supabase.
 * It should be run once to transfer existing data.
 * 
 * Requirements: 4.1
 * 
 * Usage:
 *   node src/scripts/runMigration.js
 * 
 * Or from the React app console:
 *   import { runMigration } from './scripts/runMigration';
 *   runMigration();
 */

import { migrateHardcodedData } from '../utils/migration';

// Hardcoded player data from the original application
const hardcodedPlayers = [
  { name: "Aditya Aggarwal", team: null },
  { name: "Deepak Aggarwal", team: null },
  { name: "Vijay Anand Pandian", team: null },
  { name: "Sankar Krishna Anne", team: null },
  { name: "Vijay Baburaj", team: null },
  { name: "Basil Baby", team: null },
  { name: "Deepak Balakrishnan", team: null },
  { name: "Sathiya Sriram Balakrishnan", team: null },
  { name: "Santosh Ballary", team: null },
  { name: "Sunny Batra", team: null },
  { name: "Viren Bhatia", team: null },
  { name: "Deepak Bhatt", team: null },
  { name: "Rohit Bhola", team: null },
  { name: "Anand Kumar Billakanti", team: null },
  { name: "Arun Bonam", team: null },
  { name: "Vijay Bude", team: null },
  { name: "Harish Shetty", team: null },
  { name: "Varun Chadha", team: null },
  { name: "Abdallah Mohammed Zubair Chaiwalla", team: null },
  { name: "Khurram Chaiwalla", team: null },
  { name: "Utham Kumar Chandra", team: null },
  { name: "Krishna Chandran", team: null },
  { name: "Prasanna Chandran", team: null },
  { name: "Praveen Chandran", team: null },
  { name: "Ashlesh Chandrapu", team: null },
  { name: "Deepender Chauhan", team: null },
  { name: "Naga Sushen Chukka", team: null },
  { name: "Srikanth Chundi", team: null },
  { name: "Samik Dandy", team: null },
  { name: "Mohan Raj Deenathayalan", team: null },
  { name: "Vijay Dorepally", team: null },
  { name: "Kapil Dubey", team: null },
  { name: "Maneesh G", team: null },
  { name: "Sunil Gaurav", team: null },
  { name: "Karthik Gogga", team: null },
  { name: "Ashok K Govada", team: null },
  { name: "Rahul Gupta", team: null },
  { name: "Shree Hande", team: null },
  { name: "Abhinav Iarala", team: null },
  { name: "Advait Reddy Jakku", team: null },
  { name: "Balaji Kumar Jinka", team: null },
  { name: "Gimil Joseph", team: null },
  { name: "Taran Jouhal", team: null },
  { name: "Surender Karanam", team: null },
  { name: "Karan Kashyap", team: null },
  { name: "Shankker Kasinath", team: null },
  { name: "Neel Kavali", team: null },
  { name: "Mohamed Khalid", team: null },
  { name: "Shashi Kiran", team: null },
  { name: "Aravind Kolapalli", team: null },
  { name: "Nithin Kothakota", team: null },
  { name: "Adi Kotian", team: null },
  { name: "Deva P", team: null },
  { name: "Aniket Kulkarni", team: null },
  { name: "Arjun Kulkarni", team: null },
  { name: "Devesh Kumar", team: null },
  { name: "Senthil Kumar", team: null },
  { name: "Sharad Kumar", team: null },
  { name: "Vijeth Kumar", team: null },
  { name: "Vinodh Kumar", team: null },
  { name: "Ravikumar Kumashi", team: null },
  { name: "Jayesh Magodia", team: null },
  { name: "Ibrahim Malik", team: null },
  { name: "Vaman Mallipedda", team: null },
  { name: "Vandit Maram", team: null },
  { name: "Shailendra Mayekar", team: null },
  { name: "Kavinshankar Meenakshisundaram", team: null },
  { name: "Mohammed Zubair Mohammed Yousuf Chaiwalla", team: null },
  { name: "Vasu Muvvala", team: null },
  { name: "Ramasubramanian Namachivayam", team: null },
  { name: "Shiva Namala", team: null },
  { name: "Rajesh Varma", team: null },
  { name: "Yash Reddy", team: null },
  { name: "Srinidhi Narasimhan", team: null },
  { name: "Siddhu Narreddy", team: null },
  { name: "Abilash Natarajan", team: null },
  { name: "Himmat Natkar", team: null },
  { name: "Eashaan Nune", team: null },
  { name: "Manas Ranjan Panda", team: null },
  { name: "Jeen Pandya", team: null },
  { name: "Jignesh Pandya", team: null },
  { name: "Aditya Panwar", team: null },
  { name: "Purus Paran", team: null },
  { name: "Vikram Paritala", team: null },
  { name: "Naresh Paruchuri", team: null },
  { name: "Pinakin Patel", team: null },
  { name: "Sai Parasurama Pilla", team: null },
  { name: "Yashaswi Pokklandra Kumar", team: null },
  { name: "Anshul Poothi", team: null },
  { name: "Chander Poothi", team: null },
  { name: "Saish Prabhu", team: null },
  { name: "Brijesh Pradhan", team: null },
  { name: "Surya Prakash Kv", team: null },
  { name: "Swarish Pulimi", team: null },
  { name: "Sharat Putta", team: null },
  { name: "Aneesh Pyaraka", team: null },
  { name: "Raghav Pyaraka", team: null },
  { name: "Rishi Raavi", team: null },
  { name: "Harish Radhakrishnan", team: null },
  { name: "Rajesh Rajamannaar", team: null },
  { name: "Prasana R", team: null },
  { name: "Venkatesh Ravikumar", team: null },
  { name: "Nandeep Ravindranath", team: null },
  { name: "Rama Reddy", team: null },
  { name: "Suprabath Reddy", team: null },
  { name: "Saravana S", team: null },
  { name: "Sri Baba Narayan Sakamuri", team: null },
  { name: "Pradeep Samiappan", team: null },
  { name: "Chandan Reddy Sappidi", team: null },
  { name: "Yatin Sapra", team: null },
  { name: "Sunit Sar", team: null },
  { name: "Daniel Seelam", team: null },
  { name: "Manoj Nirupth Seelapaga", team: null },
  { name: "Amardeep Sehgal", team: null },
  { name: "Dipak Senapati", team: null },
  { name: "Vatsan S", team: null },
  { name: "Jayesh Shah", team: null },
  { name: "Abhishek Sharma", team: null },
  { name: "Gorang Sharma", team: null },
  { name: "Jatin Sharma", team: null },
  { name: "Rajeev Sharma", team: null },
  { name: "Sumeet Sharma", team: null },
  { name: "Niraj Shetgaonkar", team: null },
  { name: "Mangal Singh", team: null },
  { name: "Venkat Siva", team: null },
  { name: "Anup Sreekumaran", team: null },
  { name: "Dhandapani Srinivasan", team: null },
  { name: "Nirmal Sudan", team: null },
  { name: "Amir Taj", team: null },
  { name: "Nirav Thakkar", team: null },
  { name: "Punit Thakkar", team: null },
  { name: "Praveen Thottempudi", team: null },
  { name: "Ashwin Tigdoli", team: null },
  { name: "Kian Tigdoli", team: null },
  { name: "Chris Timms", team: null },
  { name: "Amit Trivedi", team: null },
  { name: "Srikiran Valluripalli", team: null },
  { name: "Sree Vatsan", team: null },
  { name: "Charantej Venkata", team: null },
  { name: "Amit Verma", team: null },
  { name: "Srishty Raj Vij", team: null },
  { name: "Veeresh Vishnupanthulu", team: null },
  { name: "Aravindan Vivekanandan", team: null },
  { name: "Pravin Yadav", team: null },
  { name: "Arbaaz Zahid", team: null }
];

// No hardcoded ratings or statistics in the original app
// Users will enter these through the UI
const hardcodedRatings = [];
const hardcodedStatistics = [];

/**
 * Run the migration
 */
export async function runMigration() {
  console.log('Starting migration...');
  console.log(`Players to migrate: ${hardcodedPlayers.length}`);
  console.log(`Ratings to migrate: ${hardcodedRatings.length}`);
  console.log(`Statistics to migrate: ${hardcodedStatistics.length}`);
  
  try {
    const result = await migrateHardcodedData(
      hardcodedPlayers,
      hardcodedRatings,
      hardcodedStatistics
    );
    
    console.log('\n=== Migration Complete ===');
    console.log(`Players inserted: ${result.playersInserted}`);
    console.log(`Ratings inserted: ${result.ratingsInserted}`);
    console.log(`Statistics inserted: ${result.statisticsInserted}`);
    
    if (result.errors.length > 0) {
      console.log('\nErrors encountered:');
      result.errors.forEach(error => console.error(`  - ${error}`));
    } else {
      console.log('\nNo errors encountered!');
    }
    
    return result;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// If running directly with Node.js
if (typeof require !== 'undefined' && require.main === module) {
  runMigration()
    .then(() => {
      console.log('\nMigration script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\nMigration script failed:', error);
      process.exit(1);
    });
}
