const fs = require('fs');
const selfsigned = require('selfsigned');

console.log('🔐 Gerando certificados SSL...');

// Cria atributos do certificado
const attrs = [
  { name: 'commonName', value: 'localhost' },
  { name: 'countryName', value: 'BR' },
  { name: 'stateOrProvinceName', value: 'Sao Paulo' },
  { name: 'localityName', value: 'Sao Paulo' },
  { name: 'organizationName', value: 'Super Suplementos' },
  { name: 'organizationalUnitName', value: 'Development' }
];

// Gera certificado auto-assinado
const pems = selfsigned.generate(attrs, {
  days: 365,
  keySize: 2048,
  algorithm: 'sha256'
});

// Cria pasta ssl se não existir
if (!fs.existsSync('ssl')) {
  fs.mkdirSync('ssl');
  console.log('📁 Pasta ssl criada');
}

// Salva os arquivos
fs.writeFileSync('ssl/cert.pem', pems.cert);
fs.writeFileSync('ssl/key.pem', pems.private);

console.log('✅ Certificados SSL gerados com sucesso!');
console.log('📄 cert.pem - Certificado');
console.log('🔑 key.pem - Chave privada');
console.log('\n🎯 Agora execute: npm start');