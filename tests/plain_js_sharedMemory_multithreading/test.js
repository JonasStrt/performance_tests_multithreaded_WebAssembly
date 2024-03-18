import { changeNodeColor, updateDiagram, updateDiagramData } from "./diagram";
var terms;
var threads;

var nodes;
var links;

var nodeBuffer;

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

  const nodeBufferSize = nodes.length * 16; // 16 Bytes node

  nodeBuffer = new SharedArrayBuffer(nodeBufferSize);
  serializeNodeData();

  for (let i = 0; i < threads; i++) {
    const worker = new Worker("dSaturWorker.js"); // Pfad zur Worker-Datei

    worker.postMessage({ nodeBuffer, nodes, links, terms, id: i });

    let promise = new Promise((resolve, reject) => {
      worker.onmessage = function (event) {
        if (event.data.status) {
          worker.terminate();
          resolve();
        } else {
          changeNodeColor(event.data.key, event.data.color);
        }
      };

      worker.onerror = function (error) {
        console.error(`Fehler in Worker ${i}:`, error);
        reject(error); // Ablehnung des Promises im Fehlerfall
      };
    });

    promises.push(promise);
  }

  // Warten auf die Beendigung aller Worker
  return Promise.all(promises);
}

function serializeNodeData() {
  const int32View = new Int32Array(nodeBuffer);

  // Serialisiere nodes
  nodes.forEach((node, index) => {
    int32View[index * 4] = node.key;
    int32View[index * 4 + 1] = node.color;
    int32View[index * 4 + 2] = node.weight;
    int32View[index * 4 + 3] = node.lock;
  });
}

function deserializeNodeData() {
  const int32View = new Int32Array(nodeBuffer);

  for (let i = 0; i < int32View.length; i += 4) {
    let node = nodes.find((n) => n.key === int32View[i]);
    if (node) {
      node.color = int32View[i + 1];
    }
  }
}

export { startTest };
