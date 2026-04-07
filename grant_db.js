const { Client } = require('pg');

async function grant() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'matjip',
    user: 'matjip', // 이 사용자가 권한이 없다면 postgres 계정이 필요할 수 있습니다.
    password: 'matjip_local',
  });

  try {
    await client.connect();
    console.log('Connected to database');
    await client.query("GRANT ALL ON SCHEMA public TO matjip;");
    console.log('Granted all on schema public to matjip');
    await client.query("GRANT ALL ON ALL TABLES IN SCHEMA public TO matjip;");
    await client.query("GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO matjip;");
    await client.end();
  } catch (err) {
    console.error('Grant error:', err);
    process.exit(1);
  }
}

grant();
