import buildMode from './config/buildMode.js';
import { getPlugins } from './config/plugins.js';

export default {
  type: "transform",
  esbuild: {
    target: "esnext",
    format: "esm",
    plugins: getPlugins(buildMode.simpleClassHash)
  },
}
