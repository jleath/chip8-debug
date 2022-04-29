const fs = require('fs')
const Chip8UI = require('./chip8UI.js');
const Chip8CPU = require('./chip8CPU.js');

let interface = new Chip8UI.Chip8UI();
let debug = false;

let romPath = process.argv[2];
if (romPath === undefined) {
  console.log('Invalid ROM path');
  process.exit(1);
}

if (process.argv[3] === 'debug') {
  debug = true;
}
let romBuffer = fs.readFileSync(romPath);

let emulator = new Chip8CPU.Chip8CPU(interface);
emulator.loadProgram(romBuffer);

let numCycles = 0;
let startTime = new Date();
let lastScreenRefresh = startTime;
let cpuData;

if (debug) {
  // cycle one time to initialize if debugging is on
  cpuData = emulator.cycle();
}

startEmulation();

function startEmulation() {
  if (interface.running) {
    let currTime = new Date();
    let elapsedTime = currTime - startTime;
    let cyclesPerSecond = numCycles / (elapsedTime / 1000);
    if (debug) {
      if (interface.keypad.waitingForKeyPress) {
        cpuData = emulator.cycle();
      } else if (interface.keypad.keyPressed(16)) {
        cpuData = emulator.cycle();
      }
    } else {
      cpuData = emulator.cycle();
    }
    interface.setDebugContent(cyclesPerSecond, cpuData);
    interface.setCodeContent(cpuData, cpuData.PC);
    interface.setMemoryContent(cpuData);
    numCycles += 1;
    if (currTime - lastScreenRefresh > 16) {
      interface.drawToScreen();
      lastScreenRefresh = new Date();
    }
    setTimeout(startEmulation, 5);
  } else {
    function end() {
      process.exit(0);
    }
    setTimeout(end, 50)
  }
}