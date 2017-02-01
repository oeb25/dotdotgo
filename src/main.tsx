import { rand, randValue, colors, curves, chooseRand } from './helpers';
import {
  Vec,
  Circle,
  Rect,
  TextElement,
  GraphicsElement,
  Group
} from './graphics';
import { Model, State } from './render';
import tegn, { TegnGenericElement, TegnElement } from './tegn';
import { questions } from './questions'

const font = 'Bungee';

let t = 0;
let iq = 0;

class Intro extends State {
  babies: Circle[];
  center: GraphicsElement;

  constructor() {
    super();

    this.babies = [];
    this.center = new Group([
      new Circle(new Vec(0, 0), 100, colors.red),
      new TextElement(
        new Vec(0, 0),
        'Hvad fuck kender du til\nInternet sikkerhed?',
        colors.white,
        'Bungee',
        11
      )
    ])

    this.center.mouseOver = () => {
      console.log('ehh...')
    }

    for (let i = 0; i < 500; i++) {
      this.babies.push(new Circle(
        new Vec(rand(-5, 5), rand(-5, 5)),
        rand(50, 500),
        chooseRand([colors.blue, colors.red, colors.green, colors.yellow])
      ));
    }

    this.babies.sort((a, b) => a.radius - b.radius);
  }

  update() {
    const { canvas, ctx, viewport } = this.model;

    let center: Vec = this.babies
      .reduce((a, b) => a.add(b.pos), new Vec(0, 0))
      .mul(1 / this.babies.length);

    let i = 0;

    this.babies = this.babies.filter(g => {
      const d = center.sub(g.pos);
      g.pos = g.pos.add(d.norm().mul((-10) / d.len() - g.radius / 20));
      g.update(t);

      return g.toRect().intersects(viewport.getScreenRect());
    });

    if (this.babies.length <= 1) {
      this.transitionToIn(0, new Awating(new PhysicalElement(this.center), []), [this.center]);
    }
  }

  render(): TegnGenericElement {
    let a: TegnGenericElement

    return {
      x: 0,
      y: 0,
      children: [
        this.center,
        this.babies,
      ]
    }
  }
}

class PhysicalElement extends GraphicsElement {
  gfx: GraphicsElement;

  vel: Vec = new Vec(0, 0)
  drag: number = 0.8

  constructor(gfx: GraphicsElement) {
    super()
    this.gfx = gfx
    this.vel = new Vec(0, 0)
  }

  update(t: number = 1) {
    this.pos = this.pos.add(this.vel.mul(t))
    this.vel = this.vel.mul(0.98)
    this.gfx.update(t)
  }

  render(): TegnElement {
    return {
      x: this.pos.x,
      y: this.pos.y,
      onMouseOver: this.mouseOver,
      children: [
        this.gfx.render()
      ]
    }
  }
}

class Awating extends State {
  center: PhysicalElement;
  children: GraphicsElement[] = []

  constructor(center: PhysicalElement, children: GraphicsElement[]) {
    super()
    this.center = center
    this.children = children || []
  }

  update() {
    const c = (this.center.gfx as Group).children[0] as Circle
    const x = this.center.pos.sub(this.model.viewport.posToWorldSpace(this.model.mouse)).len()

    if (c.radius > x) {
      c.radius = curves.lerp(c.radius, 0.2, 110)
      this.model.canvas.style.cursor = 'pointer'

      if (this.model.mouse.click) {
        this.model.canvas.style.cursor = 'inherit'        
        
        const elem = new PhysicalElement(new Circle(new Vec(0, 0), 50, chooseRand([colors.blue, colors.red, colors.green, colors.yellow])))
        elem.pos = new Vec(this.center.pos.x, this.center.pos.y)
        const seed = Math.random() * 2 * Math.PI
        const speed = 4
        elem.vel = new Vec(Math.cos(seed), Math.sin(seed)).mul(speed)

        this.shootAndFollow(elem)
      }
    } else {
      this.model.canvas.style.cursor = 'inherit'
      c.radius = curves.lerp(c.radius, 0.2, 100)
    }

    this.children.forEach(c => c.update(1))
    this.center.update(1)
  }

  render(): TegnGenericElement {
    this.model.targetCameraPosition.x = this.center.pos.x
    this.model.targetCameraPosition.y = this.center.pos.y

    return {
      x: 0,
      y: 0,
      children: [
        ...(this.children || []),
        this.center,
      ]
    }
  }

  shootAndFollow(target: PhysicalElement) {
    this.children.push(this.center)
    this.center = target
    this.transitionTo(new MovingToNewQuestion(this.center, this.children.map(c => new Group([c]))))
  }
}

class MovingToNewQuestion extends State {
  center: PhysicalElement;
  children: Group[] = []

  constructor(center: PhysicalElement, children: Group[] = []) {
    super()
    this.center = center
    this.children = children
  }

  update() {
    this.children.forEach(c => {
      c.update(1)
      c.scale = curves.lerp(c.scale, 0.01, 0.5)
    })
    this.center.update()
    
    if (this.center.vel.len() < 0.2) {
      const c = this.center.gfx as Circle
      c.radius = curves.lerp(c.radius, 0.2, 110)
      
      if (c.radius >= 100) {
        const q = questions[iq++]
        let seed = Math.random() * Math.PI * 2
        
        this.center.gfx = new Group([
          new Group([
            this.center.gfx,
            new TextElement(new Vec(0, 0), q.q, colors.white, font)
          ]),
          ...q.a.map((a, i) => {
            const c = new Circle(
              new Vec(0, 0),
              70,
              chooseRand([colors.blue, colors.red, colors.green, colors.yellow])
            )

            const inner = new Group([
              c,
              new TextElement(new Vec(0, 0), a, colors.white, font, 12)
            ])

            const elem = new PhysicalElement(inner)
            const v = seed + Math.PI * 2 / q.a.length * i

            c.mouseOver = () => {
              console.log('wtf')
            }

            elem.vel = new Vec(Math.cos(v), Math.sin(v)).mul(3)

            return elem
          })
        ])

        this.transitionTo(new Awating(this.center, this.children))
      }
    }
  }

  render(): TegnGenericElement {
    this.model.targetCameraPosition.x = this.center.pos.x
    this.model.targetCameraPosition.y = this.center.pos.y

    return {
      x: 0,
      y: 0,
      children: [
        ...this.children,
        this.center,
      ]
    }
  }
}

let model = new Model(new Intro)

const loop = () => {
  requestAnimationFrame(loop);

  model.update()
};

loop();
