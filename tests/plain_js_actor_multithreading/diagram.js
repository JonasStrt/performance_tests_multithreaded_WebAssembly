import * as go from "gojs";
import { startTest } from "./test";

var terms = localStorage.getItem("terms");
var threads = parseInt(localStorage.getItem("threads"), 10);
var threadNodeCount = new Array(threads).fill(0);

function addListItemToContainer(text, id) {
  // Wähle den Container aus, in dem die Liste enthalten ist
  const container = document.querySelector(".list-container .row .col-10");

  // Erstelle ein neues div-Element für den Listeneintrag
  const listGroupDiv = document.createElement("div");
  listGroupDiv.classList.add("list-group", "bg-dark");
  listGroupDiv.style.marginTop = "4px";

  // Erstelle ein neues a-Element für den Link
  const link = document.createElement("a");
  link.classList.add(
    "list-group-item",
    "list-group-item-action",
    "text-white",
    "bg-dark",
    "border-light"
  );
  link.textContent = text;

  // Setze die ID für das a-Element
  link.id = id;

  // Füge den Link zum div-Element hinzu
  listGroupDiv.appendChild(link);

  // Füge das neue div-Element zum Container hinzu
  container.appendChild(listGroupDiv);
}

//#region  gojs
const $ = go.GraphObject.make;

// the gojs diagram
const myDiagram = $(go.Diagram, "myDiagramDiv", {
  "undoManager.isEnabled": false,
  //allowMove: false,
  allowLink: false,
  allowZoom: false,
  allowHorizontalScroll: false,
  allowVerticalScroll: false,
  initialAutoScale: go.Diagram.Uniform,
});

// the nodeTemplate
myDiagram.nodeTemplate = $(
  go.Node,
  "Auto",
  $(
    go.Shape,
    "Circle",
    {
      strokeWidth: 2,
      stroke: "black",
      fill: "white",
    },
    new go.Binding("fill", "color", mapColor)
  ),
  $(
    go.TextBlock,
    { margin: 20, font: "bold 32pt Sans-Serif" },
    new go.Binding("text", "key")
  )
);

// the linkTemplate
myDiagram.linkTemplate = $(go.Link, $(go.Shape));

// the layout
myDiagram.layout = $(go.ForceDirectedLayout, {
  defaultSpringLength: 30,
  defaultElectricalCharge: 500,
  defaultGravitationalMass: 200,
  defaultSpringStiffness: 0.1,
  epsilonDistance: 1,
  infinityDistance: 5000,
  moveLimit: 100,
  maxIterations: 300,
  arrangementSpacing: new go.Size(100, 100),
});

