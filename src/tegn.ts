const cache = {};

export interface TegnElement {
  pixelate?: boolean,
  scale?: [number, number],
  fill?: typeof CanvasRenderingContext2D.prototype.fillStyle,
  color?: string,
  x: number,
  y: number,
  width?: number,
  height?: number,
  stroke?: string,
  src?: string,
  text?: string,
  font?: string,
  align?: 'center' | 'left' | 'right',
  type?: 'circle' | 'rect',
  radius?: number,
  children?: Array<TegnGenericElement | TegnGenericElement[]>
  onClick?: () => any
  onMouseOver?: () => any
}

export interface Renderable {
  render(): TegnElement,
  onClick?: () => any,
  onMouseOver?: () => any
}

export type TegnGenericElement = TegnElement | Renderable

export default function tegn(
  ctx: CanvasRenderingContext2D,
  state: TegnGenericElement | TegnGenericElement[],
  offset = [ 0, 0 ],
  scale = [ 1, 1 ],
  pixelate = false,
  mouse?: [number, number]
) {
  if (!state) return false;

  if (Array.isArray(state)) {
    state.map(child => tegn(ctx, child, offset, void(0), void(0), mouse));

    return state;
  }

  const el = 'render' in state ? (state as Renderable).render() : (state as TegnElement)

  el.type = el.type || 'rect';

  const p = !(el.pixelate !== void 0 ? el.pixelate : pixelate);

  ctx['imageSmoothingEnabled'] = p;
  ctx['mozImageSmoothingEnabled'] = p;
  ctx['oImageSmoothingEnabled'] = p;
  ctx['webkitImageSmoothingEnabled'] = p;
  ctx['msImageSmoothingEnabled'] = p;

  const s = el.scale || [ 1, 1 ];

  const sx = scale[0] * (s[0] || 1);
  const sy = scale[1] * (s[1] || 1);

  const x = offset[0] + (el.x || 0) * sx;
  const y = offset[1] + (el.y || 0) * sy;

  if (x < ctx.canvas.width && y < ctx.canvas.height || true) {
    if (el.fill) {
      if (ctx.fillStyle !== el.fill) {
        ctx.fillStyle = el.color || el.fill;
      }

      switch (el.type) {
        case 'circle': {
          const radius = el.radius * sx

          ctx.fillStyle = el.fill
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fill()

          if (mouse && el.onMouseOver) {
            const dx = mouse[0] - x
            const dy = mouse[1] - y
            const dsq = dx * dx + dy * dy

            if (dsq < radius * radius) {
              el.onMouseOver()
            }
          }
        } break
        case 'rect': {
          ctx.fillRect(x, y, el.width * sx || 0, el.height * sy || 0);
        }
      }
    }

    if (el.stroke) {
      ctx.strokeStyle = el.stroke;
      ctx.strokeRect(x, y, el.width * sx || 0, el.height * sy || 0);
    }

    if (el.src) {
      let img = image(el.src);

      if (el.width && el.height) {
        ctx.drawImage(
          image(el.src),
          x,
          y,
          el.width * sx,
          el.height * sy
        );
      } else {
        ctx.drawImage(image(el.src), x, y, img.width * sx, img.height * sy);
      }
    }

    if (el.text) {
      const size = parseInt(el.font || ctx.font)
      if (el.font) {
        ctx.font = el.font.replace(size + '', (size * sx) + '');
      }
      if (el.color) {
        ctx.fillStyle = el.color;
      }

      ctx.textAlign = el.align || 'left';

      el.text.split('\n').forEach((t, i) => {
        ctx.fillText(t, x, y + i * size * sx);
      })
    }
  }

  if (el.children) {
    let len = el.children.length;

    for (let i = 0; i < len; i++) {
      const d = el.children[i]
      tegn(ctx, d, [ x, y ], [ sx, sy ], !p, mouse);
    }
  }

  return el;
}

export function init(width, height, elm = document.body) {
  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  return ctx;
}

function image(src) {
  if (typeof src !== 'string') return src;

  if (cache[src]) return cache[src];

  const img = document.createElement('img');
  img.src = src;

  return cache[src] = img;
}
