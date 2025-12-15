import * as authService from '../services/auth.service.js';

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const result = await authService.login(username, password);

    if (!result) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json(result);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
