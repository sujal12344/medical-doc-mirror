module.exports = {
  apps: [
    {
      name: "medical-doc-generator",
      script: ".next/standalone/server.js",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
      },
    },
  ],
};
