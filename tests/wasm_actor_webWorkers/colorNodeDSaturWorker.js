self.importScripts("DSaturWasmModuleWrapper.js");

self.addEventListener("message", async function (e) {
  nodes = e.data["nodes"];
  links = e.data["links"];
  terms = e.data["terms"];
  node = e.data["node"];
  var dSaturWasmModule = new DSaturWasmModuleWrapper();
  await dSaturWasmModule.init();
  nodeBufferSize = nodes.length * 16; // 16 Bytes pro Knoten
  linkBufferSize = links.length * 8; // 8 Bytes pro Verbindung
  totalBufferSize = nodeBufferSize + linkBufferSize;
  const nodesPtr = DSaturWasmModuleWrapper.WasmModule._malloc(totalBufferSize); // Speicher im WebAssembly-Modul reservieren
  const linksPtr = nodesPtr + nodeBufferSize; // Verbindungsdaten kommen nach den Knotendaten
  let memoryGraphData = new ArrayBuffer(totalBufferSize); // 4 Bytes für einen int32_t Zähler
  serializeGraph(memoryGraphData, nodes, links);
  var int32View = new Int32Array(memoryGraphData);
  DSaturWasmModuleWrapper.WasmModule.HEAP32.set(int32View, nodesPtr / 4);
  node.color = DSaturWasmModuleWrapper.WasmModule._processNode(
    node["key"],
    nodesPtr,
    nodes.length,
    linksPtr,
    links.length,
    terms
  );
  DSaturWasmModuleWrapper.WasmModule._free(nodesPtr);
  postMessage(node);
});

function serializeGraph(buffer, nodes, links) {
  // Serialisiere Knoten
  let int32View = new Int32Array(buffer);
  nodes.forEach((node, index) => {
    let baseIndex = index * 4; // 4 Int32 pro Knoten
    int32View[baseIndex] = node.key;
    int32View[baseIndex + 1] = node.color;
    int32View[baseIndex + 2] = node.weight;
    int32View[baseIndex + 3] = node.lock;
  });

  // Serialisiere Verbindungen
  links.forEach((link, index) => {
    let baseIndex = nodes.length * 4 + index * 2; // Setze fort, wo die Knoten enden
    int32View[baseIndex] = link.from;
    int32View[baseIndex + 1] = link.to;
  });
}
