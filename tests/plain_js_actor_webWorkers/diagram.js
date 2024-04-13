import * as go from "gojs";
import { startTest } from "./test";
import { sendData } from "../sendData";

var terms = localStorage.getItem("terms");
var threads = parseInt(localStorage.getItem("threads"), 10);
var nodeCount = localStorage.getItem("nodes");
var threadNodeCount = new Array(threads).fill(0);
var vis = localStorage.getItem("vis") === "true";

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
  allowMove: true,
  allowLink: false,
  allowZoom: true,
  allowHorizontalScroll: true,
  allowVerticalScroll: true,
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
myDiagram.linkTemplate = $(
  go.Link,
  $(go.Shape, { strokeWidth: 3, stroke: "Linen" })
);

if (vis) {
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
}

function generateGraph(n) {
  let nodes = [];
  let links = [];
  let counter = 1;
  if (n == 10 || n == 1000) {
    counter = 9;
  }
  let interval = n / 10;
  let vortex = false;

  // Knoten erstellen
  for (let i = 1; i <= n; i++) {
    nodes.push({ key: i, color: 0, weight: 0, lock: 0 });
  }

  function linkExists(from, to) {
    return links.some(
      (link) =>
        (link.from === from && link.to === to) ||
        (link.from === to && link.to === from)
    );
  }

  // Kanten erstellen
  for (let i = 1; i <= n; i++) {
    if (vortex) {
      if (i + 5 <= n && i - 3 >= 1) {
        if (!linkExists(i, i + 1)) {
          links.push({ from: i, to: i + 1 });
        }
        if (!linkExists(i, i + 5)) {
          links.push({ from: i, to: i + 5 });
        }
        if (!linkExists(i, i - 3)) {
          links.push({ from: i, to: i - 3 });
        }
        if (!linkExists(i, i - 2)) {
          links.push({ from: i, to: i - 2 });
        }
      }
    } else {
      let toNode = ((i + counter - 1) % n) + 1;
      if (!linkExists(i, toNode)) {
        links.push({ from: i, to: toNode });
      }
    }

    if (i % interval === 0) {
      counter++;
      vortex = !vortex;
    }
  }

  return { nodes, links: links };
}

let graph = generateGraph(nodeCount);
// node data
let nodes = graph.nodes;
// link data
let links = graph.links;
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
    "#711c91",
    "blue",
    "red",
    "green",
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
  if (vis) {
    var data = myDiagram.model.findNodeDataForKey(nodeKey);
    if (data) {
      myDiagram.model.startTransaction("change color");
      myDiagram.model.setDataProperty(data, "color", newColorCode);
      myDiagram.model.commitTransaction("change color");
    }
    myDiagram.updateAllTargetBindings();
  }
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
  console.log(links.length);
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

  sendData(
    time,
    +(memoryAfter.totalJSHeapSize / 1048576).toFixed(2),
    +calculateGiniCoefficient().toFixed(2),
    +threads,
    +nodeCount,
    "js_actor_webWorkers",
    vis
  );
}

window.startPerformanceTest = startPerformanceTest;

export { changeNodeColor, startPerformanceTest };
