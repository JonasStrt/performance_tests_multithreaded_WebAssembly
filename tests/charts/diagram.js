import Chart from "chart.js/auto";

var data;
var datasets;
var myChart;

var nodesValue;
var browserValue;
var visualizationChecked;
var valueSelection;
var termsValue;

var cornerText ="";

// Plugin definieren
const cornerTextPlugin = {
  id: 'cornerText',
  beforeDraw: (chart, args, options) => {
    const { ctx, chartArea } = chart;
    ctx.save();
    // Position und Stil festlegen
    ctx.font = options.font || '16px Arial';
    ctx.fillStyle = options.fillStyle || 'black';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    // Text und Position festlegen
    const text = options.text || '';
    const x = chartArea.right - 10;
    const y = chartArea.top + 10;
    // Text zeichnen
    ctx.fillText(text, x, y);
    ctx.restore();
  }
};


async function initDataSet(xParam, yParam, browser, vis, nodes, terms) {
  const response = await fetch("/data");
  const rawData = await response.json();
  console.log(yParam);
  console.log(browser);
  console.log(vis);
  console.log(nodes);
  console.log(terms)

  // Filter the data based on browser, visualisation, and nodes criteria
  const filteredData = rawData.filter(
    (item) =>
      item.Browser === browser &&
      item.Visualisation === vis &&
      item.Nodes === nodes &&
      item.Terms === terms
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
      const samples = selectRandomSamples(groupedData[impl][threads], 5);
      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      return { x: parseInt(threads), y: avg };
    });
    if(impl == "wasm_sharedMemory_webWorker") {
      return {
        label: impl +"s",
        data: dataPoints,
        borderColor: implementationColors[impl],
        tension:0.3,
        pointRadius:3.5,
        fill: false,
      };
    }
    else if (impl == "wasm_no_multithreading") {
      dataPoints.push({x:32,y:dataPoints[0].y});
      return {
        label: impl,
        data: dataPoints,
        borderColor: implementationColors[impl],
        borderDash: [10, 5],
        fill: false,
        tension:0.3,
        pointRadius:0,
        lineWidth:0.1,
        borderWidth:1,
        showLine:true
      };
    }
    else if (impl == "js_no_multithreading") {
      dataPoints.push({x:32,y:dataPoints[0].y});
      return {
        label: impl,
        data: dataPoints,
        borderColor: implementationColors[impl],
        borderDash: [10, 5],
        fill: false,
        tension:0.3,
        pointRadius:0,
        lineWidth:0.1,
        borderWidth:1,
        showLine:true
      };
    }
    else {
      return {
        label: impl,
        data: dataPoints,
        borderColor: implementationColors[impl],
        tension:0.3,
        pointRadius:3.5,
        fill: false,
      };
    }

  });

  return chartDataSets;
}


function findBestPoint(data, implementierungsname) {
  // Prüfen, ob das Array leer ist
  if (data.length === 0) return null;
  
  // Initialisiere den besten Punkt mit null, um zu beginnen
  let bestPoint = null;

  // Durchlaufen des Arrays, um den Punkt mit dem niedrigsten y-Wert und x > 1 zu finden
  for (let point of data) {
      if (point.x > 1 && (bestPoint === null || point.y < bestPoint.y)) {
          bestPoint = point;
      }
  }

  // Prüfen, ob ein bester Punkt gefunden wurde
  if (bestPoint === null) return null;

  // Erstellen des Ergebnisobjekts mit "best" als x-Wert
  return { x: implementierungsname, y: bestPoint.y };
}


