import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const login = async (username, password) => {
  const [users] = await pool.query(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );

  if (users.length === 0) {
    return null;
  }

  const user = users[0];

  // For demo: accept predefined passwords or check hash
  let isValid = false;
  
  // Demo passwords for easy testing
  const demoPasswords = {
    'admin': 'admin123',
    'operator': 'operator123',
    'engineer': 'engineer123'
  };
  
  if (demoPasswords[username] && password === demoPasswords[username]) {
    isValid = true;
  } else {
    isValid = await bcrypt.compare(password, user.password_hash);
  }

  if (!isValid) {
    return null;
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
};