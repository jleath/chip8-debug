const WIDTH = 64;
const HEIGHT = 32;

let Chip8Display = (function() {
  function Chip8Display(pixels) {
    this.pixels = pixels;
  }

  function turnOffPixel(pixels, x, y) {
    pixels[y][x].hidden = true;
  }

  Chip8Display.prototype.clear = function() {
    this.pixels.forEach((pixelRow) => {
      pixelRow.forEach((pixel) => {
        pixel.hidden = true;
      });
    });
  }

  // Chip8Display.prototype.clear = function() {
  //   this.pixels.forEach((pixelRow) => {
  //     pixelRow.forEach((pixel) => {
  //       pixel.hidden = true;
  //     });
  //   });
  // };

  Chip8Display.prototype.pixelActive = function(x, y) {
    return !(this.pixels[y][x].hidden);
  };

  Chip8Display.prototype.togglePixel = function(x, y) {
    let currentState = this.pixels[y][x].hidden;
    this.pixels[y][x].hidden = !currentState
  };

  return Chip8Display;
})();

module.exports = { Chip8Display, WIDTH, HEIGHT };