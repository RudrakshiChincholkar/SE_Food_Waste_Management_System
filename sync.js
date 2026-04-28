require('dotenv').config();
const { sequelize } = require('./models');

async function syncDatabase() {
  try {
    // 1. Test the connection
    await sequelize.authenticate();
    console.log('✅ Connection to PostgreSQL successful!');

    // 2. Sync models (This is the "Magic" that creates tables)
    // force: false means it won't delete your data if the table already exists
    await sequelize.sync({ alter: true }); 
    console.log('✅ All 9 tables have been created in fdlms_db.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing database:');
    console.error(error.message);
    process.exit(1);
  }
}

syncDatabase();