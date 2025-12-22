const jwt = require('./server/node_modules/jsonwebtoken');

const token = jwt.sign(
  {
    userId: '7054e764-d83f-472e-b5c9-05d2d633bd66',
    username: 'admin',
    name: '系统管理员',
    role: 'ADMIN',
    schoolId: '625e503b-aa7e-44fe-9982-237d828af717'
  },
  'arkok-v2-super-secret-jwt-key-2024',
  { expiresIn: '7d' }
);

console.log(token);