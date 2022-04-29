let Chip8Keypad = (function() {
  let keyCodes = ['1', '2', '3', '4', 'q', 'w', 'e', 'r',
                  'a', 's', 'd', 'f', 'z', 'x', 'c', 'v',
                  'n', 'm'];

  function Chip8Keypad() {
    this.buffer = -1;
    this.waitingForKeyPress = false;

    setInterval(() => {
      this.reset();
    }, 500);
  }

  Chip8Keypad.prototype.setKey = function(key) {
    this.buffer = keyCodes.indexOf(key);
  }

  Chip8Keypad.prototype.keyPressed = function(key) {
    if (this.waitingForKeyPress) return false;
    let pressedKey = this.buffer;
    this.reset();
    return pressedKey === key;
  };

  Chip8Keypad.prototype.currentKey = function() {
    return this.buffer;
  }

  Chip8Keypad.prototype.waitForKeyPress = function() {
    let key = this.buffer;
    this.reset();
    if (key < 0 || key > 15) {
      this.waitingForKeyPress = true;
      key = undefined;
    } else {
      this.waitingForKeyPress = false;
    }
    return key;
  };

  Chip8Keypad.prototype.reset = function() {
    this.buffer = -1;
  };

  return Chip8Keypad;
})();

module.exports = { Chip8Keypad };