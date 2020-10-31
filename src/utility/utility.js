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

module.exports = { checkIfRoleExists };
