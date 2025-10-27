const bcrypt = require('bcrypt');

async function main() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 12);
  console.log('UPDATE users SET "passwordHash" = \'' + hash + '\' WHERE email = \'admin@vselena.ru\';');
}

main();

