const bcrypt = require('bcrypt');

async function generateHash() {
  const password = '123456';
  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Password hash for "123456":', hash);
}

generateHash().catch(console.error);
