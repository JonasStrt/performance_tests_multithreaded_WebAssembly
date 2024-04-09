import { changeNodeColor } from "./diagram";
var terms;
var threads;

var nodes;
var links;

var nodeBufferSize;
var linkBufferSize;
var totalBufferSize;
var buffer;
var int32View;
var threadsFinishedPromise;

function initializePromise() {
  threadsFinishedPromise = new Promise((resolve, reject) => {
    // Speichere resolve (und ggf. reject) in einem höheren Scope, um sie später aufrufen zu können
    window.resolveThreadsFinished = resolve;
    // window.rejectThreadsFinished = reject; // Falls Sie auch Fehlerbehandlung implementieren möchten
  });
}

function threadsFinished() {
  console.log("threads finished in js ");
  if (window.resolveThreadsFinished) {
    window.resolveThreadsFinished();
  }
}

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
  initializePromise();
  terms = _terms;
  threads = _threads;

  nodes = _nodes;
  links = _links;

  nodeBufferSize = nodes.length * 16; // 16 Bytes pro Knoten
  linkBufferSize = links.length * 8; // 8 Bytes pro Verbindung
  totalBufferSize = nodeBufferSize + linkBufferSize;

  buffer = new SharedArrayBuffer(totalBufferSize);
  int32View = new Int32Array(buffer);
  serializeGraph();
  if (typeof Module !== "undefined") {
    Module.changeNodeColor = changeNodeColor;
    Module.threadsFinished = threadsFinished;
  
    const nodesPtr = Module._malloc(totalBufferSize); // Speicher im WebAssembly-Modul reservieren
    Module.HEAP32.set(int32View, nodesPtr / 4); // Kopiere die Daten in den WebAssembly-Speicher
    // Berechne die Positionen der Knoten- und Verbindungsarrays im Speicher
    const nodeCount = nodes.length;
    const linkCount = links.length;
    const linksPtr = nodesPtr + nodeBufferSize;
    Module._processGraph(
      nodesPtr,
      nodeCount,
      linksPtr,
      linkCount,
      terms,
      threads
    );

    await threadsFinishedPromise;
    Module._free(nodesPtr);
  }
}

function serializeGraph() {
  // Serialisiere Knoten
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
