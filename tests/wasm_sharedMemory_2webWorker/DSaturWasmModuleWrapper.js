class DSaturWasmModuleWrapper {
  static WasmModule = null;
  static loaded = null;
  name;
  sharedMemory;
  version;

  constructor(name, sharedMemory, version = 1) {
    this.name = name;
    this.sharedMemory = sharedMemory;
    this.version = version;
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
        }
      };
      if (this.version == 1) {
        setTimeout(() => {
          self.importScripts("dSaturSharedMemory1MB.js");
        }, 0);
      }
      else {
        setTimeout(() => {
          self.importScripts("dSaturSharedMemory2MB.js");
        }, 0);
      }
      self.Module = Module;
    });
  }

  async init() {
    await DSaturWasmModuleWrapper.loaded;
  }
}
