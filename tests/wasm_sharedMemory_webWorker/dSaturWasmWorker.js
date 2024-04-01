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
    sharedMemory
  );
  await dSaturWasmModule.init();
  DSaturWasmModuleWrapper.WasmModule.changeNodeColor = changeNodeColor;
  DSaturWasmModuleWrapper.WasmModule.threadsFinished = threadsFinished;
  const nodeCount = nodes.length;
  const linkCount = links.length;
  nodeBufferSize = nodes.length * 16; // 16 Bytes pro Knoten
  linkBufferSize = links.length * 8; // 8 Bytes pro Verbindung
  totalBufferSize = nodeBufferSize + linkBufferSize;
  if(e.data["code"] == "init") {
    console.log("in init");
    const nodesPtr =  DSaturWasmModuleWrapper.WasmModule._malloc(totalBufferSize); // Speicher im WebAssembly-Modul reservieren
    const linksPtr = nodesPtr + nodeBufferSize; // Verbindungsdaten kommen nach den Knotendaten
    var int32View = new Int32Array(sharedMemoryGraphData);
    DSaturWasmModuleWrapper.WasmModule.HEAP32.set(int32View, nodesPtr / 4);
    postMessage({ code: "pointer", nodesPtr, linksPtr });
    // console.log(int32View);
    // console.log("Module");
    // console.log(nodesPtr /4);
    // console.log(DSaturWasmModuleWrapper.WasmModule);
    // DSaturWasmModuleWrapper.WasmModule._initializeData(
    //   0,
    //   nodeCount,
    //   400,
    //   linkCount,
    //   terms,
    //   workerId
    // );
    // let nodesPointers = DSaturWasmModuleWrapper.WasmModule._getNodesDataPtr();
    // console.log(nodesPointers);
    // let linksPointers = DSaturWasmModuleWrapper.WasmModule._getLinksDataPtr();
    // console.log(linksPointers);
    // let dataPointers = DSaturWasmModuleWrapper.WasmModule._getDataPtr();
    // console.log(dataPointers);
  }
  else {
    console.log(DSaturWasmModuleWrapper.WasmModule);
    console.log(e.data["nodesPointer"]);
    console.log(e.data["linksPointer"]);
    DSaturWasmModuleWrapper.WasmModule._processGraph(
      0,
      nodeCount,
      400,
      linkCount,
      terms,
      workerId,
      (e.data["nodesPointer"]),
      (e.data["linksPointer"])
    );
  }
  //Module._free(nodesPtr);
});
