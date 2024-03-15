import { changeNodeColor, updateDiagram } from "./diagram";
var terms;
var threads;

var nodes;
var links;

const workers = [];
const nodeQueue = [];
const activeWorkers = new Set();

let completionPromise;
let resolveCompletionPromise;

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

  completionPromise = new Promise(resolve => {
    resolveCompletionPromise = resolve; 
  });

  terms = _terms;
  threads = _threads;

  nodes = _nodes;
  links = _links;

  initializeWorkerPool();
  runActorRoutine();
  return completionPromise;
}

function runActorRoutine() {
  addColorableNodesToQueue();
}

function initializeWorkerPool() {
  for (let i = 0; i < threads; i++) {
    const worker = new Worker("colorNodeDSaturWorker.js");
    worker.onmessage = function(e) {
      processWorkerResult(e, worker);
    }
    workers.push(worker);
  }
}

function terminateAllWorkers() {
  workers.forEach(worker => worker.terminate()); // Jeden Worker terminieren
  workers.length = 0; // Das Array leeren
  activeWorkers.clear(); // Sicherstellen, dass auch das Set der aktiven Worker geleert wird
}

// Funktion zum Senden von Aufgaben an WebWorker mit Warteschlange
function sendNodeToWorker(node) {
  const worker = workers.pop();
  if (worker) {
    activeWorkers.add(worker);
    worker.postMessage({ node, nodes, links, terms }); // Aufgabe zusammen mit der Task-ID senden
  } else {
    nodeQueue.push({ node }); // Aufgabe in die Warteschlange einreihen
  }
}

function processWorkerResult(e, worker) {
  let node = nodes.find((node) => node.key === e.data.key);
  node.color = e.data.color;
  updateDiagram();
  updateSaturation(node.key);
  unlockAdjacentNodes(node);
  activeWorkers.delete(worker);
  workers.push(worker);
  if(!areAllNodesColored()) {
    addColorableNodesToQueue();
    processNextTask();
  }
  else {
    resolveCompletionPromise();
    terminateAllWorkers();
  }
}

function processNextTask() {
  if (nodeQueue.length > 0 && workers.length > 0) {
    const { node } = nodeQueue.shift();
    sendNodeToWorker(node);
  }
}

/**
 * Updates the saturation (weight) of all nodes connected to a given node.
 * This function increases the weight of adjacent nodes that have not yet been colored.
 *
 * @param {string} nodeKey - The key of the node whose adjacent nodes will have their saturation updated.
 * @param {number} color - The color assigned to the node (not directly used in this function but passed for potential future use).
 */
function updateSaturation(nodeKey) {
  links.forEach((link) => {
    let targetNode = null;
    if (link.from === nodeKey) {
      targetNode = nodes.find((n) => n.key === link.to);
    } else if (link.to === nodeKey) {
      targetNode = nodes.find((n) => n.key === link.from);
    }

    if (targetNode && !targetNode.color) {
      targetNode.weight++;
    }
  });
}

/**
 * Selects the next node to be colored, based on the highest saturation (weight) and if it is not blocked.
 * If there's a tie in weight, the node with the most connections (links) is selected.
 *
 * @returns {Object} The next node to be colored or `undefined` if no such node exists.
 */
function selectNode() {
  return nodes
    .filter((n) => n.color === 0 && n.lock === 0)
    .sort(
      (a, b) =>
        b.weight - a.weight ||
        links.filter((l) => l.from === b.key || l.to === b.key).length -
          links.filter((l) => l.from === a.key || l.to === a.key).length
    )
    .pop();
}

function addColorableNodesToQueue() {
  let node;
  while ((node = selectNode()) !== undefined) {
    // Solange es einen auswählbaren Knoten gibt
    lockAdjacentNodes(node); // Sperre die angrenzenden Knoten
    sendNodeToWorker(node); // Sende den Knoten an den Worker
  }
}

function areAllNodesColored() {
  return nodes.every((node) => node.color !== 0);
}

/**
 * Increases the lock value of all adjacent nodes of a given node by one.
 *
 * @param {string} nodeKey - The key of the node to whose adjacent nodes the lock value is to be increased.
 */
function lockAdjacentNodes(node) {
  let nodeKey = node.key;
  node.lock++;
  links.forEach((link) => {
    let targetNodeKey = null;
    if (link.from === nodeKey) {
      targetNodeKey = link.to;
    } else if (link.to === nodeKey) {
      targetNodeKey = link.from;
    }
    if (targetNodeKey !== null) {
      const targetNode = nodes.find((n) => n.key === targetNodeKey);
      if (targetNode) {
        targetNode.lock++;
      }
    }
  });
}

/**
 * Decreases the lock value of all adjacent nodes of a given node by one.
 *
 * @param {string} nodeKey - The key of the node to whose adjacent nodes the lock value is to be decreased.
 */
function unlockAdjacentNodes(node) {
  let nodeKey = node.key;
  links.forEach((link) => {
    let targetNodeKey = null;
    if (link.from === nodeKey) {
      targetNodeKey = link.to;
    } else if (link.to === nodeKey) {
      targetNodeKey = link.from;
    }
    if (targetNodeKey !== null) {
      const targetNode = nodes.find((n) => n.key === targetNodeKey);
      if (targetNode) {
        targetNode.lock--;
      }
    }
  });
}

export { startTest };
