import { TegnElement, Renderable } from './tegn' 

export class Vec {
    data: number[]

    constructor(...data: number[]) {
        this.data = data
    }

    static fromArray(data): Vec {
        const vec = new Vec()

        vec.data = data

        return vec
    }

    static withSize(size: number, initial: number = 0): Vec {
        const data = []

        for (let i = 0; i < size; i++) {
            data[i] = initial
        }

        return Vec.fromArray(data)
    }

    get x() {
        return this.data[0]
    }
    set x(x) {
        this.data[0] = x
    }

    get y() {
        return this.data[1]
    }
    set y(y) {
        this.data[1] = y
    }

    apply(fn, vec) {
        return Vec.fromArray(this.data.map((a, i) => fn(a, vec.data[i] || 0)))
    }

    add(vec: Vec) {
        return this.apply((a, b) => a + b, vec)
    }

    sub(vec: Vec) {
        return this.apply((a, b) => a - b, vec)
    }

    mul(scale: number) {
        return this.apply((a, scale) => a * scale, Vec.withSize(this.data.length, scale))
    }

    len() {
        return Math.sqrt(this.data.reduce((a, b) => a + b * b, 0))
    }

    norm() {
        return this.mul(1/this.len())
    }
}


export class GraphicsElement implements Renderable {
    pos: Vec = new Vec(0, 0)

    mouseOver: () => any;

    update(t: number): void {}
    render(): TegnElement {
        return {
            x: 0,
            y: 0,
            onMouseOver: this.mouseOver,
        }
    }
}

export class Circle extends GraphicsElement {
    radius: number
    fill: typeof CanvasRenderingContext2D.prototype.fillStyle = 'cornflowerblue'

    constructor(pos: Vec, radius: number, fill = 'black') {
        super()
        this.pos = pos
        this.radius = radius
        this.fill = fill
    }

    update(t: number) {
    }

    render(): TegnElement {
        return {
            type: 'circle',
            onMouseOver: this.mouseOver,
            x: this.pos.x,
            y: this.pos.y,
            fill: this.fill,
            radius: this.radius,
        }
    }

    toRect(): Rect {
        return new Rect(this.pos.sub(new Vec(this.radius, this.radius)), this.radius * 2, this.radius * 2)
    }

    pointIsInside(a: Vec): boolean {
        return a.sub(this.pos).len() < this.radius
    }
}

export class Rect extends GraphicsElement {
    width: number
    height: number
    fill: typeof CanvasRenderingContext2D.prototype.fillStyle = 'cornflowerblue'

    constructor(pos: Vec, width: number, height: number, fill = 'black') {
        super()
        this.pos = pos
        this.width = width
        this.height = height
        this.fill = fill
    }

    update(t: number) {
    }

    get min(): Vec {
        return this.pos
    }

    get max(): Vec {
        return this.pos.add(new Vec(this.width, this.height))
    }

    render(): TegnElement {
        return {
            x: this.pos.x,
            y: this.pos.y,
            onMouseOver: this.mouseOver,
            width: this.width,
            height: this.height,
            fill: this.fill,
        }
    }

    intersects(b: Rect): boolean {
        if ((this.min.x > b.max.x) ||
            (this.max.x < b.min.x) ||
            (this.min.y > b.max.y) ||
            (this.max.y < b.min.y)) {
            return false
        }

        return true
    }
}

export class Group extends GraphicsElement {
    pos: Vec = new Vec(0, 0);
    children: GraphicsElement[] = [];
    scale: number = 1;

    constructor(children: GraphicsElement[]) {
        super()
        this.children = children
    }

    update(t: number) {
        this.children.forEach(a => a.update(t))
    }

    render(): TegnElement {
        return {
            x: this.pos.x,
            y: this.pos.y,
            onMouseOver: this.mouseOver,
            scale: [this.scale, this.scale],
            children: this.children
        }
    }
}

export class TextElement extends GraphicsElement {
    fill: string
    text: string
    font: typeof HTMLElement.prototype.style.fontFamily
    size: number
    align: 'center' | 'left' | 'right'

    constructor(pos: Vec, text: string, fill: string, font: string, size: number = 12, align: 'center' | 'left' | 'right' = 'center') {
        super()
        this.pos = pos
        this.text = text
        this.fill = fill
        this.size = size
        this.font = font
        this.align = align
    }

    update() {}

    render(): TegnElement {
        return {
            text: this.text,
            onMouseOver: this.mouseOver,
            font: `${this.size}px ${this.font}`,
            align: this.align,
            color: this.fill,
            x: this.pos.x,
            y: this.pos.y,
        }
    }
}
