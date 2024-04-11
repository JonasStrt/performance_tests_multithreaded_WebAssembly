import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

app.use(express.static(__dirname));

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get('/webassambly/dSaturSharedMemory',  (req, res) => {
  res.type('application/wasm');
  res.sendFile(path.join(__dirname, '/tests/assemblyScript_sharedMemory_webWorker/dSaturSharedMemory.wasm'));
});

app.post('/sendData', (req, res) => {
  const messwert = req.body;
  console.log('Empfangener Messwert:', messwert);
});