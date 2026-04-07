const { Client } = require('pg');

async function fix() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'matjip',
    user: 'yunho',
  });

  try {
    console.log('연결 시도 중...');
    await client.connect();
    console.log('✅ yunho 계정으로 연결 성공!');

    console.log('권한 수정 중...');
    await client.query('ALTER SCHEMA public OWNER TO matjip;');
    await client.query('GRANT ALL ON SCHEMA public TO matjip;');
    
    console.log('✅ 데이터베이스 권한 해결 완료!');
    await client.end();
  } catch (err) {
    console.error('❌ 실패:', err.message);
    process.exit(1);
  }
}

fix();
