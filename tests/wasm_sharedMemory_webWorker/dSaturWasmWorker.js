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
  var dSaturWasmModule = new DSaturWasmModuleWrapper(
    "Module",
    sharedMemory
  );
  await dSaturWasmModule.init();
  console.log("Module");
  console.log(DSaturWasmModuleWrapper.WasmModule);
  DSaturWasmModuleWrapper.WasmModule.changeNodeColor = changeNodeColor;
  DSaturWasmModuleWrapper.WasmModule.threadsFinished = threadsFinished;
  const nodeCount = nodes.length;
  const linkCount = links.length;
  if(e.data["code"] == "init") {
    console.log("in init");
    DSaturWasmModuleWrapper.WasmModule._initializeData(
      0,
      nodeCount,
      400,
      linkCount,
      terms,
      workerId
    );
    let nodesPointers = DSaturWasmModuleWrapper.WasmModule._getNodesDataPtr();
    console.log(nodesPointers);
    let linksPointers = DSaturWasmModuleWrapper.WasmModule._getLinksDataPtr();
    console.log(linksPointers);
    let dataPointers = DSaturWasmModuleWrapper.WasmModule._getDataPtr();
    console.log(dataPointers);
  }
  else {
    DSaturWasmModuleWrapper.WasmModule._processGraph(
      0,
      nodeCount,
      400,
      linkCount,
      terms,
      workerId
    );
  }
  //Module._free(nodesPtr);
});
