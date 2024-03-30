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
    let pointers = DSaturWasmModuleWrapper.WasmModule._initializeData(
      100,
      nodeCount,
      500,
      linkCount,
      terms,
      workerId
    );
    console.log(pointers);
  }
  else {
    DSaturWasmModuleWrapper.WasmModule._processGraph(
      100,
      nodeCount,
      500,
      linkCount,
      terms,
      workerId
    );
  }
  //Module._free(nodesPtr);
});
