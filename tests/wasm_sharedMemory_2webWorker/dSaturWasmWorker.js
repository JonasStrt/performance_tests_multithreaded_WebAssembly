self.importScripts("DSaturWasmModuleWrapper.js");
function changeNodeColor(nodeKey, newColorCode, thread) {
  const changeColorMessage = {
    code: "changeColor",
    nodeKey,
    newColorCode,
    thread,
  };
  postMessage(changeColorMessage);
}

function threadsFinished() {
  postMessage({ code: "end" });
}
self.addEventListener("message", async function (e) {
  nodes = e.data["nodes"];
  links = e.data["links"];
  terms = e.data["terms"];
  workerId = e.data["id"];
  sharedMemory = e.data["sharedMemory"];
  sharedMemoryGraphData = e.data["sharedMemoryGraphData"];
  var dSaturWasmModule = new DSaturWasmModuleWrapper(
    "Module",
    sharedMemory,
    workerId + 1
  );
  await dSaturWasmModule.init();
  DSaturWasmModuleWrapper.WasmModule.changeNodeColor = changeNodeColor;
  DSaturWasmModuleWrapper.WasmModule.threadsFinished = threadsFinished;
  nodeBufferSize = nodes.length * 16; // 16 Bytes pro Knoten
  linkBufferSize = links.length * 8; // 8 Bytes pro Verbindung

  termsBufferSize = 4;
  nodeCountBufferSize = 4;
  linksCountBufferSize = 4;
  wokerBufferSize = 4;

  totalBufferSize = nodeBufferSize + linkBufferSize;
  if (e.data["code"] == "init") {
    const nodesPtr =
      DSaturWasmModuleWrapper.WasmModule._malloc(totalBufferSize); // Speicher im WebAssembly-Modul reservieren
    const linksPtr = nodesPtr + nodeBufferSize; // Verbindungsdaten kommen nach den Knotendaten

    var int32View = new Int32Array(sharedMemoryGraphData);
    DSaturWasmModuleWrapper.WasmModule.HEAP32.set(int32View, nodesPtr / 4);
    postMessage({
      code: "pointer",
      nodesPtr,
      linksPtr,
    });
  } else {
    DSaturWasmModuleWrapper.WasmModule._processGraph(
      workerId,
      nodes.length,
      links.length,
      terms,
      e.data["nodesPointer"],
      e.data["linksPointer"]
    );
  }
});
