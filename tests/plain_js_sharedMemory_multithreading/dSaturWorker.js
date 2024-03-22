var nodeBufferView;
var links;
var nodes;
var terms;

var workerId;

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
    if (i % 2 === 0) {
      sum += 1.0 / (2 * i + 1);
    } else {
      sum -= 1.0 / (2 * i + 1);
    }
  }
  return 4 * sum;
}

function selectNode() {
  let selectedNodeIndex = -1;
  let maxWeight = -Infinity;
  let maxLinkCount = -Infinity;

  for (let nodeIndex = 0; nodeIndex < nodeBufferView.length / 4; nodeIndex++) {
    const color = getNodeAttribute(nodeIndex, 1);
    const lock = getNodeAttribute(nodeIndex, 3);
    if (color === 0 && lock === 0) {
      const weight = getNodeAttribute(nodeIndex, 2);
      const key = getNodeAttribute(nodeIndex, 0);
      const linkCount = countLinksForNode(key);
      if (
        weight > maxWeight ||
        (weight === maxWeight && linkCount > maxLinkCount)
      ) {
        selectedNodeIndex = nodeIndex;
        maxWeight = weight;
        maxLinkCount = linkCount;
      }
    }
  }

  return selectedNodeIndex !== -1
    ? {
        key: getNodeAttribute(selectedNodeIndex, 0),
        color: getNodeAttribute(selectedNodeIndex, 1),
        weight: getNodeAttribute(selectedNodeIndex, 2),
        lock: getNodeAttribute(selectedNodeIndex, 3),
      }
    : null;
}

function dSatur() {
  let node = selectNode();
  //lockAdjacentNodes(node);
  while (node) {
    let color = 1;
    while (
      nodes.some(
        (n) =>
          links.some(
            (l) =>
              (l.from === node.key && l.to === n.key) ||
              (l.to === node.key && l.from === n.key)
          ) && getNodeAttribute(n.key - 1, 1) === color
      )
    ) {
      color++;
    }
    //no other worker colored this
    if (getNodeAttribute(node.key - 1, 1) === 0) {
      //it didnt got locked
      if (getNodeAttribute(node.key - 1, 3) === 0) {
        lockAdjacentNodes(node);
        setNodeAttribute(node.key - 1, 1, color);
        updateSaturation(node.key, color);
        calculatePiLeibniz(terms);
        unlockAdjacentNodes(node);
        postMessage({
          status: 0,
          key: node.key,
          color: color,
          thread: workerId,
        });
      }
      //it got locked
      else {
        let waitResult = Atomics.wait(
          nodeBufferView,
          (node.key - 1) * 4 + 3,
          0,
          1000
        );
        if (waitResult === "ok") {
          continue;
        }
      }
    }
    node = selectNode();
  }
}

function countLinksForNode(nodeKey) {
  return links.reduce(
    (acc, link) => acc + (link.from === nodeKey || link.to === nodeKey ? 1 : 0),
    0
  );
}

function lockAdjacentNodes(node) {
  if (node) {
    let nodeKey = node.key;
    let currLock = getNodeAttribute(nodeKey - 1, 3);
    currLock += 1;
    setNodeAttribute(nodeKey - 1, 3, currLock);
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
          let currTargetLock = getNodeAttribute(targetNode.key - 1, 3);
          currTargetLock += 1;
          setNodeAttribute(targetNode.key - 1, 3, currTargetLock);
        }
      }
    });
  }
}

function unlockAdjacentNodes(node) {
  if (node) {
    let nodeKey = node.key;
    let currLock = getNodeAttribute(nodeKey - 1, 3);
    currLock -= 1;
    setNodeAttribute(nodeKey - 1, 3, currLock);
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
          let currTargetLock = getNodeAttribute(targetNode.key - 1, 3);
          currTargetLock -= 1;
          setNodeAttribute(targetNode.key - 1, 3, currTargetLock);
          Atomics.notify(nodeBufferView, (targetNode.key - 1) * 4 + 3);
        }
      }
    });
  }
}

function updateSaturation(nodeKey) {
  links.forEach((link) => {
    let targetNode = null;
    if (link.from === nodeKey) {
      targetNode = nodes.find((n) => n.key === link.to);
    } else if (link.to === nodeKey) {
      targetNode = nodes.find((n) => n.key === link.from);
    }

    if (targetNode && !targetNode.color) {
      let currTargetWeight = getNodeAttribute(targetNode.key - 1, 2);
      currTargetWeight += 1;
      setNodeAttribute(targetNode.key - 1, 2, currTargetWeight);
    }
  });
}

// get node attribute
function getNodeAttribute(nodeIndex, attributeIndex) {
  const index = nodeIndex * 4 + attributeIndex;
  // Liest den Wert atomar
  return Atomics.load(nodeBufferView, index);
}

// set node attribute
function setNodeAttribute(nodeIndex, attributeIndex, value) {
  const index = nodeIndex * 4 + attributeIndex;
  Atomics.store(nodeBufferView, index, value);
}

self.addEventListener("message", function (e) {
  nodeBufferView = new Int32Array(e.data["nodeBuffer"]);
  nodes = e.data["nodes"];
  links = e.data["links"];
  terms = e.data["terms"];
  workerId = e.data["id"];
  dSatur();
  postMessage({ status: 1 });
});
