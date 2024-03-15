import * as go from 'gojs';
import { startTest } from './test';

const $ = go.GraphObject.make;

const myDiagram = $(go.Diagram, 'myDiagramDiv', {
            "undoManager.isEnabled": false, // Undo & Redo deaktivieren
            allowMove: false, // Verschieben von Knoten verbieten
            allowLink: false, // Erstellen neuer Verbindungen verbieten
            allowZoom: false, // Zoomen verbieten
            allowHorizontalScroll: false, // Horizontales Scrollen verbieten
            allowVerticalScroll: false, // Vertikales Scrollen verbieten
            initialAutoScale: go.Diagram.Uniform, // Automatisches Zoomen, damit alles passt
});

// Definiere das Aussehen der Knoten
myDiagram.nodeTemplate =
$(go.Node, "Auto",
    $(go.Shape, "Circle",  // Form des Knotens: Kreis
        {
            strokeWidth: 2, // Rand
            stroke: "black", // Farbe der Umrandung
            fill: "white" // Standardfüllung: weiß (wird über Datenbindung gesetzt)
        },
        new go.Binding("fill", "color", mapColor)), // Datenbindung für die Füllfarbe
    $(go.TextBlock,
        { margin: 8 },  // Text innerhalb des Kreises zentrieren
        new go.Binding("text", "key")) // Der Schlüssel des Knotens wird als Text angezeigt
);

// Definiere das Aussehen der Verbindungen
myDiagram.linkTemplate =
$(go.Link,  // Einfache Linie ohne Pfeile
    $(go.Shape) // Die Darstellung der Linie
);

myDiagram.layout =
    $(go.ForceDirectedLayout, { defaultSpringLength: 300, defaultElectricalCharge: 500 });

let nodes = 
[
    { key: 1, color: 0, weight:0 },
    { key: 2, color: 0, weight:0 },
    { key: 3, color: 0, weight:0 },
    { key: 4, color: 0, weight:0 },
    { key: 5, color: 0, weight:0 },
    { key: 6, color: 0, weight:0 },
    { key: 7, color: 0, weight:0 },
    { key: 8, color: 0, weight:0 },
    { key: 9, color: 0, weight:0 },
    { key: 10, color: 0, weight:0 },
    { key: 11, color: 0, weight:0 },
    { key: 12, color: 0, weight:0 },
    { key: 13, color: 0, weight:0 },
    { key: 14, color: 0, weight:0 },
    { key: 15, color: 0, weight:0 },
    { key: 16, color: 0, weight:0 },
    { key: 17, color: 0, weight:0 },
    { key: 18, color: 0, weight:0 },
    { key: 19, color: 0, weight:0 },
    { key: 20, color: 0, weight:0 },
    {key: 21, color: 0, weight: 0},
    {key: 22, color: 0, weight: 0},
    {key: 23, color: 0, weight: 0},
    {key: 24, color: 0, weight: 0},
    {key: 25, color: 0, weight: 0},
    {key: 26, color: 0, weight: 0},
    {key: 27, color: 0, weight: 0},
    {key: 28, color: 0, weight: 0},
    {key: 29, color: 0, weight: 0},
    {key: 30, color: 0, weight: 0},
    {key: 31, color: 0, weight: 0},
    {key: 32, color: 0, weight: 0},
    {key: 33, color: 0, weight: 0},
    {key: 34, color: 0, weight: 0},
    {key: 35, color: 0, weight: 0},
    {key: 36, color: 0, weight: 0},
    {key: 37, color: 0, weight: 0},
    {key: 38, color: 0, weight: 0},
    {key: 39, color: 0, weight: 0},
    {key: 40, color: 0, weight: 0},
    {key: 41, color: 0, weight: 0},
    {key: 42, color: 0, weight: 0},
    {key: 43, color: 0, weight: 0},
    {key: 44, color: 0, weight: 0},
    {key: 45, color: 0, weight: 0},
    {key: 46, color: 0, weight: 0},
    {key: 47, color: 0, weight: 0},
    {key: 48, color: 0, weight: 0},
    {key: 49, color: 0, weight: 0},
    {key: 50, color: 0, weight: 0},
    {key: 51, color: 0, weight: 0},
    {key: 52, color: 0, weight: 0},
    {key: 53, color: 0, weight: 0},
    {key: 54, color: 0, weight: 0},
    {key: 55, color: 0, weight: 0},
    {key: 56, color: 0, weight: 0},
    {key: 57, color: 0, weight: 0},
    {key: 58, color: 0, weight: 0},
    {key: 59, color: 0, weight: 0},
    {key: 60, color: 0, weight: 0},
    {key: 61, color: 0, weight: 0},
    {key: 62, color: 0, weight: 0},
    {key: 63, color: 0, weight: 0},
    {key: 64, color: 0, weight: 0},
    {key: 65, color: 0, weight: 0},
    {key: 66, color: 0, weight: 0},
    {key: 67, color: 0, weight: 0},
    {key: 68, color: 0, weight: 0},
    {key: 69, color: 0, weight: 0},
    {key: 70, color: 0, weight: 0},
    {key: 71, color: 0, weight: 0},
    {key: 72, color: 0, weight: 0},
    {key: 73, color: 0, weight: 0},
    {key: 74, color: 0, weight: 0},
    {key: 75, color: 0, weight: 0},
    {key: 76, color: 0, weight: 0},
    {key: 77, color: 0, weight: 0},
    {key: 78, color: 0, weight: 0},
    {key: 79, color: 0, weight: 0},
    {key: 80, color: 0, weight: 0},
    {key: 81, color: 0, weight: 0},
    {key: 82, color: 0, weight: 0},
    {key: 83, color: 0, weight: 0},
    {key: 84, color: 0, weight: 0},
    {key: 85, color: 0, weight: 0},
    {key: 86, color: 0, weight: 0},
    {key: 87, color: 0, weight: 0},
    {key: 88, color: 0, weight: 0},
    {key: 89, color: 0, weight: 0},
    {key: 90, color: 0, weight: 0},
    {key: 91, color: 0, weight: 0},
    {key: 92, color: 0, weight: 0},
    {key: 93, color: 0, weight: 0},
    {key: 94, color: 0, weight: 0},
    {key: 95, color: 0, weight: 0},
    {key: 96, color: 0, weight: 0},
    {key: 97, color: 0, weight: 0},
    {key: 98, color: 0, weight: 0},
    {key: 99, color: 0, weight: 0},
    {key: 100, color: 0, weight: 0}
];

