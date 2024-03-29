import { APP_ENV_KEY } from '../constants.js';

import buildMode from './buildMode.js';

export default Object.keys(process.env)
  .filter((key) => key.startsWith(APP_ENV_KEY))
  .reduce((acc, curr) => ({ 
    ...acc, 
    [curr.replace(APP_ENV_KEY, '')]: process.env[curr] || '',
  }), { buildMode: buildMode.type });
