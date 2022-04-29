const blessed = require('blessed');
const Chip8Display = require('./chip8Display.js');
const Chip8Disassembler = require('./chip8Disassembler.js');
const Chip8Keypad = require('./chip8Keypad.js');

const NUM_CODE_LINES = 30;
const NUM_MEMORY_LINES = 10;
const NUM_MEMORY_COLS = 8;

let Chip8UI = (function() {
  function createNewPanel(label, xPos = 0, yPos = 0) {
    let box = blessed.box({
      style: {
        focus: {
          border: {
            type: 'line',
            fg: 'green',
          },
        },
      },
      border: {
        type: 'line',
        fg: 'white',
      },
      label,
      shrink: true,
      tags: true,
      draggable: true,
      left: xPos,
      top: yPos,
      hidden: true,
    });
    box.on('click', () => {
      box.focus();
    });
    return box;
  }

  function Chip8UI(keypad) {
    this.keypad = new Chip8Keypad.Chip8Keypad();
    this.screen = initScreen();
    this.debugPanel = createNewPanel('debug');
    this.codePanel = createNewPanel('code');
    this.memoryPanel = createNewPanel('memory');
    this.displayBuffer = initGameDisplay(this.screen);
    setKeyListeners.call(this);
    this.screen.append(this.debugPanel);
    this.screen.append(this.codePanel);
    this.screen.append(this.memoryPanel);
    this.running = true;
    this.codePosition = 0;
    this.memoryPosition = 0;
    this.mostRecentPC = 0;
  }

  Chip8UI.prototype.drawToScreen = function() {
    this.screen.render();
  }

  Chip8UI.prototype.setDebugContent = function(cyclesPerSecond, cpuData) {
    if (this.debugPanel.hidden) return;

    let debugStr = `${cyclesPerSecond.toFixed(2)} cycles per second\n`;
    debugStr += `DT: ${cpuData.dt} ST: ${cpuData.st}\n`;
    debugStr += `I: ${toHexString(cpuData.I)} PC: ${toHexString(cpuData.PC)}\n`;
    debugStr += registerInfoStr(cpuData.registers);
    debugStr += this.keypad.currentKey();
    this.debugPanel.setContent(debugStr);
  }

  function toHexString(val, pad = 0) {
    return val.toString(16).padStart(pad, '0');
  }

  Chip8UI.prototype.setCodeContent = function(cpuData, currInstruction) {
    this.mostRecentPC = cpuData.PC || 0x200;
    if (this.codePanel.hidden) return;
    let currByte = 0x200 + (this.codePosition * 2);
    let codeStr = '';
    for (let i = 0; i < NUM_CODE_LINES; i += 1, currByte += 2) {
      let instruction = (cpuData.memory[currByte] << 8) | cpuData.memory[currByte + 1];
      let disassembled = Chip8Disassembler.disassemble(instruction).instructionStr;
      if (currByte === currInstruction) {
        codeStr += `{bold}${toHexString(currByte)}: ${disassembled}{/bold}\n`;
      } else {
        codeStr += `${toHexString(currByte)}: ${disassembled}\n`;
      }
    }
    this.codePanel.setContent(codeStr);
  }

  Chip8UI.prototype.setMemoryContent = function(cpuData) {
    let currByte = this.memoryPosition;
    let memoryString = '';
    for (let rowNumber = 0; rowNumber < NUM_MEMORY_LINES; rowNumber += 1) {
      memoryString += `{bold}${toHexString(currByte, 4)}{/bold}:`;
      for (let i = 0; i < NUM_MEMORY_COLS; i += 1) {
        memoryString += ` ${toHexString(cpuData.memory[currByte + i], 2)}`;
      }
      memoryString += "\n";
      currByte += NUM_MEMORY_COLS;
    }
    this.memoryPanel.setContent(memoryString);
  };

  function registerInfoStr(registers) {
    let resultStr = '';
    for (let i = 0; i < 16; i += 1) {
      if (i === 8) {
        resultStr += "\n";
      }
      resultStr += `{bold}V${i.toString(16)}{/bold}: ${registers[i].toString(16).padStart(2, '0')} `;
    }
    return resultStr;
  }

  function initScreen() {
    let screen = blessed.screen({
      smartCSR: true,
      title: 'chip8emu',
    });
    return screen;
  }

  function setKeyListeners() {
    let self = this;
    self.screen.key(['escape', 'C-c'], function(ch, key) {
      self.running = false;
    });

    self.screen.key(['f1'], function(ch, key) {
      self.debugPanel.toggle();
      self.debugPanel.focus();
    });

    self.screen.key(['f2'], function(ch, key) {
      self.codePanel.toggle();
      self.codePanel.focus();
    });

    self.screen.key(['m'], function(ch, key) {
      self.memoryPanel.toggle();
      self.memoryPanel.focus();
    });

    self.screen.key(['j'], function(ch, key) {
      self.codePosition = (self.mostRecentPC - 0x200) / 2;
    })

    self.screen.key(['f3'], function(ch, key) {
      if (self.codePanel.hidden && self.memoryPanel.hidden) return;
      if (self.codePanel.focused) {
        self.codePosition = Math.max(0, self.codePosition - 1);
      }
      if (self.memoryPanel.focused) {
        self.memoryPosition = Math.max(0, self.memoryPosition - 10);
      }
    });

    self.screen.key(['f4'], function(ch, key) {
      if (self.codePanel.hidden && self.memoryPanel.hidden) return;
      if (self.codePanel.focused) {
        self.codePosition = Math.min(3584, self.codePosition + 1);
      }
      if (self.memoryPanel.focused) {
        self.memoryPosition = Math.min(4096, self.memoryPosition + 10);
      }
    });

    self.screen.on('keypress', function(key) {
      self.keypad.setKey(key);
    });
  }

  function initGameDisplay(screen) {
    gameDisplay = blessed.box({
      top: 0,
      left: 0,
      width: 64,
      height: 32,
      bg: 'black',
    });

    let displayPixels = [];
    for (let row = 0; row < 32; row += 1) {
      displayPixels.push([]);
      for (let col = 0; col < 64; col += 1) {
        displayPixels[row].push(blessed.box({
          top: row,
          left: col,
          width: 1,
          height: 1,
          bg: 'green',
          hidden: 'true',
        }));
        gameDisplay.append(displayPixels[row][col]);
      }
    }
    screen.append(gameDisplay);
    return new Chip8Display.Chip8Display(displayPixels);
  }

  return Chip8UI;
})();

module.exports = { Chip8UI };