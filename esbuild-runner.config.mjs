import buildMode from './config/buildMode.js';
import { getPlugins } from './config/plugins.js';

export default {
  type: "transform", // bundle or transform (see description above)
  esbuild: {
    // Any esbuild build or transform options go here
    target: "esnext",
    format: 'esm',
    plugins: getPlugins(buildMode.simpleClassHash)
  },
}
