  const { spawn } = require('child_process');
const path = require('path');

const runCommand = (command, args) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
};

const seedAll = async () => {
  console.log('🌱 Starting fresh database migration and seeding...\n');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Step 1: Reset database
    console.log('📋 Step 1/4: Resetting database...');
    console.log('───────────────────────────────────────────────────');
    await runCommand('node', ['seeders/reset-database.js']);
    console.log('\n');

    // Step 2: Import admins
    console.log('📋 Step 2/4: Importing admin accounts...');
    console.log('───────────────────────────────────────────────────');
    await runCommand('node', ['seeders/import-admins.js']);
    console.log('\n');

    // Step 3: Import schools
    console.log('📋 Step 3/4: Importing schools data...');
    console.log('───────────────────────────────────────────────────');
    await runCommand('node', ['seeders/import-schools.js']);
    console.log('\n');

    // Step 4: Import student statistics
    console.log('📋 Step 4/4: Importing student statistics...');
    console.log('───────────────────────────────────────────────────');
    await runCommand('node', ['seeders/import-students.js']);
    console.log('\n');

    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 Fresh migration and seeding completed successfully!');
    console.log('═══════════════════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedAll();
