// server/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL 연결 풀 설정 (Promise 기반)
const pool = mysql.createPool({
  host: process.env.DB_HOST,          // 예: 'localhost'
  user: process.env.DB_USER,          // 예: 'root'
  password: process.env.DB_PASSWORD,  // 예: 'password'
  database: process.env.DB_NAME,      // 예: 'your_database'
  waitForConnections: true,
  connectionLimit: 10,                // 최대 연결 수
  queueLimit: 0
});

// 연결 테스트 및 성공/실패 메시지 출력
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL 연결 성공!');
    connection.release();
  } catch (err) {
    console.error('MySQL 연결 실패:', err);
    process.exit(1); // 연결 실패 시 서버 종료
  }
})();

// 연결 풀 내보내기
module.exports = pool;