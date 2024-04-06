class DSaturWasmModuleWrapper {
  static WasmModule = null;
  static loaded = null;
  constructor() {
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
        onRuntimeInitialized: () => {
          DSaturWasmModuleWrapper.WasmModule = Module;
          resolve(Module);
        },
      };
      setTimeout(() => {
        self.importScripts("dSaturSingleNode.js");
      }, 0);
      self.Module = Module;
    });
  }

  async init() {
    await DSaturWasmModuleWrapper.loaded;
  }
}
