const bcrypt = require('bcrypt');

async function createPasswordHash() {
  const password = 'admin123';
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);
  console.log('Password hash for admin123:', hash);
}

createPasswordHash().catch(console.error);