async function initBarDataSet(xParam, yParam, browser, vis, nodes, terms) {
  const response = await fetch("/data");
  const rawData = await response.json();
  console.log(yParam);
  console.log(browser);
  console.log(vis);
  console.log(nodes);
  console.log(terms)

  // Filter the data based on browser, visualisation, and nodes criteria
  const filteredData = rawData.filter(
    (item) =>
      item.Browser === browser &&
      item.Visualisation === vis &&
      item.Nodes === nodes &&
      item.Terms === terms
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
      const samples = selectRandomSamples(groupedData[impl][threads], 5);
      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      return { x: parseInt(threads), y: avg };
    });

    if(impl == "wasm_sharedMemory_webWorker") {
      return {
        label: impl +"s",
        data: findBestPoint(dataPoints,  impl +"s"),
        backgroundColor: implementationColors[impl],
        fill: true,
      };
    }
    else if (impl == "wasm_no_multithreading") {
      dataPoints.push({x:32,y:dataPoints[0].y});
      return {
        label: impl,
        data: findBestPoint(dataPoints,  impl),
        backgroundColor: implementationColors[impl],
        fill: true,
      };
    }
    else if (impl == "js_no_multithreading") {
      dataPoints.push({x:32,y:dataPoints[0].y});
      return {
        label: impl,
        data: findBestPoint(dataPoints, impl),
        backgroundColor: implementationColors[impl],
        fill: true,
      };
    }
    else {
      return {
        label: impl,
        data: findBestPoint(dataPoints, impl),
        backgroundColor: implementationColors[impl],
        fill: true,
      };
    }

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
    nodesValue,
    termsValue
  );
  myChart = new Chart(document.getElementById("chart"), {
    type: "line",
    data: {
      datasets: chartDataSets,
    },
    options: {
      plugins: {
        legend: {
          labels: {
            font: {
              size: 18 // Hier setzen Sie die gewünschte Schriftgröße für die Legende
            }
          }
        },
        cornerText: {
            text: cornerText, // Der Text, den Sie anzeigen möchten
            font: '14px Arial', // Schriftart und -größe
            fillStyle: 'black' // Textfarbe
        }
    },
      scales: {
        x: {
          type: "linear",
          position: "bottom",
          title:{
            display:true,
            font:{
              size:20,
            },
            text:"Anzahl der Threads"
          }
        },
        y: {
          beginAtZero: true,
          title:{
            display:true,
            font:{
              size:20,
            },
            text: "Ausführungszeit [ms]"
          }
        },
      },
    },
    plugins: [cornerTextPlugin],
  });
}
async function generateBarChart() {
  getFormValues();
  const chartDataSets = await initBarDataSet(
    "Threads",
    valueSelection.toString(),
    browserValue.toString(),
    visualizationChecked,
    nodesValue,
    termsValue
  );
  const labels = chartDataSets.map(item => item.data.x);
const data = chartDataSets.map(item => item.data.y);
const backgroundColors = chartDataSets.map(item => item.backgroundColor);
  console.log(chartDataSets);
  myChart = new Chart(document.getElementById("chart"), {
    type: "bar",
    data: {
        labels: labels,
        datasets: [{
            label: 'Performance',
            data: data,
            backgroundColor: backgroundColors,
            fill: true
        }]
    },
    options: {
    //   plugins: {
    //     legend: {
    //       labels: {
    //         font: {
    //           size: 18 // Hier setzen Sie die gewünschte Schriftgröße für die Legende
    //         }
    //       }
    //     }
        // cornerText: {
        //     text: cornerText, // Der Text, den Sie anzeigen möchten
        //     font: '14px Arial', // Schriftart und -größe
        //     fillStyle: 'black' // Textfarbe
        // }
    // },
      scales: {
        x: {
          title:{
            display:true,
            font:{
              size:20,
            },
            text:"Niedrigste Ausführungszeit des Implementierungsansatzes (Threads > 1)"
          }
        },
        y: {
          beginAtZero: true,
          title:{
            display:true,
            font:{
              size:20,
            },
            text: "Ausführungszeit [ms]"
          }
        },
      },
    },
    // plugins: [cornerTextPlugin],
  });
}
function assignColors(implementations) {
  const colorMap = {};
  colorMap["js_no_multithreading"] = "gray";
  colorMap["js_actor_webWorkers"] = "LawnGreen";
  colorMap["js_sharedMemory_webWorkers"] = "DarkGreen";
  colorMap["wasm_no_multithreading"] = "gray0";
  colorMap["wasm_sharedMemory_pthreads"] = "red";
  colorMap["wasm_actor_pthreads"] = "cyan";
  colorMap["wasm_actor_webWorkers"] = "blue";
  colorMap["wasm_sharedMemory_webWorker"] = "orange";
  colorMap["wasm_sharedMemory_pthreads_noAtomics"] = "pink";
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
  termsValue = parseInt(document.getElementById("termsDropdown").value);

  cornerText = "Nodes: " + nodesValue+ "  " + "Terms: "+ termsValue + "  " + "Browser: "+ browserValue + "  " + "Visualisierung: "+ visualizationChecked;
}
window.generateChart = generateChart;
window.generateBarChart = generateBarChart;
export { generateChart };
