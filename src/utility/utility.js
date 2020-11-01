const fs = require('fs');
const path = require('path');

function checkIfRoleExists(message) {
  let role = message.guild.roles.cache.find((r) => r.name === 'Participant');
  // console.log(role);

  if (role) {
    return role;
  }

  message.guild.roles.create({
    data: {
      name: 'Participant',
      mentionable: true,
      permissions: [],
    },
  });

  role = message.guild.roles.cache.find((r) => r.name === 'Participant');

  return role;
}

function clearTempFiles() {
  const directory = 'temp';
  fs.readdir(directory, (err, files) => {
    if (err) throw err;

    // eslint-disable-next-line no-restricted-syntax
    for (const file of files) {
      fs.unlink(path.join(directory, file), (errr) => {
        if (errr) throw err;
      });
    }
  });
}

module.exports = { checkIfRoleExists, clearTempFiles };
