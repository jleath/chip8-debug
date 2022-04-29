function create(instructionStr, op, args) {
  return {
    instructionStr,
    execute(cpu) {
      if (op !== undefined) op(cpu, args);
    },
  };
}

function disassemble(instruction) {
  if (instruction === 0x00E0) {
    return create('clear screen', CLS, {});
  }
  if (instruction === 0x00EE) {
    return create('subroutine return', RET, {});
  }

  let address = instruction & 0xFFF;
  let nibbleCode = instruction & 0xF;
  let byteCode = instruction & 0xFF;
  let y = (instruction >> 4) & 0xF;
  let x = (instruction >> 8) & 0xF;
  let opcode = (instruction >> 12) & 0xF;

  let args = { address, nibble: nibbleCode, byte: byteCode, x, y };

  address = address.toString(16).padStart(3, '0');
  nibble = nibbleCode.toString(16).padStart(1, '0');
  byte = byteCode.toString(16).padStart(1, '0');
  y = y.toString(16);
  x = x.toString(16);

  switch(opcode) {
    case 0x8:
      switch(nibbleCode) {
        case 0x0:
          // handle set
          return create(`V${x} = V${y}`, LD_VX_VY, args);
        case 0x1:
          // handle or
          return create(`V${x} |= V${y}`, OR_VX_VY, args);
        case 0x2:
          // handle and
          return create(`V${x} &= V${y}`, AND_VX_VY, args);
        case 0x3:
          // handle xor
          return create(`V${x} ^= V${y}`, XOR_VX_VY, args);
        case 0x4:
          // handle add
          return create(`V${x} += V${y}`, ADD_VX_VY, args);
        case 0x5:
          // handle subLR
          return create(`V${x} -= V${y}`, SUB_VX_VY, args);
        case 0x6:
          // handle shiftR
          return create(`V${x} >>> 1`, SHR_VX, args);
        case 0x7:
          // handle subRL
          return create(`V${x} = V${y} - V${x}`, SUBN_VX_VY, args);
        case 0xE:
          // handle shiftL
          return create(`V${x} << 1`, SHL_VX, args);
        default:
          return create('<unknown>', undefined, undefined);
      }
      break;

    case 0xE:
      switch(byteCode) {
        case 0x9E:
          // handle skipIfKeyPressed
          return create(`skip if key at V${x} is pressed`, SKP_VX, args);
        case 0xA1:
          // handle skipIfKeyNotPressed
          return create(`skip if key at V${x} is not pressed`, SKNP_VX, args);
        default:
          return create('<unknown>', undefined, undefined);
      }
      break;

    case 0xF:
      switch(byteCode) {
        case 0x07:
          // handle saveDelayTimer
          return create(`save delay timer to V${x}`, LD_VX_DT, args);
        case 0x15:
          // handle setDelayTimer
          return create(`set delay timer to the value at V${x}`, LD_DT_VX, args);
        case 0x18:
          // handle setSoundTimer
          return create(`set sound timer to the value at V${x}`, LD_ST_VX, args);
        case 0x1E:
          // handle addToIndex
          return create(`add value at V${x} to I`, ADD_I_VX, args);
        case 0x0A:
          // handle getKey
          return create(`wait for key press and store in V${x}`, LD_VX_K, args);
        case 0x29:
          // handle fontCharacter
          return create(`set I to point to font indicated by V${x}`, LD_F_VX, args);
        case 0x33:
          // handle binaryCodedDecimal
          return create(`binary coded decimal of V${x}`, LD_B_VX, args);
        case 0x55:
          // handle storeRegisters
          return create(`store registers V0 through V${x} at I`, LD_I_VX, args);
        case 0x65:
          // handle loadRegisters
          return create(`load bytes from memory[I] into V0 through V${x}`, LD_VX_I, args);
        default:
          return create('<unknown>', undefined, undefined);
      }
      break;
    case 0x1:
      // handle jump
      return create(`jump to ${address}`, JP_ADDR, args);
    case 0x2:
      // handle call
      return create(`call subroutine at ${address}`, CALL_ADDR, args);
    case 0x3:
      // handle skipIfEqual
      return create(`skip next instruction if V${x} equal to ${byte}`, SE_VX_BYTE, args);
    case 0x4:
      // handle skipIfNotEqual
      return create(`skip next instruction if V${x} not equal to ${byte}`, SNE_VX_BYTE, args);
    case 0x5:
      // handle skipIfEqualRegisters
      return create(`skip next instruction if V${x} equal to V${y}`, SE_VX_VY, args);
    case 0x6:
      // handle registerSet
      return create(`set V${x} to ${byte}`, LD_VX_BYTE, args);
    case 0x7:
      // handle registerAdd
      return create(`add ${byte} to V${x}`, ADD_VX_BYTE, args);
    case 0x9:
      // handle skipIfNotEqualRegisters
      return create(`skip next instruction if V${x} not equal to V${y}`, SNE_VX_VY, args);
    case 0xA:
      // handle indexSet
      return create(`set I to ${address}`, LD_I_ADDR, args);
    case 0xB:
      // handle offsetJump
      return create(`jump to ${address} + V0`, JP_V0_ADDR, args);
    case 0xC:
      // handle random
      return create(`store random number & ${byte} in V${x}`, RND_VX_BYTE, args);
    case 0xD:
      // handle draw
      return create(`draw(${x}, ${y}, ${nibble})`, DRW_VX_VY_NIBBLE, args);
    default:
      return create('<unknown>', undefined, undefined);
  }
}

