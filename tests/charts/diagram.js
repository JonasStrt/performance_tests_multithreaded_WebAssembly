import Chart from "chart.js/auto";

var data;
var datasets;
var myChart;

var nodesValue;
var browserValue;
var visualizationChecked;
var valueSelection;

// async function initDataSet(xParam, yParam, browser, vis, nodes) {
//   const response = await fetch('/data');
//   data = await response.json();
//   console.log(data);
// }

async function initDataSet(xParam, yParam, browser, vis, nodes) {
  const response = await fetch("/data");
  const rawData = await response.json();
  console.log(yParam);
  console.log(browser);
  console.log(vis);
  console.log(nodes);

  // Filter the data based on browser, visualisation, and nodes criteria
  const filteredData = rawData.filter(
    (item) =>
      item.Browser === browser &&
      item.Visualisation === vis &&
      item.Nodes === nodes
  );

  // Group and calculate average values per implementation and thread count
  const groupedData = {};
  filteredData.forEach((item) => {
    const impl = item.Implementation;
    const threads = item[xParam];
    if (!groupedData[impl]) {
      groupedData[impl] = {};
    }
    if (!groupedData[impl][threads]) {
      groupedData[impl][threads] = [];
    }
    groupedData[impl][threads].push(item[yParam]);
  });

  const implementationColors = assignColors(Object.keys(groupedData));
  // Calculate average for each group using only 10 random samples
  const chartDataSets = Object.keys(groupedData).map((impl) => {
    const dataPoints = Object.keys(groupedData[impl]).map((threads) => {
      const samples = selectRandomSamples(groupedData[impl][threads], 10);
      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      return { x: parseInt(threads), y: avg };
    });

    return {
      label: impl,
      data: dataPoints,
      borderColor: implementationColors[impl],
      fill: false,
    };
  });

  return chartDataSets;
}

function selectRandomSamples(array, count) {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function generateChart() {
  getFormValues();
  const chartDataSets = await initDataSet(
    "Threads",
    valueSelection.toString(),
    browserValue.toString(),
    visualizationChecked,
    nodesValue
  );
  myChart = new Chart(document.getElementById("chart"), {
    type: "line",
    data: {
      datasets: chartDataSets,
    },
    options: {
      scales: {
        x: {
          type: "linear",
          position: "bottom",
        },
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

function assignColors(implementations) {
  const colors = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
    "#C9CBCF",
    "#7E7F9A",
    "#FFD700",
    "#DC143C",
    "#00FFFF",
    "#00008B",
    "#008B8B",
    "#B8860B",
    "#006400",
  ];

  const colorMap = {};
  implementations.forEach((impl, index) => {
    colorMap[impl] = colors[index % colors.length];
  });

  return colorMap;
}

document.getElementById("download-btn").addEventListener("click", function () {
  const url = myChart.toBase64Image(); // Erzeugt eine Base64-URL des Diagramms
  const link = document.createElement("a");
  link.href = url;
  link.download = "my-chart.png"; // Definiert den Download-Namen der Datei
  link.click();
  link.remove();
});

function getFormValues() {
  nodesValue = parseInt(document.getElementById("nodesDropdown").value); // Stellen Sie sicher, dass es eine Zahl ist
  browserValue = document.getElementById("browserDropdown").value;
  visualizationChecked = document.getElementById("flexSwitchCheckDefault").checked;
  valueSelection = document.getElementById("valueDropdown").value;
}
window.generateChart = generateChart;
export { generateChart };
