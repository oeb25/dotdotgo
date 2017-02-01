import { Vec, Rect, TextElement, Circle } from './graphics';
import { curves, colors } from './helpers';
import tegn, { TegnElement, TegnGenericElement } from './tegn';

export class State {
  model: Model;

  update() {
  }

  transitionTo(state: State) {
    this.model.transitionTo(state);
  }

  transitionToIn(
    ms: number,
    state: State,
    children: TegnGenericElement[] = []
  ) {
    this.transitionTo(new Wait(ms, state, children));
  }

  render(): TegnGenericElement | null {
    return null;
  }
}

export class Wait extends State {
  time: number;
  start: number;
  next: State;
  children: TegnGenericElement[];

  constructor(time: number, next: State, children: TegnGenericElement[] = []) {
    super();

    this.start = Date.now();
    this.time = time;
    this.next = next;
    this.children = children;
  }

  update() {
    if (Date.now() - this.start > this.time) {
      this.model.transitionTo(this.next);
    }
  }

  render(): TegnGenericElement {
    return { x: 0, y: 0, children: this.children };
  }
}

export class Mouse extends Vec {
  constructor() {
    super(0, 0);

    this.down = false;
    this.click = false;
  }

  click: boolean;
  down: boolean;
}

export class Viewport extends Rect {
  scale: number;
  canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    super(new Vec(0, 0), canvas.width, canvas.height);
    this.scale = 1;
    this.canvas = canvas;
  }

  posToWorldSpace(a: Vec): Vec {
    return a
      .add(this.pos.mul(this.scale))
      .sub(new Vec(this.canvas.width / 2, this.canvas.height / 2))
      .mul(1 / this.scale)
  }

  getScreenRect(): Rect {
    const sx = this.canvas.width / 2;
    const sy = this.canvas.height / 2;

    const min = this.posToWorldSpace(
      new Vec(this.pos.x - sx, this.pos.y - sy).mul(this.scale)
    );
    const max = this.posToWorldSpace(
      new Vec(this.pos.x + sx, this.pos.y + sy).mul(this.scale)
    );
    return new Rect(min, max.x - min.x, max.y - min.y);
  }
}

export class Model {
  state: State;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  mouse: Mouse;
  offset: Vec;
  t: number;
  viewport: Viewport;
  targetCameraPosition: Vec;

  constructor(state: State) {
    this.transitionTo(state);
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight - 50;

    this.viewport = new Viewport(this.canvas);
    this.targetCameraPosition = new Vec(0, 0);

    document.querySelector('#app').appendChild(this.canvas);

    this.mouse = new Mouse();

    this.canvas.onmousemove = e => {
      this.mouse.x = e.clientX + window.scrollX;
      this.mouse.y = e.clientY + window.scrollY;
    };

    this.canvas.onmousedown = e => {
      this.mouse.down = true;
      this.mouse.click = true;
    };
    this.canvas.onmouseup = e => this.mouse.down = false;

    this.offset = new Vec(0, 0);
    this.t = 0;
  }

  setCursorPointer = (a: boolean) => {
    this.canvas.style.cursor = a ? 'pointer' : 'inherit';
  };

  update() {
    const { canvas, ctx, offset, mouse } = this;

    this.t += 0.0002;

    this.viewport.scale = curves.lerp(this.viewport.scale, 0.01, 2);

    this.state.update();

    let xx = this.state.render();

    this.viewport.pos.x = curves.lerp(
      this.viewport.pos.x,
      0.2,
      this.targetCameraPosition.x + (this.mouse.x / ctx.canvas.width - 0.5) * 10
    );
    this.viewport.pos.y = curves.lerp(
      this.viewport.pos.y,
      0.2,
      this.targetCameraPosition.y +
        (this.mouse.y / ctx.canvas.height - 0.5) * 10
    );

    const m = this.viewport.posToWorldSpace(this.mouse);

    tegn(ctx, {
      x: 0,
      y: 0,
      width: ctx.canvas.width,
      height: ctx.canvas.height,
      fill: colors.white,
      children: [
        {
          x: ctx.canvas.width / 2 / this.viewport.scale - this.viewport.pos.x,
          y: ctx.canvas.height / 2 / this.viewport.scale - this.viewport.pos.y,
          scale: [ this.viewport.scale, this.viewport.scale ],
          children: [
            // centerBall,
            xx || [],
            //{ x: m.x, y: m.y, fill: 'black', width: 10, height: 10 }
          ]
        }
      ]
    }, void(0), void(0), void(0), [mouse.x, mouse.y]);

    mouse.click = false;
  }

  render() {
  }

  transitionTo(state: State) {
    this.state = state;
    state.model = this;
  }
}