// node data
let nodes = [
  { key: 1, color: 0, weight: 0, lock: 0 },
  { key: 2, color: 0, weight: 0, lock: 0 },
  { key: 3, color: 0, weight: 0, lock: 0 },
  { key: 4, color: 0, weight: 0, lock: 0 },
  { key: 5, color: 0, weight: 0, lock: 0 },
  { key: 6, color: 0, weight: 0, lock: 0 },
  { key: 7, color: 0, weight: 0, lock: 0 },
  { key: 8, color: 0, weight: 0, lock: 0 },
  { key: 9, color: 0, weight: 0, lock: 0 },
  { key: 10, color: 0, weight: 0, lock: 0 },
  { key: 11, color: 0, weight: 0, lock: 0 },
  { key: 12, color: 0, weight: 0, lock: 0 },
  { key: 13, color: 0, weight: 0, lock: 0 },
  { key: 14, color: 0, weight: 0, lock: 0 },
  { key: 15, color: 0, weight: 0, lock: 0 },
  { key: 16, color: 0, weight: 0, lock: 0 },
  { key: 17, color: 0, weight: 0, lock: 0 },
  { key: 18, color: 0, weight: 0, lock: 0 },
  { key: 19, color: 0, weight: 0, lock: 0 },
  { key: 20, color: 0, weight: 0, lock: 0 },
  { key: 21, color: 0, weight: 0, lock: 0 },
  { key: 22, color: 0, weight: 0, lock: 0 },
  { key: 23, color: 0, weight: 0, lock: 0 },
  { key: 24, color: 0, weight: 0, lock: 0 },
  { key: 25, color: 0, weight: 0, lock: 0 },
  { key: 26, color: 0, weight: 0, lock: 0 },
  { key: 27, color: 0, weight: 0, lock: 0 },
  { key: 28, color: 0, weight: 0, lock: 0 },
  { key: 29, color: 0, weight: 0, lock: 0 },
  { key: 30, color: 0, weight: 0, lock: 0 },
  { key: 31, color: 0, weight: 0, lock: 0 },
  { key: 32, color: 0, weight: 0, lock: 0 },
  { key: 33, color: 0, weight: 0, lock: 0 },
  { key: 34, color: 0, weight: 0, lock: 0 },
  { key: 35, color: 0, weight: 0, lock: 0 },
  { key: 36, color: 0, weight: 0, lock: 0 },
  { key: 37, color: 0, weight: 0, lock: 0 },
  { key: 38, color: 0, weight: 0, lock: 0 },
  { key: 39, color: 0, weight: 0, lock: 0 },
  { key: 40, color: 0, weight: 0, lock: 0 },
  { key: 41, color: 0, weight: 0, lock: 0 },
  { key: 42, color: 0, weight: 0, lock: 0 },
  { key: 43, color: 0, weight: 0, lock: 0 },
  { key: 44, color: 0, weight: 0, lock: 0 },
  { key: 45, color: 0, weight: 0, lock: 0 },
  { key: 46, color: 0, weight: 0, lock: 0 },
  { key: 47, color: 0, weight: 0, lock: 0 },
  { key: 48, color: 0, weight: 0, lock: 0 },
  { key: 49, color: 0, weight: 0, lock: 0 },
  { key: 50, color: 0, weight: 0, lock: 0 },
  { key: 51, color: 0, weight: 0, lock: 0 },
  { key: 52, color: 0, weight: 0, lock: 0 },
  { key: 53, color: 0, weight: 0, lock: 0 },
  { key: 54, color: 0, weight: 0, lock: 0 },
  { key: 55, color: 0, weight: 0, lock: 0 },
  { key: 56, color: 0, weight: 0, lock: 0 },
  { key: 57, color: 0, weight: 0, lock: 0 },
  { key: 58, color: 0, weight: 0, lock: 0 },
  { key: 59, color: 0, weight: 0, lock: 0 },
  { key: 60, color: 0, weight: 0, lock: 0 },
  { key: 61, color: 0, weight: 0, lock: 0 },
  { key: 62, color: 0, weight: 0, lock: 0 },
  { key: 63, color: 0, weight: 0, lock: 0 },
  { key: 64, color: 0, weight: 0, lock: 0 },
  { key: 65, color: 0, weight: 0, lock: 0 },
  { key: 66, color: 0, weight: 0, lock: 0 },
  { key: 67, color: 0, weight: 0, lock: 0 },
  { key: 68, color: 0, weight: 0, lock: 0 },
  { key: 69, color: 0, weight: 0, lock: 0 },
  { key: 70, color: 0, weight: 0, lock: 0 },
  { key: 71, color: 0, weight: 0, lock: 0 },
  { key: 72, color: 0, weight: 0, lock: 0 },
  { key: 73, color: 0, weight: 0, lock: 0 },
  { key: 74, color: 0, weight: 0, lock: 0 },
  { key: 75, color: 0, weight: 0, lock: 0 },
  { key: 76, color: 0, weight: 0, lock: 0 },
  { key: 77, color: 0, weight: 0, lock: 0 },
  { key: 78, color: 0, weight: 0, lock: 0 },
  { key: 79, color: 0, weight: 0, lock: 0 },
  { key: 80, color: 0, weight: 0, lock: 0 },
  { key: 81, color: 0, weight: 0, lock: 0 },
  { key: 82, color: 0, weight: 0, lock: 0 },
  { key: 83, color: 0, weight: 0, lock: 0 },
  { key: 84, color: 0, weight: 0, lock: 0 },
  { key: 85, color: 0, weight: 0, lock: 0 },
  { key: 86, color: 0, weight: 0, lock: 0 },
  { key: 87, color: 0, weight: 0, lock: 0 },
  { key: 88, color: 0, weight: 0, lock: 0 },
  { key: 89, color: 0, weight: 0, lock: 0 },
  { key: 90, color: 0, weight: 0, lock: 0 },
  { key: 91, color: 0, weight: 0, lock: 0 },
  { key: 92, color: 0, weight: 0, lock: 0 },
  { key: 93, color: 0, weight: 0, lock: 0 },
  { key: 94, color: 0, weight: 0, lock: 0 },
  { key: 95, color: 0, weight: 0, lock: 0 },
  { key: 96, color: 0, weight: 0, lock: 0 },
  { key: 97, color: 0, weight: 0, lock: 0 },
  { key: 98, color: 0, weight: 0, lock: 0 },
  { key: 99, color: 0, weight: 0, lock: 0 },
  { key: 100, color: 0, weight: 0, lock: 0 },
];

