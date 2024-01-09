import paths from './config/paths.js';
import args from './utils/args.js';
import buildMode from './config/buildMode.js';

export default () => {
  switch (buildMode.type) {
    case 'development': {
      import('./scripts/es-server.js');
      break;
    }
    case 'production': {
      import('./scripts/es-build.js');
      break;
    }
    case 'test': {
      import('./scripts/es-test.js');
      break;
    }
    default: {
      console.error('ERROR: choose command to evalueate');
    }
  }
};
