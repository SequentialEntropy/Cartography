import { FIXED_WIDTH, GridPosition, markDirty, snap, TRANSFORM } from "../Canvas.js"

interface CircleType {
    x: number,
    z: number,
    radius: number
}
export const CIRCLE = {
    circles: [] as CircleType[],
    dragging: -1,
    focus: null as (CircleType | null)
}

export function mousedown(gridDecimalPos: GridPosition) {
    const gridPos = snap(gridDecimalPos)

    const radiusSlider = document.getElementById("radiusSlider") as HTMLInputElement
    const radiusValue = document.getElementById("radiusValue")
    if (!radiusSlider) throw new Error("#radiusSlider not found - unable to load radiusSlider")
    if (!radiusValue) throw new Error("#radiusValue not found - unable to load radiusValue")

    let found = false
    const fixed_square_width_in_grid = Math.max(1, FIXED_WIDTH / TRANSFORM.scale)
    for (let i = 0; i < CIRCLE.circles.length; i++) {
        const point = CIRCLE.circles[i]
        const dist = Math.max(Math.abs(point.x + .5 - gridDecimalPos.x), Math.abs(point.z + .5 - gridDecimalPos.z))

        if (dist < fixed_square_width_in_grid / 2) {
            CIRCLE.dragging = i
            CIRCLE.focus = CIRCLE.circles[i]
            radiusSlider.value = CIRCLE.circles[i].radius.toString()
            radiusValue.textContent = `R = ${CIRCLE.circles[i].radius}`
            found = true
            break
        }
    }

    if (!found) {
        const c = {
            x: gridPos.x,
            z: gridPos.z,
            radius: parseInt(radiusSlider.value, 10),
        }
        CIRCLE.dragging = CIRCLE.circles.length
        CIRCLE.focus = c
        CIRCLE.circles.push(c)
        markDirty()
    }
}

export function mouseup() {
    CIRCLE.dragging = -1
}

export function mousemove(gridDecimalPos: GridPosition) {
    const gridIntegerPos = snap(gridDecimalPos)
    const c = CIRCLE.circles[CIRCLE.dragging]
    c.x = gridIntegerPos.x
    c.z = gridIntegerPos.z
    markDirty()
}

export function render(ctx: CanvasRenderingContext2D) {
    const fixed_square_width = Math.max(FIXED_WIDTH, Math.ceil(TRANSFORM.scale))
    for (const c of CIRCLE.circles) {
        const cx = c.x
        const cy = c.z
        const radius = c.radius
        
        if (CIRCLE.focus === c) {
            ctx.fillStyle = "#ff0000"
        } else {
            ctx.fillStyle = "#0000ff"
        }

        ctx.fillRect(Math.floor((c.x + .5) * TRANSFORM.scale + TRANSFORM.x - fixed_square_width / 2), Math.floor((c.z + .5) * TRANSFORM.scale + TRANSFORM.y - fixed_square_width / 2), fixed_square_width, fixed_square_width)
        
        // 4-connected circle algorithm (in-place, no storage)
        let x = radius;
        let y = 0;
        
        ctx.fillStyle = "#918470"
        while (x > 0 && y <= radius) {
            // Reflect this point into all 8 octants
            ctx.fillRect(Math.floor((cx + x) * TRANSFORM.scale + TRANSFORM.x), Math.floor((cy + y) * TRANSFORM.scale + TRANSFORM.y), Math.ceil(TRANSFORM.scale), Math.ceil(TRANSFORM.scale))
            ctx.fillRect(Math.floor((cx + y) * TRANSFORM.scale + TRANSFORM.x), Math.floor((cy + x) * TRANSFORM.scale + TRANSFORM.y), Math.ceil(TRANSFORM.scale), Math.ceil(TRANSFORM.scale))
            ctx.fillRect(Math.floor((cx - y) * TRANSFORM.scale + TRANSFORM.x), Math.floor((cy + x) * TRANSFORM.scale + TRANSFORM.y), Math.ceil(TRANSFORM.scale), Math.ceil(TRANSFORM.scale))
            ctx.fillRect(Math.floor((cx - x) * TRANSFORM.scale + TRANSFORM.x), Math.floor((cy + y) * TRANSFORM.scale + TRANSFORM.y), Math.ceil(TRANSFORM.scale), Math.ceil(TRANSFORM.scale))
            ctx.fillRect(Math.floor((cx - x) * TRANSFORM.scale + TRANSFORM.x), Math.floor((cy - y) * TRANSFORM.scale + TRANSFORM.y), Math.ceil(TRANSFORM.scale), Math.ceil(TRANSFORM.scale))
            ctx.fillRect(Math.floor((cx - y) * TRANSFORM.scale + TRANSFORM.x), Math.floor((cy - x) * TRANSFORM.scale + TRANSFORM.y), Math.ceil(TRANSFORM.scale), Math.ceil(TRANSFORM.scale))
            ctx.fillRect(Math.floor((cx + y) * TRANSFORM.scale + TRANSFORM.x), Math.floor((cy - x) * TRANSFORM.scale + TRANSFORM.y), Math.ceil(TRANSFORM.scale), Math.ceil(TRANSFORM.scale))
            ctx.fillRect(Math.floor((cx + x) * TRANSFORM.scale + TRANSFORM.x), Math.floor((cy - y) * TRANSFORM.scale + TRANSFORM.y), Math.ceil(TRANSFORM.scale), Math.ceil(TRANSFORM.scale))

            // Choose direction (up or left)
            const errUp   = Math.abs(x ** 2 + (y + 1) ** 2 - radius * radius);
            const errLeft = Math.abs((x - 1) ** 2 + y ** 2 - radius * radius);

            if (errUp < errLeft) {
                y++;
            } else {
                x--;
            }
        }
    }
}

export function setRadiusSelectedCircle(radius: number) {
    if (CIRCLE.focus) {
        CIRCLE.focus.radius = radius
        markDirty()
    }
}

export function deleteSelectedCircle() {
    if (CIRCLE.focus) {
        CIRCLE.circles = CIRCLE.circles.filter(c => c !== CIRCLE.focus)
        CIRCLE.focus = null
    }
}