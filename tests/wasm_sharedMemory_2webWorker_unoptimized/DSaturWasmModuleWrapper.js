class DSaturWasmModuleWrapper {
  static WasmModule = null;
  static loaded = null;
  name;
  sharedMemory;
  version;
  memoryBase;
  stackPointer;

  constructor(name, sharedMemory, version = 1, memoryBase = 0, stackPointer = 0) {
    this.name = name;
    this.sharedMemory = sharedMemory;
    this.memoryBase = memoryBase;
    this.stackPointer = stackPointer;
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
        },
        imports: {
          env: {
            // Hier deine custom Importe, inklusive memoryBase und stackPointer
            __memory_base: this.memoryBase,
            __stack_pointer: this.stackPointer,
            // Füge hier weitere benötigte Umgebungsvariablen hinzu
          }
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
// export { DSaturWasmModuleWrapper };




// class DSaturWasmModuleWrapper {
//   static WasmModule = null;
//   static loaded = null;
//   name;
//   sharedMemory;
//   workerFlag;

//   constructor(name, sharedMemory, workerFlag = true) {
//     this.name = name;
//     this.sharedMemory = sharedMemory;
//     this.workerFlag = workerFlag;
//     if (!DSaturWasmModuleWrapper.loaded) {
//       DSaturWasmModuleWrapper.loaded = this.initModule();
//     }
//   }

//   async initModule() {
//     if (DSaturWasmModuleWrapper.WasmModule) {
//       return DSaturWasmModuleWrapper.WasmModule;
//     }

//     return new Promise(async (resolve, reject) => {
//       // Verwende fetch, um das Wasm-Modul zu laden
//       try {
//         const response = await fetch('/webassambly/dSaturSharedMemory');
//         if (!response.ok) {
//           throw new Error(`Failed to fetch wasm module: ${response.statusText}`);
//         }
//         const wasmModule = await WebAssembly.instantiateStreaming(response, {
//           // Übergib Importobjekte oder Konfigurationen hier
//           env: {
//             // Beispiel für die Übergabe des shared memory, falls notwendig
//             memory: this.sharedMemory,
//             emscripten_date_now: () => Date.now(),
//             _emscripten_get_now_is_monotonic: () => 1,
//             emscripten_get_now: () => performance.now(),
//             __assert_fail: (condition, filename, line, func) => {
//               console.error(`Assertion fehlgeschlagen: ${conditionStr}, Datei: ${filenameStr}, Zeile: ${line}, Funktion: ${funcStr}`);
//               throw new Error(`Assertion fehlgeschlagen: ${conditionStr}, in Funktion ${funcStr}`);
//             },
//             _emscripten_notify_mailbox_postmessage: () => {
//               // Leere Funktion (No-Op), falls diese Funktionalität in deiner Anwendung nicht benötigt wird
//             },
//             emscripten_check_blocking_allowed: () => {
//               // Leere Funktion (No-Op), falls diese Funktionalität in deiner Anwendung nicht benötigt wird
//             },
//             _emscripten_receive_on_main_thread_js: () => {
//               // Leere Funktion (No-Op), falls diese Funktionalität in deiner Anwendung nicht benötigt wird
//             },
//             __emscripten_init_main_thread_js: () => {
//               // Leere Funktion (No-Op), falls diese Funktionalität in deiner Anwendung nicht benötigt wird
//             }
//           },
//           wasi_snapshot_preview1: {
//             // Beispiel für WASI-Funktionen als No-Op-Implementierung
//             fd_write: () => {},
//             proc_exit: () => {},
//             // Füge hier weitere benötigte WASI-Funktionen hinzu
//           },
          
//           // changeNodeColorJS: (nodeId, color) => {
//           //   console.log(`Ändere die Farbe des Knotens ${nodeId} zu ${color}.`);
//           //   // Hier könntest du Logik hinzufügen, um die Farbe eines Knotens im DOM zu ändern.
//           // },
//           // threadsFinishedJS:(nodeId, color) => {
//           //   console.log(`Ändere die Farbe des Knotens ${nodeId} zu ${color}.`);
//           //   // Hier könntest du Logik hinzufügen, um die Farbe eines Knotens im DOM zu ändern.
//           // }
//         });
//         DSaturWasmModuleWrapper.WasmModule = wasmModule.instance;
//         resolve(wasmModule.instance);
//       } catch (error) {
//         reject(error);
//       }
//     });
//   }

//   async init() {
//     await DSaturWasmModuleWrapper.loaded;
//   }
// }