// link data
let links = [
  { from: 1, to: 2 },
  { from: 1, to: 6 },
  { from: 2, to: 3 },
  { from: 2, to: 8 },
  { from: 3, to: 10 },
  { from: 3, to: 4 },
  { from: 4, to: 5 },
  { from: 4, to: 12 },
  { from: 5, to: 1 },
  { from: 5, to: 14 },
  { from: 6, to: 7 },
  { from: 7, to: 8 },
  { from: 7, to: 17 },
  { from: 8, to: 9 },
  { from: 9, to: 18 },
  { from: 9, to: 10 },
  { from: 10, to: 11 },
  { from: 11, to: 19 },
  { from: 11, to: 12 },
  { from: 12, to: 13 },
  { from: 13, to: 20 },
  { from: 13, to: 14 },
  { from: 14, to: 15 },
  { from: 15, to: 16 },
  { from: 15, to: 6 },
  { from: 16, to: 17 },
  { from: 17, to: 18 },
  { from: 18, to: 19 },
  { from: 19, to: 20 },
  { from: 20, to: 16 },

  { from: 1, to: 21 },
  { from: 1, to: 22 },
  { from: 2, to: 22 },
  { from: 2, to: 23 },
  { from: 3, to: 23 },
  { from: 3, to: 24 },
  { from: 4, to: 24 },
  { from: 4, to: 25 },
  { from: 5, to: 25 },
  { from: 5, to: 26 },

  { from: 21, to: 22 },
  { from: 21, to: 26 },
  { from: 22, to: 23 },
  { from: 22, to: 27 },
  { from: 23, to: 24 },
  { from: 23, to: 28 },
  { from: 24, to: 25 },
  { from: 24, to: 29 },
  { from: 25, to: 26 },
  { from: 25, to: 30 },
  { from: 26, to: 27 },
  { from: 26, to: 31 },
  { from: 27, to: 28 },
  { from: 27, to: 32 },
  { from: 28, to: 29 },
  { from: 28, to: 33 },
  { from: 29, to: 30 },
  { from: 29, to: 34 },
  { from: 30, to: 31 },
  { from: 30, to: 35 },
  { from: 31, to: 32 },
  { from: 31, to: 36 },
  { from: 32, to: 33 },
  { from: 32, to: 37 },
  { from: 33, to: 34 },
  { from: 33, to: 38 },
  { from: 34, to: 35 },
  { from: 34, to: 39 },
  { from: 35, to: 36 },
  { from: 35, to: 40 },
  { from: 36, to: 37 },
  { from: 36, to: 41 },
  { from: 37, to: 38 },
  { from: 37, to: 42 },
  { from: 38, to: 39 },
  { from: 38, to: 43 },
  { from: 39, to: 40 },
  { from: 39, to: 44 },
  { from: 40, to: 41 },
  { from: 40, to: 45 },
  { from: 41, to: 42 },
  { from: 41, to: 46 },
  { from: 42, to: 43 },
  { from: 42, to: 47 },
  { from: 43, to: 44 },
  { from: 43, to: 48 },
  { from: 44, to: 45 },
  { from: 44, to: 49 },
  { from: 45, to: 46 },
  { from: 45, to: 50 },
  { from: 46, to: 47 },
  { from: 46, to: 51 },
  { from: 47, to: 48 },
  { from: 47, to: 52 },
  { from: 48, to: 49 },
  { from: 48, to: 53 },
  { from: 49, to: 50 },
  { from: 49, to: 54 },
  { from: 50, to: 51 },
  { from: 50, to: 55 },
  { from: 51, to: 52 },
  { from: 51, to: 56 },
  { from: 52, to: 53 },
  { from: 52, to: 57 },
  { from: 53, to: 54 },
  { from: 53, to: 58 },
  { from: 54, to: 55 },
  { from: 54, to: 59 },
  { from: 55, to: 56 },
  { from: 55, to: 60 },
  { from: 56, to: 57 },
  { from: 56, to: 61 },
  { from: 57, to: 58 },
  { from: 57, to: 62 },
  { from: 58, to: 59 },
  { from: 58, to: 63 },
  { from: 59, to: 60 },
  { from: 59, to: 64 },
  { from: 60, to: 61 },
  { from: 60, to: 65 },
  { from: 61, to: 62 },
  { from: 61, to: 66 },
  { from: 62, to: 63 },
  { from: 62, to: 67 },
  { from: 63, to: 64 },
  { from: 63, to: 68 },
  { from: 64, to: 65 },
  { from: 64, to: 69 },
  { from: 65, to: 66 },
  { from: 65, to: 70 },
  { from: 66, to: 67 },
  { from: 66, to: 71 },
  { from: 67, to: 68 },
  { from: 67, to: 72 },
  { from: 68, to: 69 },
  { from: 68, to: 73 },
  { from: 69, to: 70 },
  { from: 69, to: 74 },
  { from: 70, to: 71 },
  { from: 70, to: 75 },
  { from: 71, to: 72 },
  { from: 71, to: 76 },
  { from: 72, to: 73 },
  { from: 72, to: 77 },
  { from: 73, to: 74 },
  { from: 73, to: 78 },
  { from: 74, to: 75 },
  { from: 74, to: 79 },
  { from: 75, to: 76 },
  { from: 75, to: 80 },
  { from: 76, to: 77 },
  { from: 76, to: 81 },
  { from: 77, to: 78 },
  { from: 77, to: 82 },
  { from: 78, to: 79 },
  { from: 78, to: 83 },
  { from: 79, to: 80 },
  { from: 79, to: 84 },
  { from: 80, to: 81 },
  { from: 80, to: 85 },
  { from: 81, to: 82 },
  { from: 81, to: 86 },
  { from: 82, to: 83 },
  { from: 82, to: 87 },
  { from: 83, to: 84 },
  { from: 83, to: 88 },
  { from: 84, to: 85 },
  { from: 84, to: 89 },
  { from: 85, to: 86 },
  { from: 85, to: 90 },
  { from: 86, to: 87 },
  { from: 86, to: 91 },
  { from: 87, to: 88 },
  { from: 87, to: 92 },
  { from: 88, to: 89 },
  { from: 88, to: 93 },
  { from: 89, to: 90 },
  { from: 89, to: 94 },
  { from: 90, to: 91 },
  { from: 90, to: 95 },
  { from: 91, to: 92 },
  { from: 91, to: 96 },
  { from: 92, to: 93 },
  { from: 92, to: 97 },
  { from: 93, to: 94 },
  { from: 93, to: 98 },
  { from: 94, to: 95 },
  { from: 94, to: 99 },
  { from: 95, to: 96 },
  { from: 95, to: 100 },
  { from: 96, to: 97 },
  { from: 96, to: 21 },
  { from: 97, to: 98 },
  { from: 97, to: 22 },
  { from: 98, to: 99 },
  { from: 98, to: 23 },
  { from: 99, to: 100 },
  { from: 99, to: 24 },
  { from: 100, to: 21 },
  { from: 100, to: 25 },
];

