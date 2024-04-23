import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';
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

app.get('/data',  (req, res) => {
  res.type('application/json');
  res.sendFile(path.join(__dirname, '/measurements/measuringPoints.json'));
});

app.post('/sendData', (req, res) => {
  const point = req.body;
  addNewMeasuringPoint("./measurements/measuringPoints.json", point);
});

function addNewMeasuringPoint(filePath, newObject) {
    // Datei lesen
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error("Ein Fehler ist aufgetreten beim Lesen der Datei:", err);
        return;
      }
  
      // JSON parsen
      let obj = JSON.parse(data);
  
      //obj.push(newObject);

      obj = obj.filter(item => item.Implementation !== "wasm_actor_pthreads");
      obj.forEach(item => {
        item["Terms"] = 0;
      })

      const updatedJson = JSON.stringify(obj, null, 2);  // 'null, 2' für eine formatierte Ausgabe
  
      // JSON-Datei aktualisieren
      fs.writeFile(filePath, updatedJson, 'utf8', (err) => {
        if (err) {
          console.error("Ein Fehler ist aufgetreten beim Schreiben der Datei:", err);
        } else {
          console.log("Datei wurde erfolgreich aktualisiert.");
        }
      });
    });

}