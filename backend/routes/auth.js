// server/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Promise 기반 연결 풀 임포트

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

// 회원가입 엔드포인트
router.post('/register', async (req, res) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ success: false, message: '이메일, 이름, 비밀번호를 모두 입력하세요.' });
  }

  try {
    // 1. 데이터베이스에서 email 중복 확인
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: '이미 사용 중인 이메일입니다.' });
    }

    // 2. 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. 새로운 사용자 삽입
    const [insertResult] = await db.query('INSERT INTO users (email, password, name, googleId) VALUES (?, ?, ?, ?)', [email, hashedPassword, name, 'NULL']);

    res.status(201).json({ success: true, message: '회원가입 성공!' });
  } catch (error) {
    console.error('회원가입 에러:', error);
    res.status(500).json({ success: false, message: '서버 오류.' });
  }
});

// 로그인 엔드포인트
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: '이메일과 비밀번호를 입력하세요.' });
  }

  try {
    // 데이터베이스에서 사용자 조회
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    const user = users[0];

    if (user.googleId !== 'NULL') {
      return res.status(400).json({ success: false, message: '이 이메일은 소셜 계정으로 등록되었습니다. 구글 로그인을 이용해주세요.' });
    }

    // 비밀번호 검증
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '비밀번호가 올바르지 않습니다.' });
    }

    // JWT 생성
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ 
      success: true, 
      message: '로그인 성공!', 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      } 
    });
  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({ success: false, message: '서버 오류.' });
  }
});

module.exports = router;