// create the model
myDiagram.model = new go.GraphLinksModel(nodes, links);

/**
 * Maps a numeric color code to a corresponding color name.
 * If the provided color code does not map to a predefined color, it defaults to "gray".
 * The function defines a list of color names.
 * It then returns the color name corresponding to the numeric color code provided as an argument.
 * If the color code is outside the range of predefined colors, "gray" is returned as a default color.
 *
 * @param {number} colorCode - The numeric code representing a color. Expected to be an integer within the range of the colors array indices.
 * @returns {string} The name of the color corresponding to the provided color code. Returns "gray" if the color code does not match any predefined color.
 */
function mapColor(colorCode) {
  const colors = [
    "lightgray",
    "#00b3fe",
    "#1afe49",
    "#ff124f",
    "#defe47",
    "#ff6e27",
    "#00b3fe",
    "#65dc98",
  ];
  return colors[colorCode] || "gray";
}

/**
 * Changes the color of a specific node in the diagram to a new color, identified by a numeric color code.
 * The function searches for the node using its key, and if found, initiates a transaction to update the node's color property to the new color code.
 * @param {string} nodeKey - The unique identifier for the node whose color needs to be changed.
 * @param {number} newColorCode - The numeric code representing the new color for the node. This code is expected to correspond to a specific color managed by the application.
 * @returns {void} Does not return a value. Modifies the diagram's model directly.
 */
