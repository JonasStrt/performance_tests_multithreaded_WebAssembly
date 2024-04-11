import { changeNodeColor } from "./diagram";
var terms;
var threads;

var nodes;
var links;

/**
 * Initializes the test with provided nodes, links, terms, and threads.
 * It sets up the global variables for use in the graph coloring algorithm and starts the DSatur algorithm.
 *
 * @param {Array} _nodes - Array of node objects for the test.
 * @param {Array} _links - Array of link objects connecting the nodes.
 * @param {number} _terms - Number of terms to use in the Pi calculation.
 * @param {number} _threads - Number of threads to simulate (not used in this function but initialized for potential future use).
 */
function startTest(_nodes, _links, _terms, _threads) {
  terms = _terms;
  threads = _threads;

  nodes = _nodes;
  links = _links;
  dSatur();
}

/**
 * Updates the saturation (weight) of all nodes connected to a given node.
 * This function increases the weight of adjacent nodes that have not yet been colored.
 *
 * @param {string} nodeKey - The key of the node whose adjacent nodes will have their saturation updated.
 * @param {number} color - The color assigned to the node (not directly used in this function but passed for potential future use).
 */
function updateSaturation(nodeKey, color) {
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
 * Selects the next node to be colored, based on the highest saturation (weight).
 * If there's a tie in weight, the node with the most connections (links) is selected.
 *
 * @returns {Object} The next node to be colored or `undefined` if no such node exists.
 */
function selectNode() {
  let nodeToColor = null;
  let maxWeight = -Infinity;
  let maxLinkCount = -Infinity;
  for (let currNode of nodes) {
    //const lock = getNodeAttribute(nodeIndex, 3);
    if (currNode.color === 0) {
      const weight = currNode.weight;
      const linkCount = countLinksForNode(currNode.key);
      if (
        weight > maxWeight ||
        (weight === maxWeight && linkCount > maxLinkCount)
      ) {
        nodeToColor = currNode;
        maxWeight = weight;
        maxLinkCount = linkCount;
      }
    }
  }
  return nodeToColor;
}

function countLinksForNode(nodeKey) {
  return links.reduce(
    (acc, link) => acc + (link.from === nodeKey || link.to === nodeKey ? 1 : 0),
    0
  );
}

/**
 * The DSatur algorithm implementation for graph coloring.
 * Iteratively selects nodes based on saturation and assigns the lowest possible color that has not been used by adjacent nodes.
 * Updates the diagram and the saturation of nodes as each node is colored.
 */
function dSatur() {
  let node = selectNode();
  while (node) {
    let color = 1;
    while (
      nodes.some(
        (n) =>
          links.some(
            (l) =>
              (l.from === node.key && l.to === n.key) ||
              (l.to === node.key && l.from === n.key)
          ) && n.color === color
      )
    ) {
      color++;
    }
    calculatePiLeibniz(terms);
    node.color = color;
    changeNodeColor(node.key, node.color, null);
    updateSaturation(node.key, color);

    node = selectNode();
  }
}

/**
 * Calculates an approximation of Pi using the Leibniz formula.
 * This function is used to simulate computational work for the performance test.
 *
 * @param {number} terms - The number of terms to use in the approximation.
 * @returns {number} The approximation of Pi calculated using the specified number of terms.
 */
function calculatePiLeibniz(terms) {
  let sum = 0.0;
  for (let i = 0; i < terms; i++) {
    console.log("calculate term");
    if (i % 2 === 0) {
      sum += 1.0 / (2 * i + 1);
    } else {
      sum -= 1.0 / (2 * i + 1);
    }
  }
  console.log(sum);
  return 4 * sum;
}

export { startTest };
