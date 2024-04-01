import { changeNodeColor } from "./diagram";
var terms;
var threads;

var nodes;
var links;

var sharedMemory;

var workers = [];
var nodesPointer;
var linksPointer;

/**
 * Initializes the test with provided nodes, links, terms, and threads.
 * It sets up the global variables for use in the graph coloring algorithm and starts the DSatur algorithm.
 *
 * @param {Array} _nodes - Array of node objects for the test.
 * @param {Array} _links - Array of link objects connecting the nodes.
 * @param {number} _terms - Number of terms to use in the Pi calculation.
 * @param {number} _threads - Number of threads to simulate (not used in this function but initialized for potential future use).
 */
async function startTest(_nodes, _links, _terms, _threads) {
  let promises = [];
  terms = _terms;
  threads = _threads;
  nodes = _nodes;
  links = _links;

  sharedMemory = new WebAssembly.Memory({
    initial: 256,
    maximum: 256,
    shared: true,
  });
  let sharedMemoryGraphData = new SharedArrayBuffer(4000); // 4 Bytes für einen int32_t Zähler
  serializeGraph(sharedMemoryGraphData);

  // Erstelle ein Promise für den initialen Worker, um die Pointer zu erhalten
  let pointerPromise = new Promise((resolve, reject) => {
    const initWorker = new Worker("dSaturWasmWorker.js");
    initWorker.onmessage = function (e) {
      if (e.data.code == "pointer") {
        resolve({
          nodesPointer: e.data.nodesPtr,
          linksPointer: e.data.linksPtr,
        });
        initWorker.terminate(); // Optional: Beende den Worker, wenn er nicht mehr benötigt wird
      }
    };
    initWorker.onerror = function (error) {
      reject(error);
    };
    initWorker.postMessage({
      nodes,
      links,
      terms,
      id: 0,
      sharedMemory,
      code: "init",
      sharedMemoryGraphData,
    });
  });

  // Warte auf die Pointer vom initialen Worker
  const { nodesPointer, linksPointer } = await pointerPromise;

  // Erstelle Worker und sende Nachrichten, nachdem die Pointer empfangen wurden
  for (let i = 1; i <= threads; i++) {
    // Starte bei 1, da id 0 für den initialen Worker verwendet wurde
    const worker = new Worker("dSaturWasmWorker.js");
    let promise = new Promise((resolve, reject) => {
      worker.onmessage = function (e) {
        if (e.data.code == "changeColor") {
          changeNodeColor(e.data.nodeKey, e.data.newColorCode, e.data.thread);
        }
        if (e.data.code == "end") {
          resolve();
        }
      };
      worker.onerror = function (error) {
        console.error(`Fehler in Worker ${i}:`, error);
        reject(error);
      };
    });
    promises.push(promise);

    // Nun, da wir die Pointer haben, sende die Nachrichten an die Worker
    worker.postMessage({
      nodes,
      links,
      terms,
      id: i,
      nodesPointer: nodesPointer,
      linksPointer: linksPointer,
      sharedMemory,
    });
  }

  return Promise.all(promises);
}
function serializeGraph(buffer) {
  // Serialisiere Knoten
  let int32View = new Int32Array(buffer);
  nodes.forEach((node, index) => {
    let baseIndex = index * 4; // 4 Int32 pro Knoten
    int32View[baseIndex] = node.key;
    int32View[baseIndex + 1] = node.color;
    int32View[baseIndex + 2] = node.weight;
    int32View[baseIndex + 3] = node.lock;
  });

  // Serialisiere Verbindungen
  links.forEach((link, index) => {
    let baseIndex = nodes.length * 4 + index * 2; // Setze fort, wo die Knoten enden
    int32View[baseIndex] = link.from;
    int32View[baseIndex + 1] = link.to;
  });
}

function deserializeGraph(int32View, nodeCount) {
  // Initialisiere leere Arrays für Knoten und Verbindungen
  const nodes = [];

  // Deserialisiere Knoten
  for (let i = 0; i < nodeCount; i++) {
    let baseIndex = i * 4; // 4 Int32 pro Knoten
    const node = {
      key: int32View[baseIndex],
      color: int32View[baseIndex + 1],
      weight: int32View[baseIndex + 2],
      lock: int32View[baseIndex + 3],
    };
    nodes.push(node);
  }
  return { nodes };
}

export { startTest };
