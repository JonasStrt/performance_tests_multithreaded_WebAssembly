// Verschiebe den Import des Scripts in die initModule Methode,
// um sicherzustellen, dass Module korrekt konfiguriert ist, bevor das WASM-Modul geladen wird.
class DSaturWasmModule {
  static WasmModule = null;
  static loaded = null;
  name;
  int32View;
  totalBufferSize;

  constructor(name, int32View, totalBufferSize) {
    this.name = name;
    this.int32View = int32View;
    this.totalBufferSize = totalBufferSize;
    if (!DSaturWasmModule.loaded) {
      DSaturWasmModule.loaded = this.initModule();
    }
  }

  async initModule() {
    if (DSaturWasmModule.WasmModule) {
      return DSaturWasmModule.WasmModule;
    }

    return new Promise((resolve, reject) => {
      const pageSize = 64 * 1024; // 64KiB pro Seite
      const initialPages = Math.ceil(this.totalBufferSize / pageSize);
      const maximumPages = Math.max(
        initialPages,
        Math.floor((this.totalBufferSize / pageSize) * 1.5)
      ); // 50% mehr als initial, anpassen nach Bedarf

      // Erstellt das WebAssembly.Memory Objekt basierend auf dem SharedArrayBuffer.
      const sharedMemory = new WebAssembly.Memory({
        initial: 256,//initialPages,
        maximum: 256,
        shared: true,
        buffer: this.int32View.buffer,
      });

      // Konfiguriere das Module Objekt vor dem Laden des WASM-Moduls.
      const Module = {
        wasmMemory: sharedMemory,
        onRuntimeInitialized: () => {
          DSaturWasmModule.WasmModule = Module;
          resolve(Module);
        }
      };

      // Da der Import jetzt dynamisch innerhalb dieser Methode stattfindet, stelle sicher, dass importScripts synchron aufgerufen wird.
      // Dies initiiert das Laden und die Initialisierung des WebAssembly-Moduls mit der konfigurierten wasmMemory.
      //self.importScripts("dSaturSharedMemory.js");
      setTimeout(() => {
        self.importScripts("dSaturSharedMemory.js");
      }, 0); 

      // Setze das konfigurierte Module-Objekt für die Verwendung nach der Initialisierung
      self.Module = Module;
    });
  }

  async init() {
    await DSaturWasmModule.loaded;
  }
}


function changeNodeColor(nodeKey, newColorCode, thread) {
  const changeColorMessage = { code: "changeColor", nodeKey, newColorCode, thread };
  postMessage(changeColorMessage);
}

function threadsFinished() {
  postMessage({ code: "end" });
}
self.addEventListener("message", async function (e) {
  int32View = e.data["int32View"];
  nodes = e.data["nodes"];
  links = e.data["links"];
  terms = e.data["terms"];
  workerId = e.data["id"];
  totalBufferSize = e.data["totalBufferSize"];
  nodeBufferSize = e.data["nodeBufferSize"];
  var dSaturWasmModule = new DSaturWasmModule(
    "Module",
    int32View,
    totalBufferSize
  );
  await dSaturWasmModule.init();
  console.log(DSaturWasmModule.WasmModule);
  DSaturWasmModule.WasmModule.changeNodeColor = changeNodeColor;
  DSaturWasmModule.WasmModule.threadsFinished = threadsFinished;
  // const nodesPtr = DSaturWasmModule.WasmModule._malloc(totalBufferSize);
  // DSaturWasmModule.WasmModule.HEAP32.set(int32View, nodesPtr / 4);
  const nodeCount = nodes.length;
  const linkCount = links.length;
  DSaturWasmModule.WasmModule._processGraph(
    0,
    nodeCount,
    3,
    //nodeBufferSize / Int32Array.BYTES_PER_ELEMENT,
    linkCount,
    terms,
    workerId
  );
  //Module._free(nodesPtr);
});
