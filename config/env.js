const { APP_ENV_KEY } = require('../constants');
const buildMode = require('./buildMode');

module.exports = Object.keys(process.env)
  .filter((key) => key.startsWith(APP_ENV_KEY))
  .reduce((acc, curr) => ({ 
    ...acc, 
    [curr.replace(APP_ENV_KEY, '')]: JSON.stringify(process.env[curr]) || '',
  }), { buildMode: JSON.stringify(buildMode.type) });