function changeNodeColor(nodeKey, newColorCode, thread) {
  threadNodeCount[thread] += 1;
  var data = myDiagram.model.findNodeDataForKey(nodeKey);
  if (data) {
    myDiagram.model.startTransaction("change color");
    myDiagram.model.setDataProperty(data, "color", newColorCode);
    myDiagram.model.commitTransaction("change color");
  }
  myDiagram.updateAllTargetBindings();
}

//#endregion gojs

/**
 * Retrieves the current memory usage statistics from the browser's performance API.
 * This function checks if the browser supports the `performance.memory` API.
 * If supported, it returns the memory statistics, including total JS heap size, used JS heap size, and JS heap size limit.
 * If the API is not supported in the user's browser, it logs a message to the console.
 *
 * @returns {PerformanceMemory | undefined} An object containing memory usage statistics such as
 * total JS heap size, used JS heap size, and JS heap size limit if the browser supports it.
 * Returns `undefined` and logs a message to the console if not supported.
 */
function getMemoryUsage() {
  if (window.performance && window.performance.memory) {
    const memory = window.performance.memory;
    return memory;
  } else {
    console.log("Performance.memory API is not supported in this browser.");
    return 0;
  }
}

function calculateGiniCoefficient() {
  const sortedTasks = threadNodeCount.slice().sort((a, b) => a - b);
  const n = sortedTasks.length;
  let kumulativeSummen = 0;
  let summeDerAufgaben = 0;

  // Kumulative Summe und Summe der Aufgaben berechnen
  for (let i = 0; i < n; i++) {
    kumulativeSummen += sortedTasks[i] * (i + 1);
    summeDerAufgaben += sortedTasks[i];
  }

  // Gini-Koeffizient berechnen, falls Summe der Aufgaben nicht 0 ist
  const gini = summeDerAufgaben
    ? (2 * kumulativeSummen) / (n * summeDerAufgaben) - (n + 1) / n
    : 0;
  return gini;
}

/**
 * Starts a performance test by initiating a test based on stored settings and measuring execution time and memory usage before and after the test.
 * Retrieves test settings from localStorage, including terms and threads.
 * It measures the memory usage before the test starts and updates the DOM with the initial memory usage.
 * After executing the test, it measures the execution time and final memory usage, then updates the DOM with these values.
 * Calls the `startTest` function that initiates the test process.
 *
 * @returns {void} Does not return a value. Results of the performance test are displayed on the webpage.
 */
async function startPerformanceTest() {
  const memoryBefore = getMemoryUsage();
  document.getElementById("value3").innerText = (
    memoryBefore.usedJSHeapSize / 1048576
  ).toFixed(2);
  const start = performance.now();
  //start test
  await startTest(nodes, links, terms, threads);
  //end test
  const end = performance.now();
  const memoryAfter = getMemoryUsage();
  const time = end - start;
  document.getElementById("value1").innerText = time;
  document.getElementById("value2").innerText = (
    memoryAfter.totalJSHeapSize / 1048576
  ).toFixed(2);
  document.getElementById("value4").innerText = (
    memoryAfter.usedJSHeapSize / 1048576
  ).toFixed(2);
  document.getElementById("value5").innerText =
    calculateGiniCoefficient().toFixed(2);

  for (let i = 0; i < threads; i++) {
    addListItemToContainer(
      "Thread " + i + " colored " + threadNodeCount[i] + " nodes",
      "thread" + i
    );
  }
}

window.startPerformanceTest = startPerformanceTest;

export { changeNodeColor, startPerformanceTest };
