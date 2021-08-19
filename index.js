const paths = require('./config/paths');
const args = require('./utils/args');
const buildMode = require('./config/buildMode');

module.exports = () => {
  if (args.server) {
    switch (buildMode.type) {
      case 'development': {
        require('./scripts/dev-server');
        break;
      }
      case 'production': {
        require('./scripts/prod-server');
        break;
      }
      // case 'test': {
      //   require('./scripts/test');
      //   break;
      // }
      default: {
        console.error('ERROR: choose command to evalueate');
      }
    }
  } else {
    switch (buildMode.type) {
      case 'development': {
        require('./scripts/dev');
        break;
      }
      case 'production': {
        require('./scripts/prod');
        break;
      }
      case 'test': {
        require('./scripts/test');
        break;
      }
      default: {
        console.error('ERROR: choose command to evalueate');
      }
    }
  }
};
