import { changeNodeColor } from "./diagram";
var terms;
var threads;

var nodes;
var links;

var sharedMemory;

var workers = [];

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
    maximum: 2048,
    shared: true,
  });
  // const initWorker = new Worker("dSaturWasmWorker.js");
  // initWorker.postMessage({
  //   nodes,
  //   links,
  //   terms,
  //   id: 0,
  //   sharedMemory,
  //   code: "init"
  // });

  serializeGraph();
  for (let i = 0; i < threads; i++) {
    const worker = new Worker("dSaturWasmWorker.js"); // Pfad zur Worker-Datei
    workers[i] = worker;
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
        reject(error); // Ablehnung des Promises im Fehlerfall
      };
    });
    promises.push(promise);
    worker.postMessage({
      nodes,
      links,
      terms,
      id: i,
      sharedMemory
    });
  }
  return Promise.all(promises);
}

function serializeGraph() {
  // Serialisiere Knoten
  let int32View = new Int32Array(sharedMemory.buffer);
  nodes.forEach((node, index) => {
    let baseIndex = (index * 4)+100; // 4 Int32 pro Knoten
    int32View[baseIndex] = node.key;
    int32View[baseIndex + 1] = node.color;
    int32View[baseIndex + 2] = node.weight;
    int32View[baseIndex + 3] = node.lock;
  });

  // Serialisiere Verbindungen
  links.forEach((link, index) => {
    let baseIndex = (nodes.length * 4 + index * 2)+100; // Setze fort, wo die Knoten enden
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