function CLS(cpu) {
  cpu.display.clear();
}
function RET(cpu) {
  cpu.PC = cpu.stack.pop();
}
function RND_VX_BYTE(cpu, args) {
  cpu.registers[args.x] = Math.floor(Math.random() * 255) & args.byte;
}
function DRW_VX_VY_NIBBLE(cpu, args) {
  let yPos = cpu.registers[args.y] & 31;
  cpu.registers[0xF] = 0;
  for (let row = 0; row < args.nibble && yPos < 32; row += 1, yPos += 1) {
    let mask = 0x80;
    let xPos = cpu.registers[args.x] & 63;
    while (mask > 0) {
      let masked = cpu.memory[cpu.I + row] & mask;
      if (masked !== 0) {
        if (cpu.display.pixelActive(xPos, yPos)) {
          cpu.registers[0xF] = 1;
        }
        cpu.display.togglePixel(xPos, yPos);
      }
      mask = mask >>> 1;
      if (xPos === 63) break;
      xPos += 1;
    }
  }
}
function SKP_VX(cpu, args) {
  if (!cpu.keypad.keyPressed(cpu.registers[args.x])) {
    cpu.PC += 2;
  }
}
function SKNP_VX(cpu, args) {
  if (!cpu.keypad.keyPressed(cpu.registers[args.x])) {
    cpu.PC += 2;
  }
}
function JP_ADDR(cpu, args) {
  cpu.PC = args.address;
}
function JP_V0_ADDR(cpu, args) {
  cpu.PC = args.address + cpu.registers[0x0];
}
function CALL_ADDR(cpu, args) {
  cpu.stack.push(cpu.PC);
  cpu.PC = args.address;
}
function SE_VX_BYTE(cpu, args) {
  if (cpu.registers[args.x] === args.byte) cpu.PC += 2;
}
function SE_VX_VY(cpu, args) {
  if (cpu.registers[args.x] === cpu.registers[args.y]) cpu.PC += 2;
}
function SNE_VX_BYTE(cpu, args) {
  if (cpu.registers[args.x] !== args.byte) cpu.PC += 2;
}
function SNE_VX_VY(cpu, args) {
  if (cpu.registers[args.x] !== cpu.registers[args.y]) cpu.PC += 2;
}
function LD_I_ADDR(cpu, args) {
  cpu.I = args.address;
}
function LD_I_VX(cpu, args) {
  for (let num = 0; num <= args.x; num += 1) {
    cpu.memory[cpu.I + num] = cpu.registers[num];
  }
}
function LD_VX_I(cpu, args) {
  for (let num = 0; num <= args.x; num += 1) {
    cpu.registers[num] = cpu.memory[cpu.I + num];
  }
}
function LD_VX_BYTE(cpu, args) {
  cpu.registers[args.x] = args.byte;
}
function LD_VX_VY(cpu, args) {
  cpu.registers[args.x] = cpu.registers[args.y];
}
function LD_VX_DT(cpu, args) {
  cpu.registers[args.x] = cpu.delayTimer;
}
function LD_VX_K(cpu, args) {
  let key = cpu.keypad.waitForKeyPress();
  if (key !== undefined) {
    cpu.registers[args.x] = key;
  } else {
    cpu.PC -= 2;
  }
}
function LD_DT_VX(cpu, args) {
  cpu.delayTimer = cpu.registers[args.x];
}
function LD_ST_VX(cpu, args) {
  cpu.soundTimer = cpu.registers[args.x];
}
function LD_F_VX(cpu, args) {
  cpu.I = 0x50 + (cpu.registers[args.x] * 5);
}
function LD_B_VX(cpu, args) {
  let value = cpu.registers[args.x];
  cpu.memory[cpu.I] = Math.floor(value / 100);
  cpu.memory[cpu.I + 1] = Math.floor(value / 10) % 10;
  cpu.memory[cpu.I + 2] = value % 10;
}
function OR_VX_VY(cpu, args) {
  cpu.registers[args.x] |= cpu.registers[args.y];
}
function AND_VX_VY(cpu, args) {
  cpu.registers[args.x] &= cpu.registers[args.y];
}
function XOR_VX_VY(cpu, args) {
  cpu.registers[args.x] ^= cpu.registers[args.y];
}
function ADD_VX_VY(cpu, args) {
  let result = cpu.registers[args.x] + cpu.registers[args.y];
  if (result > 255) cpu.registers[0xF] = 1;
  cpu.registers[args.x] = result & 0xFF;
}
function ADD_I_VX(cpu, args) {
  cpu.I += cpu.registers[args.x];
  if (cpu.I > 0x1000) cpu.registers[0xF] = 1;
}
function ADD_VX_BYTE(cpu, args) {
  cpu.registers[args.x] = (cpu.registers[args.x] + args.byte) & 0xFF;
}
function SUB_VX_VY(cpu, args) {
  if (cpu.registers[args.x] > cpu.registers[args.y]) {
    cpu.registers[0xF] = 1;
  } else {
    cpu.registers[0xF] = 0;
  }
  cpu.registers[args.x] = (cpu.registers[args.x] - cpu.registers[args.y]) & 0xFF;
}
function SUBN_VX_VY(cpu, args) {
  if (cpu.registers[args.y] > cpu.registers[args.x]) {
    cpu.registers[0xF] = 1;
  } else {
    cpu.registers[0xF] = 0;
  }
  cpu.registers[args.x] = (cpu.registers[args.y] - cpu.registers[args.x]) & 0xFF;
}
function SHR_VX(cpu, args) {
  if ((0x1 & cpu.registers[args.x]) !== 0) {
    cpu.registers[0xF] = 1;
  } else {
    cpu.registers[0xF] = 0;
  }
  cpu.registers[args.x] = (cpu.registers[args.x] >>> 1) & 0xFF;
}
function SHL_VX(cpu, args) {
  if ((0x80 & cpu.registers[args.x]) !== 0) {
    cpu.registers[0xF] = 1;
  } else {
    cpu.registers[0xF] = 0;
  }
  cpu.registers[args.x] = (cpu.registers[args.x] << 1) & 0xFF;
}

module.exports = { disassemble };