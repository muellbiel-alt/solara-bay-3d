// Keyboard + mouse + wheel input. No external library, no network.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouseX = 0; this.mouseY = 0;
    this.mouseDown = false;
    this.wheelDelta = 0;
    this.canvas = canvas;
    this.onKey = null;
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      this.pressed.add(e.code);
      if (this.onKey) this.onKey(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - r.left) / r.width;
      this.mouseY = (e.clientY - r.top) / r.height;
    });
    canvas.addEventListener('mousedown', (e) => { if (e.button === 0) this.mouseDown = true; });
    window.addEventListener('mouseup', () => { this.mouseDown = false; });
    canvas.addEventListener('wheel', (e) => { this.wheelDelta += e.deltaY; e.preventDefault(); }, { passive: false });
    window.addEventListener('blur', () => { this.keys.clear(); this.mouseDown = false; });
  }
  down(code) { return this.keys.has(code); }
  wasPressed(code) { return this.pressed.has(code); }
  axis(neg, pos) { return (this.down(pos) ? 1 : 0) - (this.down(neg) ? 1 : 0); }
  endFrame() { this.pressed.clear(); this.wheelDelta = 0; }
}
