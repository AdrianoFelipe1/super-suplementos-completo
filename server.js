const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const Database = require('./config/database');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// ==================== CONFIGURAÇÃO ====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==================== DADOS LOCAIS ====================
const produtosTemporarios = [
  {
    _id: '1',
    nome: "Whey Protein 100% Pure",
    marca: "Growth Supplements",
    preco: 129.90,
    categoria: "proteina",
    descricao: "Whey Protein 100% Pure é um suplemento proteico de alto valor biológico, ideal para auxiliar no ganho de massa muscular. Fornece 24g de proteína por dose.",
    imagem: "/images/whey-growth.jpg",
    estoque: 50,
    vendas: 150,
    ativo: true,
    dataCriacao: new Date()
  },
  {
    _id: '2',
    nome: "Creatina Monohidratada 250g",
    marca: "IntegralMedica",
    preco: 69.90,
    categoria: "creatina", 
    descricao: "Creatina Monohidratada em pó 250g, aumenta a força e performance nos treinos. Ajuda no ganho de massa muscular.",
    imagem: "/images/creatina-integral.jpg",
    estoque: 30,
    vendas: 89,
    ativo: true,
    dataCriacao: new Date()
  },
  {
    _id: '3',
    nome: "Pré-Treino Hardcore",
    marca: "Max Titanium",
    preco: 89.90,
    categoria: "pre-treino",
    descricao: "Pré-treino com fórmula avançada para energia, foco e bombeamento muscular. Contém cafeína e beta-alanina.",
    imagem: "/images/pre-workout-max.jpg",
    estoque: 25,
    vendas: 67,
    ativo: true,
    dataCriacao: new Date()
  },
  {
    _id: '4',
    nome: "BCAA 2:1:1 240g",
    marca: "Probiotica",
    preco: 59.90,
    categoria: "aminoacidos",
    descricao: "Aminoácidos de Cadeia Ramificada (BCAA) na proporção 2:1:1 para recuperação muscular.",
    imagem: "/images/bcaa-probiotica.jpg",
    estoque: 40,
    vendas: 45,
    ativo: true,
    dataCriacao: new Date()
  },
  {
    _id: '5',
    nome: "Vitamina D3 2000UI",
    marca: "Essential Nutrition", 
    preco: 45.90,
    categoria: "vitaminas",
    descricao: "Suplemento de Vitamina D3 para imunidade e saúde óssea. 60 cápsulas.",
    imagem: "/images/vitamina-d3.jpg",
    estoque: 60,
    vendas: 78,
    ativo: true,
    dataCriacao: new Date()
  },
  {
    _id: '6',
    nome: "Termogênico Black",
    marca: "Darkness",
    preco: 99.90,
    categoria: "termogenicos",
    descricao: "Termogênico potente para queima de gordura e energia. Fórmula avançada.",
    imagem: "/images/termogenico-darkness.jpg",
    estoque: 20,
    vendas: 34,
    ativo: true,
    dataCriacao: new Date()
  }
];

let dbConnected = false;

// ==================== MIDDLEWARE ====================
app.use((req, res, next) => {
  res.locals.categorias = ['proteina', 'creatina', 'pre-treino', 'aminoacidos', 'vitaminas', 'termogenicos'];
  res.locals.dbConnected = dbConnected;
  res.locals.isSecure = req.secure;
  next();
});

// ==================== ROTAS API ====================

// GET /api/produtos
app.get('/api/produtos', async (req, res) => {
  try {
    if (dbConnected) {
      const db = Database.getDB();
      const produtos = await db.collection('produtos').find({ ativo: true }).toArray();
      return res.json({ success: true, source: 'mongodb', data: produtos });
    }
    res.json({ success: true, source: 'local', data: produtosTemporarios });
  } catch (error) {
    res.json({ success: true, source: 'local', data: produtosTemporarios });
  }
});

// POST /api/produtos
app.post('/api/produtos', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ 
      success: false, 
      message: 'MongoDB offline. Use dados locais para visualização.' 
    });
  }

  try {
    const db = Database.getDB();
    const { nome, marca, preco, categoria, descricao, estoque } = req.body;

    if (!nome || !marca || !preco || !categoria) {
      return res.status(400).json({ 
        success: false, 
        message: 'Campos obrigatórios: nome, marca, preço, categoria' 
      });
    }

    const produto = {
      nome: nome.toString().trim(),
      marca: marca.toString().trim(),
      preco: parseFloat(preco),
      categoria: categoria.toString().trim(),
      descricao: (descricao || '').toString().trim(),
      imagem: '/images/produto-sem-foto.jpg',
      estoque: parseInt(estoque) || 0,
      dataCriacao: new Date(),
      dataAtualizacao: new Date(),
      ativo: true
    };

    const resultado = await db.collection('produtos').insertOne(produto);
    
    res.status(201).json({
      success: true,
      message: 'Produto criado com sucesso!',
      data: { id: resultado.insertedId, ...produto }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao criar produto' });
  }
});

