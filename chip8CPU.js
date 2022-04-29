const Chip8Disassembler = require('./chip8Disassembler.js');
const MEMORY_SIZE = 4096;
const FONT_START_ADDRESS = 0x50;
const PROGRAM_START_ADDRESS = 0x200;
const NUM_REGISTERS = 16;

let Chip8CPU = (function() {
  const FONT_DATA = [
    0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
    0x90, 0x90, 0xF0, 0x10, 0x10, // 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
    0xF0, 0x10, 0x20, 0x40, 0x40, // 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
    0xF0, 0x90, 0xF0, 0x90, 0x90, // A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
    0xF0, 0x80, 0x80, 0x80, 0xF0, // C
    0xE0, 0x90, 0x90, 0x90, 0xE0, // D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
    0xF0, 0x80, 0xF0, 0x80, 0x80  // F
  ];

  function Chip8CPU(interface) {
    this.display = interface.displayBuffer;
    this.keypad = interface.keypad;
    this.memory = new Uint8Array(MEMORY_SIZE);
    this.memory.set(FONT_DATA, FONT_START_ADDRESS);
    this.stack = [];
    this.registers = new Uint8Array(NUM_REGISTERS);
    this.I = 0;
    this.PC = PROGRAM_START_ADDRESS;

    this.delayTimer = 0;
    this.soundTimer = 0;
    this.cyclesSinceLastTick = 0;
  }

  Chip8CPU.prototype.tick = function() {
    this.cyclesSinceLastTick += 1;
    if (this.cyclesSinceLastTick === 3) {
      this.delayTimer = Math.max(0, this.delayTimer - 1);
      this.soundTimer = Math.max(0, this.soundTimer - 1);
      this.cyclesSinceLastTick = 0;
    }
  }

  Chip8CPU.prototype.cycle = function() {
    this.tick();
    let instruction = this.fetch();
    Chip8Disassembler.disassemble(instruction).execute(this);
    return {
      dt: this.delayTimer,
      st: this.soundTimer,
      registers: this.registers,
      I: this.I,
      PC: this.PC,
      memory: this.memory,
    };
  };

  Chip8CPU.prototype.fetch = function() {
    let instruction = (this.memory[this.PC] << 8) | this.memory[this.PC + 1];
    this.PC += 2;
    return instruction;
  }

  Chip8CPU.prototype.loadProgram = function(programData) {
    this.memory.set(programData, PROGRAM_START_ADDRESS);
  }

  return Chip8CPU;
})();

module.exports = { Chip8CPU };