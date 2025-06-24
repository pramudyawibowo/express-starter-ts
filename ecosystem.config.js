module.exports = {
  apps: [
    {
      name: 'apistarter',
      script: 'build/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      merge_logs: true,
    }
  ]
};