// PUT /api/produtos/:id
app.put('/api/produtos/:id', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ success: false, message: 'MongoDB offline.' });
  }

  try {
    const db = Database.getDB();
    const { ObjectId } = require('mongodb');

    const resultado = await db.collection('produtos').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...req.body, dataAtualizacao: new Date() } }
    );

    if (resultado.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Produto não encontrado' });
    }

    res.json({ success: true, message: 'Produto atualizado!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar produto' });
  }
});

// DELETE /api/produtos/:id
app.delete('/api/produtos/:id', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ success: false, message: 'MongoDB offline.' });
  }

  try {
    const db = Database.getDB();
    const { ObjectId } = require('mongodb');

    const resultado = await db.collection('produtos').deleteOne({ 
      _id: new ObjectId(req.params.id) 
    });

    if (resultado.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Produto não encontrado' });
    }

    res.json({ success: true, message: 'Produto deletado!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao deletar produto' });
  }
});

// ==================== ROTAS PAGAMENTO ====================

app.get('/checkout', (req, res) => {
  res.render('checkout', { 
    title: 'Finalizar Compra - Super Suplementos',
    isSecure: req.secure
  });
});

app.post('/api/pagamento', (req, res) => {
  // Simulação de pagamento
  setTimeout(() => {
    res.json({
      success: true,
      message: 'Pagamento processado com sucesso!',
      transactionId: 'TX_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      secure: true,
      timestamp: new Date().toISOString()
    });
  }, 2000);
});

// ==================== ROTAS SITE ====================

app.get('/', async (req, res) => {
  res.render('index', { 
    produtos: produtosTemporarios.slice(0, 8),
    title: 'Super Suplementos - Loja Oficial'
  });
});

app.get('/produtos', async (req, res) => {
  const { categoria } = req.query;
  let produtos = produtosTemporarios;
  
  if (categoria && categoria !== 'todos') {
    produtos = produtosTemporarios.filter(p => p.categoria === categoria);
  }

  res.render('produtos', {
    produtos,
    categoria: categoria || 'todos',
    title: `Produtos ${categoria ? '- ' + categoria : ''}`
  });
});

app.get('/produto/:id', async (req, res) => {
  const produto = produtosTemporarios.find(p => p._id === req.params.id);
  
  if (produto) {
    const relacionados = produtosTemporarios
      .filter(p => p.categoria === produto.categoria && p._id !== produto._id)
      .slice(0, 4);
      
    res.render('detalhes', { 
      produto, 
      relacionados, 
      title: produto.nome
    });
  } else {
    res.status(404).render('404', { title: 'Produto Não Encontrado' });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    database: dbConnected ? 'connected' : 'disconnected',
    ssl: req.secure ? 'enabled' : 'disabled',
    timestamp: new Date().toISOString()
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).render('404', { title: 'Página Não Encontrada' });
});

// ==================== INICIALIZAÇÃO ====================

async function startServers() {
  console.log('🚀 INICIANDO SUPER SUPLIMENTOS...\n');
  
  // Tenta conectar ao MongoDB
  try {
    await Database.connect();
    dbConnected = true;
    console.log('✅ MONGODB: Conectado com sucesso');
  } catch (error) {
    console.log('🔧 MONGODB: Modo offline - usando dados locais');
    dbConnected = false;
  }

  // Servidor HTTPS
  try {
    const httpsOptions = {
      key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem'))
    };

    https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
      console.log(`🔒 HTTPS: https://localhost:${HTTPS_PORT}`);
    });
  } catch (error) {
    console.log('❌ HTTPS: Certificados não encontrados - execute: npm run generate-cert');
  }

  // Servidor HTTP
  app.listen(HTTP_PORT, () => {
    console.log(`🌐 HTTP:  http://localhost:${HTTP_PORT}`);
    console.log(`\n🎯 SISTEMA PRONTO!`);
    console.log(`\n📋 URLS DISPONÍVEIS:`);
    console.log(`   🔒 Site Seguro: https://localhost:${HTTPS_PORT}`);
    console.log(`   🌐 Site Normal: http://localhost:${HTTP_PORT}`);
    console.log(`   💳 Checkout:    https://localhost:${HTTPS_PORT}/checkout`);
    console.log(`   🔗 API:         http://localhost:${HTTP_PORT}/api/produtos`);
  });
}

startServers();