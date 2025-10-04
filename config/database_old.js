const { MongoClient, ServerApiVersion } = require('mongodb');

// SUA URI - SUBSTITUA "sua_senha_aqui" pela SENHA REAL
require('dotenv').config();
const uri = process.env.MONGODB_URI;

const clientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  tls: true,
  tlsAllowInvalidCertificates: false,
  connectTimeoutMS: 15000,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
  retryReads: true
};

let database = null;
let isConnected = false;
let client = null;

class Database {
  static async connect() {
    if (isConnected) return database;

    console.log('🔄 Conectando ao MongoDB...');
    
    try {
      client = new MongoClient(uri, clientOptions);
      await client.connect();
      
      await client.db("admin").command({ ping: 1 });
      database = client.db("suplementos_db");
      isConnected = true;
      
      console.log("✅ MongoDB conectado com sucesso!");
      return database;
      
    } catch (error) {
      console.error("❌ Erro de conexão:", error.message);
      console.log('💡 Usando dados locais...');
      throw error;
    }
  }

  static getDB() {
    if (!isConnected) {
      throw new Error('Database não conectado.');
    }
    return database;
  }

  static isConnected() {
    return isConnected;
  }

  static async close() {
    if (isConnected && client) {
      await client.close();
      isConnected = false;
      console.log('🔌 Conexão com MongoDB fechada');
    }
  }
}

module.exports = Database;