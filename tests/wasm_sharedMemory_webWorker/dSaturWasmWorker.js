self.importScripts("dSaturSharedMemory.js");

class DSaturWasmModule {
  static WasmModule;
  static loaded = new Promise((resolve, reject) => {
    Module.onRuntimeInitialized = () => {
      DSaturWasmModule.WasmModule = Module;
      resolve();
    };
  });
  name;
  constructor(name) {
    this.name = name;
  }

  async init() {
    await DSaturWasmModule.loaded;
  }
}
function changeNodeColor(nodeKey, newColorCode, thread) {
  console.log("lets change some color");
}

function threadsFinished() {
  console.log("lets end this thread");
}


self.addEventListener("message", async function (e) {
  int32View = e.data["int32View"];
  nodes = e.data["nodes"];
  links = e.data["links"];
  terms = e.data["terms"];
  workerId = e.data["id"];
  var dSaturWasmModule = new DSaturWasmModule("Module");
  await dSaturWasmModule.init();
  totalBufferSize = e.data["totalBufferSize"];
  nodeBufferSize = e.data["nodeBufferSize"];
  DSaturWasmModule.WasmModule.changeNodeColor = changeNodeColor;
  DSaturWasmModule.WasmModule.threadsFinished = threadsFinished;
  const nodesPtr = DSaturWasmModule.WasmModule._malloc(totalBufferSize);
  DSaturWasmModule.WasmModule.HEAP32.set(int32View, nodesPtr / 4);
  const nodeCount = nodes.length;
  const linkCount = links.length;
  const linksPtr = nodesPtr + nodeBufferSize;
  DSaturWasmModule.WasmModule._processGraph(
    nodesPtr,
    nodeCount,
    linksPtr,
    linkCount,
    terms,
    workerId
  );
  //Module._free(nodesPtr);
});
