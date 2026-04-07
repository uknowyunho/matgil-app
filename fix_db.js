const { Client } = require('pg');

async function fix() {
  // 1. 관리자 계정(postgres)으로 시도
  const adminConfig = {
    host: 'localhost',
    port: 5432,
    database: 'matjip',
    user: 'postgres',
    password: 'matjip_local', // 또는 비밀번호 없이 시도
  };

  // 2. 현재 사용자(matjip)로 시도
  const userConfig = {
    host: 'localhost',
    port: 5432,
    database: 'matjip',
    user: 'matjip',
    password: 'matjip_local',
  };

  const configs = [adminConfig, userConfig];

  for (const config of configs) {
    const client = new Client(config);
    try {
      console.log(`Attempting to connect as ${config.user}...`);
      await client.connect();
      console.log(`Connected successfully as ${config.user}!`);
      
      console.log('Granting permissions on schema public...');
      await client.query('ALTER SCHEMA public OWNER TO matjip;');
      await client.query('GRANT ALL ON SCHEMA public TO matjip;');
      
      console.log('✅ Permissions fixed successfully!');
      await client.end();
      return;
    } catch (err) {
      console.error(`Failed with user ${config.user}: ${err.message}`);
      try { await client.end(); } catch (e) {}
    }
  }

  console.error('❌ Could not fix permissions with any available user.');
  console.log('Please make sure your PostgreSQL server is running.');
}

fix();
