const { Client } = require('pg');

async function reset() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'matjip',
    user: 'yunho',
  });

  try {
    console.log('데이터베이스 연결 중...');
    await client.connect();
    console.log('✅ 연결 성공!');

    console.log('기존 테이블 삭제 중 (CASCADE)...');
    await client.query('DROP TABLE IF EXISTS reviews, images, restaurants, restaurant_categories, categories, food_expenses, users CASCADE;');
    
    console.log('✅ 모든 테이블 삭제 완료!');
    console.log('이제 서버(npx ts-node src/main.ts)를 다시 켜면 테이블이 깨끗하게 생성됩니다.');
    await client.end();
  } catch (err) {
    console.error('❌ 실패:', err.message);
    process.exit(1);
  }
}

reset();
