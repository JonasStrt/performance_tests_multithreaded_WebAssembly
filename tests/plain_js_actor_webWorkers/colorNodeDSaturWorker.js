
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

function dSaturSingleNode(nodeToColor, nodes, links, terms) {
  let color = 1;
  while (
    nodes.some(
      (n) =>
        links.some(
          (l) =>
            (l.from === nodeToColor.key && l.to === n.key) ||
            (l.to === nodeToColor.key && l.from === n.key)
        ) && n.color === color
    )
  ) {
    color++;
  }
  calculatePiLeibniz(terms);
  nodeToColor.color = color;
  return nodeToColor;
}

self.addEventListener('message', function(e) {
  const result = dSaturSingleNode(e.data["node"], e.data["nodes"], e.data["links"], e.data["terms"]);
  postMessage(result);
});

