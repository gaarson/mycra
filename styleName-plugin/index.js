import fs from 'fs';

export const styleNamePlugin = {
  name: 'styleNamePlugin',
  setup(build) {
    // Load ".txt" files and return an array of words
    build.onLoad({ filter: /\.tsx$/ }, async (args) => {
      let text = await fs.promises.readFile(args.path, 'utf8')
      console.log('STYLENAME', text);
      return { 
        contents: text, 
        loader: 'tsx' 
      }
    })
  },
}
