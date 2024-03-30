class DSaturWasmModuleWrapper {
  static WasmModule = null;
  static loaded = null;
  name;
  sharedMemory;
  workerFlag;

  constructor(name, sharedMemory, workerFlag = true) {
    this.name = name;
    this.sharedMemory = sharedMemory;
    this.workerFlag = workerFlag;
    if (!DSaturWasmModuleWrapper.loaded) {
      DSaturWasmModuleWrapper.loaded = this.initModule();
    }
  }

  async initModule() {
    if (DSaturWasmModuleWrapper.WasmModule) {
      return DSaturWasmModuleWrapper.WasmModule;
    }

    return new Promise((resolve, reject) => {
      const Module = {
        wasmMemory: this.sharedMemory,
        onRuntimeInitialized: () => {
          DSaturWasmModuleWrapper.WasmModule = Module;
          resolve(Module);
        },
      };
      if (this.workerFlag) {
        setTimeout(() => {
          self.importScripts("dSaturSharedMemory.js");
        }, 0);
      }
      self.Module = Module;
    });
  }

  async init() {
    await DSaturWasmModuleWrapper.loaded;
  }
}
// export { DSaturWasmModuleWrapper };
