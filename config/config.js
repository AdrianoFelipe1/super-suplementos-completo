const config = {
  development: {
    mongodb: {
      uri: process.env.MONGODB_URI || "mongodb://localhost:27017/suplementos_db"
    }
  },
  production: {
    mongodb: {
      uri: process.env.MONGODB_URI
    }
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];