const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'admin123';
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('Password:', password);
  console.log('Hash:', hash);
  
  // Проверка
  const isMatch = await bcrypt.compare(password, hash);
  console.log('Match:', isMatch);
}

generateHash();

