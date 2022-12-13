glob.env = {
  ...glob,
  ...process.env
};
process.env = {
  ...process.env, 
  ...customEnv,
};
