const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Helper to use archiver or tar or powershell
console.log("Criando pacotes ZIP para Hostinger...");

// 1. backend/backend.zip
const backendDir = path.resolve(__dirname, 'backend');
const backendZip = path.resolve(backendDir, 'backend.zip');
const backendRootZip = path.resolve(__dirname, 'backend.zip');

if (fs.existsSync(backendZip)) fs.unlinkSync(backendZip);
if (fs.existsSync(backendRootZip)) fs.unlinkSync(backendRootZip);

// List items in backend directory excluding node_modules, tests, zips
const backendItems = fs.readdirSync(backendDir).filter(name => {
  return !['node_modules', '.git', 'tests', 'backend.zip'].includes(name) && !name.endsWith('.test.ts');
});

console.log("Itens no backend.zip:", backendItems);

// Use PowerShell with proper escaping via script block
const psBackendItems = backendItems.map(item => `'${path.join(backendDir, item)}'`).join(',');
const psBackendCmd = `Compress-Archive -Path ${psBackendItems} -DestinationPath '${backendZip}' -Force`;
execSync(`powershell -Command "${psBackendCmd}"`, { stdio: 'inherit' });
fs.copyFileSync(backendZip, backendRootZip);
console.log("backend.zip criado com sucesso! Tamanho:", (fs.statSync(backendZip).size / 1024).toFixed(1), "KB");

// 2. frontend/frontend.zip (Código fonte sem node_modules)
const frontendDir = path.resolve(__dirname, 'frontend');
const frontendZip = path.resolve(frontendDir, 'frontend.zip');
const frontendRootZip = path.resolve(__dirname, 'frontend.zip');

if (fs.existsSync(frontendZip)) fs.unlinkSync(frontendZip);
if (fs.existsSync(frontendRootZip)) fs.unlinkSync(frontendRootZip);

const frontendItems = fs.readdirSync(frontendDir).filter(name => {
  return !['node_modules', '.git', 'frontend.zip'].includes(name);
});

console.log("Itens no frontend.zip:", frontendItems);

const psFrontendItems = frontendItems.map(item => `'${path.join(frontendDir, item)}'`).join(',');
const psFrontendCmd = `Compress-Archive -Path ${psFrontendItems} -DestinationPath '${frontendZip}' -Force`;
execSync(`powershell -Command "${psFrontendCmd}"`, { stdio: 'inherit' });
fs.copyFileSync(frontendZip, frontendRootZip);
console.log("frontend.zip criado com sucesso! Tamanho:", (fs.statSync(frontendZip).size / 1024).toFixed(1), "KB");

// 3. frontend_dist.zip (Arquivos compilados para public_html)
const distDir = path.resolve(frontendDir, 'dist');
const distZip = path.resolve(__dirname, 'frontend_dist.zip');
if (fs.existsSync(distZip)) fs.unlinkSync(distZip);

const psDistCmd = `Compress-Archive -Path '${path.join(distDir, '*')}' -DestinationPath '${distZip}' -Force`;
execSync(`powershell -Command "${psDistCmd}"`, { stdio: 'inherit' });
console.log("frontend_dist.zip criado com sucesso! Tamanho:", (fs.statSync(distZip).size / 1024).toFixed(1), "KB");

console.log("\nTodos os arquivos ZIP foram gerados com sucesso!");