let links =     [
    { from: 1, to: 2 }, { from: 1, to: 6 },
    { from: 2, to: 3 }, { from: 2, to: 8 },
    { from: 3, to: 10 }, { from: 3, to: 4 },
    { from: 4, to: 5 }, { from: 4, to: 12 },
    { from: 5, to: 1 }, { from: 5, to: 14 },
    { from: 6, to: 7 }, { from: 7, to: 8 },
    { from: 7, to: 17 }, { from: 8, to: 9 },
    { from: 9, to: 18 }, { from: 9, to: 10 },
    { from: 10, to: 11 }, { from: 11, to: 19 },
    { from: 11, to: 12 }, { from: 12, to: 13 },
    { from: 13, to: 20 }, { from: 13, to: 14 },
    { from: 14, to: 15 }, { from: 15, to: 16 },
    { from: 15, to: 6 }, { from: 16, to: 17 },
    { from: 17, to: 18 }, { from: 18, to: 19 },
    { from: 19, to: 20 }, { from: 20, to: 16 },

     { from: 1, to: 21 }, { from: 1, to: 22 },
    { from: 2, to: 22 }, { from: 2, to: 23 },
    { from: 3, to: 23 }, { from: 3, to: 24 },
    { from: 4, to: 24 }, { from: 4, to: 25 },
    { from: 5, to: 25 }, { from: 5, to: 26 },


    {from: 21, to: 22}, {from: 21, to: 26},
    {from: 22, to: 23}, {from: 22, to: 27},
    {from: 23, to: 24}, {from: 23, to: 28},
    {from: 24, to: 25}, {from: 24, to: 29},
    {from: 25, to: 26}, {from: 25, to: 30},
    {from: 26, to: 27}, {from: 26, to: 31},
    {from: 27, to: 28}, {from: 27, to: 32},
    {from: 28, to: 29}, {from: 28, to: 33},
    {from: 29, to: 30}, {from: 29, to: 34},
    {from: 30, to: 31}, {from: 30, to: 35},
    {from: 31, to: 32}, {from: 31, to: 36},
    {from: 32, to: 33}, {from: 32, to: 37},
    {from: 33, to: 34}, {from: 33, to: 38},
    {from: 34, to: 35}, {from: 34, to: 39},
    {from: 35, to: 36}, {from: 35, to: 40},
    {from: 36, to: 37}, {from: 36, to: 41},
    {from: 37, to: 38}, {from: 37, to: 42},
    {from: 38, to: 39}, {from: 38, to: 43},
    {from: 39, to: 40}, {from: 39, to: 44},
    {from: 40, to: 41}, {from: 40, to: 45},
    {from: 41, to: 42}, {from: 41, to: 46},
    {from: 42, to: 43}, {from: 42, to: 47},
    {from: 43, to: 44}, {from: 43, to: 48},
    {from: 44, to: 45}, {from: 44, to: 49},
    {from: 45, to: 46}, {from: 45, to: 50},
    {from: 46, to: 47}, {from: 46, to: 51},
    {from: 47, to: 48}, {from: 47, to: 52},
    {from: 48, to: 49}, {from: 48, to: 53},
    {from: 49, to: 50}, {from: 49, to: 54},
    {from: 50, to: 51}, {from: 50, to: 55},
    {from: 51, to: 52}, {from: 51, to: 56},
    {from: 52, to: 53}, {from: 52, to: 57},
    {from: 53, to: 54}, {from: 53, to: 58},
    {from: 54, to: 55}, {from: 54, to: 59},
    {from: 55, to: 56}, {from: 55, to: 60},
    {from: 56, to: 57}, {from: 56, to: 61},
    {from: 57, to: 58}, {from: 57, to: 62},
    {from: 58, to: 59}, {from: 58, to: 63},
    {from: 59, to: 60}, {from: 59, to: 64},
    {from: 60, to: 61}, {from: 60, to: 65},
    {from: 61, to: 62}, {from: 61, to: 66},
    {from: 62, to: 63}, {from: 62, to: 67},
    {from: 63, to: 64}, {from: 63, to: 68},
    {from: 64, to: 65}, {from: 64, to: 69},
    {from: 65, to: 66}, {from: 65, to: 70},
    {from: 66, to: 67}, {from: 66, to: 71},
    {from: 67, to: 68}, {from: 67, to: 72},
    {from: 68, to: 69}, {from: 68, to: 73},
    {from: 69, to: 70}, {from: 69, to: 74},
    {from: 70, to: 71}, {from: 70, to: 75},
    {from: 71, to: 72}, {from: 71, to: 76},
    {from: 72, to: 73}, {from: 72, to: 77},
    {from: 73, to: 74}, {from: 73, to: 78},
    {from: 74, to: 75}, {from: 74, to: 79},
    {from: 75, to: 76}, {from: 75, to: 80},
    {from: 76, to: 77}, {from: 76, to: 81},
    {from: 77, to: 78}, {from: 77, to: 82},
    {from: 78, to: 79}, {from: 78, to: 83},
    {from: 79, to: 80}, {from: 79, to: 84},
    {from: 80, to: 81}, {from: 80, to: 85},
    {from: 81, to: 82}, {from: 81, to: 86},
    {from: 82, to: 83}, {from: 82, to: 87},
    {from: 83, to: 84}, {from: 83, to: 88},
    {from: 84, to: 85}, {from: 84, to: 89},
    {from: 85, to: 86}, {from: 85, to: 90},
    {from: 86, to: 87}, {from: 86, to: 91},
    {from: 87, to: 88}, {from: 87, to: 92},
    {from: 88, to: 89}, {from: 88, to: 93},
    {from: 89, to: 90}, {from: 89, to: 94},
    {from: 90, to: 91}, {from: 90, to: 95},
    {from: 91, to: 92}, {from: 91, to: 96},
    {from: 92, to: 93}, {from: 92, to: 97},
    {from: 93, to: 94}, {from: 93, to: 98},
    {from: 94, to: 95}, {from: 94, to: 99},
    {from: 95, to: 96}, {from: 95, to: 100},
    {from: 96, to: 97}, {from: 96, to: 21},
    {from: 97, to: 98}, {from: 97, to: 22},
    {from: 98, to: 99}, {from: 98, to: 23},
    {from: 99, to: 100}, {from: 99, to: 24},
    {from: 100, to: 21}, {from: 100, to: 25}
    
]

myDiagram.model = new go.GraphLinksModel(nodes, links);

function mapColor(colorCode) {
    const colors = ["lightgray","red", "green", "blue", "orange", "purple", "yellow"];
    return colors[colorCode] || "gray"; 
}

function changeNodeColor(nodeKey, newColor) {
    var data = myDiagram.model.findNodeDataForKey(nodeKey);
    console.log("ändere Farbe");
    console.log(data);
    console.log(newColor);
    if (data) {
      myDiagram.model.startTransaction("change color");
      myDiagram.model.setDataProperty(data, "color", newColor);
      myDiagram.model.commitTransaction("change color");
    }
  }

  function updateDiagramm() {
    myDiagram.updateAllTargetBindings();
  }


  function startPerformanceTest() {
    let calculations = localStorage.getItem('calculations');
    let threads = localStorage.getItem('threads');
    const start = performance.now();  
    startTest(nodes, links, calculations, threads);
    const end = performance.now();     
    const time = start - end;          
    console.log(start);
    console.log(end);
    console.log(time);
  }
  window.startPerformanceTest = startPerformanceTest;
// window.addEventListener('load', function() {

// });
export {changeNodeColor, updateDiagramm, startPerformanceTest};
