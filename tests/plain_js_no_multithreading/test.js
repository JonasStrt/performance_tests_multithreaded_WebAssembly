import * as go from 'gojs';

const $ = go.GraphObject.make;

const myDiagram = $(go.Diagram, 'myDiagramDiv', {
    "undoManager.isEnabled": false, // Undo & Redo deaktivieren
            allowMove: false, // Verschieben von Knoten verbieten
            allowLink: false, // Erstellen neuer Verbindungen verbieten
            allowZoom: false, // Zoomen verbieten
            allowHorizontalScroll: false, // Horizontales Scrollen verbieten
            allowVerticalScroll: false, // Vertikales Scrollen verbieten
            initialAutoScale: go.Diagram.Uniform // Automatisches Zoomen, damit alles passt
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
    $(go.ForceDirectedLayout, { defaultSpringLength: 80, defaultElectricalCharge: 180 });


myDiagram.model = new go.GraphLinksModel(
    [
        { key: 1, color: 0 },
        { key: 2, color: 0 },
        { key: 3, color: 0 },
        { key: 4, color: 0 },
        { key: 5, color: 0 },
        { key: 6, color: 0 },
        { key: 7, color: 0 },
        { key: 8, color: 0 },
        { key: 9, color: 0 },
        { key: 10, color: 0 },
        { key: 11, color: 0 },
        { key: 12, color: 0 },
        { key: 13, color: 0 },
        { key: 14, color: 0 },
        { key: 15, color: 0 },
        { key: 16, color: 0 },
        { key: 17, color: 0 },
        { key: 18, color: 0 },
        { key: 19, color: 0 },
        { key: 20, color: 0 }
    ],
    [
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
    ]
);

function mapColor(colorCode) {
    const colors = ["white","red", "green", "blue", "orange", "purple", "yellow"];
    return colors[colorCode] || "gray"; 
}