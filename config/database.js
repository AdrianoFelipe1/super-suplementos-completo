require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

// URI segura - usa variável de ambiente
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.log('⚠️  MONGODB_URI não encontrada. Usando modo offline.');
  // Continue com dados locais
}

const clientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  tls: true,
  tlsAllowInvalidCertificates: false,
  connectTimeoutMS: 15000,
  serverSelectionTimeoutMS: 15000
};

let database = null;
let isConnected = false;

class Database {
  static async connect() {
    if (isConnected) return database;
    if (!uri) {
      console.log('🔧 Modo offline - dados locais');
      return null;
    }

    try {
      console.log('🔄 Conectando ao MongoDB...');
      const client = new MongoClient(uri, clientOptions);
      await client.connect();
      
      await client.db("admin").command({ ping: 1 });
      database = client.db("suplementos_db");
      isConnected = true;
      
      console.log("✅ MongoDB conectado com segurança!");
      return database;
      
    } catch (error) {
      console.log('❌ Erro MongoDB:', error.message);
      console.log('💡 Usando dados locais');
      return null;
    }
  }

  static getDB() {
    return database;
  }

  static isConnected() {
    return isConnected;
  }
}

module.exports = Database;