import { changeNodeColor, updateDiagramm } from './diagramm';
var calculations;
var threads;
function startTest(nodes, links, _calculations, _threads){
    calculations = _calculations;
    threads = _threads;
    DSatur(nodes, links);
}
async function DSatur(nodes, links) {
    // Aktualisiere die Sättigung aller Knoten
    function updateSaturation(nodeKey, color) {
        links.forEach(link => {
            let targetNode = null;
            if (link.from === nodeKey) {
                targetNode = nodes.find(n => n.key === link.to);
            } else if (link.to === nodeKey) {
                targetNode = nodes.find(n => n.key === link.from);
            }

            if (targetNode && !targetNode.color) {
                // Erhöhe die Sättigung, wenn der angrenzende Knoten noch nicht gefärbt ist
                targetNode.weight++;
            }
        });
    }

    // Wähle den nächsten Knoten basierend auf der höchsten Sättigung (weight)
    function selectNode() {
        return nodes.filter(n => n.color === 0)
                    .sort((a, b) => b.weight - a.weight || 
                          links.filter(l => l.from === b.key || l.to === b.key).length - 
                          links.filter(l => l.from === a.key || l.to === a.key).length)
                    .pop();
    }

    let node = selectNode();
    while (node) {
        // Finde eine gültige Farbe für den Knoten
        let color = 1;
        while (nodes.some(n => 
               (links.some(l => (l.from === node.key && l.to === n.key) || 
                               (l.to === node.key && l.from === n.key)) && n.color === color))) {
            color++;
        }
        intensiveTask(calculations);
        node.color = color;
        updateDiagramm();
        updateSaturation(node.key, color);
        
        node = selectNode();
    }
}


function intensiveTask(terms) {
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

export {startTest};