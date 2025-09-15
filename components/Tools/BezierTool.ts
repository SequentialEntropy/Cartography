import { RailShape } from "../../world/RailShape.js";
import { World } from "../../world/World.js";
import { FIXED_WIDTH, GridPosition, LINE_WIDTH, markDirty, snap, TRANSFORM } from "../Canvas.js"

const BEZIER = {
    points: [
        null,
        null,
        null,
        null,
    ] as (GridPosition | null)[],
    dragging: -1,
}

export function mousedown(gridDecimalPos: GridPosition) {
    const gridIntegerPos = snap(gridDecimalPos)

    if (BEZIER.points[0] === null) { // If first drag, set p1 and c1
        BEZIER.points[0] = gridIntegerPos
        BEZIER.points[1] = gridIntegerPos
        BEZIER.dragging = 1
        markDirty()
        return
    } else if (BEZIER.points[3] === null) { // If second drag, set p2 and c2
        BEZIER.points[3] = gridIntegerPos
        BEZIER.points[2] = gridIntegerPos
        BEZIER.dragging = 2
        markDirty()
        return
    }

    if (BEZIER.points[1] === null || BEZIER.points[2] === null) {
        return
    }

    const fixed_square_width_in_grid = Math.max(1, FIXED_WIDTH / TRANSFORM.scale)
    for (let i = 0; i < 4; i++) {
        const point = BEZIER.points[i] as GridPosition
        const dist = Math.max(Math.abs(point.x + .5 - gridDecimalPos.x), Math.abs(point.z + .5 - gridDecimalPos.z))

        if (dist < fixed_square_width_in_grid / 2) {
            BEZIER.dragging = i
            break
        }
    }
}

export function mouseup() {
    BEZIER.dragging = -1
}

export function mousemove(pos: GridPosition) {
    const gridPos = snap(pos)
    BEZIER.points[BEZIER.dragging] = gridPos
    markDirty()
}

export function render(ctx: CanvasRenderingContext2D) {
    const [p1, c1, c2, p2] = BEZIER.points

    let last: GridPosition | null = null

    if (p1 && c1 && c2 && p2) {
        ctx.fillStyle = "#918470"
        ctx.lineWidth = LINE_WIDTH * TRANSFORM.scale
        ctx.beginPath()
        for (let t = 0; t <= 1; t += 0.0001) {
            const x = cubicBezier(p1.x, c1.x, c2.x, p2.x, t) + .5
            const z = cubicBezier(p1.z, c1.z, c2.z, p2.z, t) + .5

            if (t === 0) ctx.moveTo(x * TRANSFORM.scale + TRANSFORM.x, z * TRANSFORM.scale + TRANSFORM.y);
            else ctx.lineTo(x * TRANSFORM.scale + TRANSFORM.x, z * TRANSFORM.scale + TRANSFORM.y);

            const gridPoint = snap({x, z})

            const dx = last ? Math.abs(gridPoint.x - last.x) : null
            const dz = last ? Math.abs(gridPoint.z - last.z) : null

            if (last && dx === 1 && dz === 1) {
                const cornerPoint: GridPosition = {
                    x: last.x,
                    z: gridPoint.z
                }
                ctx.fillRect(Math.floor(cornerPoint.x * TRANSFORM.scale + TRANSFORM.x), Math.floor(cornerPoint.z * TRANSFORM.scale + TRANSFORM.y), Math.ceil(TRANSFORM.scale), Math.ceil(TRANSFORM.scale))
                last = cornerPoint
            }

            if (last && !(last.x === gridPoint.x && last.z === gridPoint.z)) {
                ctx.fillRect(Math.floor(gridPoint.x * TRANSFORM.scale + TRANSFORM.x), Math.floor(gridPoint.z * TRANSFORM.scale + TRANSFORM.y), Math.ceil(TRANSFORM.scale), Math.ceil(TRANSFORM.scale))
            }
            last = gridPoint
        }
    }

    const fixed_line_width = Math.max(Math.ceil(LINE_WIDTH * FIXED_WIDTH), Math.ceil(LINE_WIDTH * TRANSFORM.scale))
    const fixed_square_width = Math.max(FIXED_WIDTH, Math.ceil(TRANSFORM.scale))
    if (p1 && c1) {
        ctx.lineWidth = fixed_line_width
        ctx.beginPath()
        ctx.moveTo((p1.x + .5) * TRANSFORM.scale + TRANSFORM.x, (p1.z + .5) * TRANSFORM.scale + TRANSFORM.y)
        ctx.lineTo((c1.x + .5) * TRANSFORM.scale + TRANSFORM.x, (c1.z + .5) * TRANSFORM.scale + TRANSFORM.y)
        ctx.strokeStyle = "#0000ff"
        ctx.stroke()

        ctx.fillStyle = "#ff0000"
        ctx.fillRect(Math.floor((p1.x + .5) * TRANSFORM.scale + TRANSFORM.x - fixed_square_width / 2), Math.floor((p1.z + .5) * TRANSFORM.scale + TRANSFORM.y - fixed_square_width / 2), fixed_square_width, fixed_square_width)
        
        ctx.fillStyle = "#0000ff"
        ctx.fillRect(Math.floor((c1.x + .5) * TRANSFORM.scale + TRANSFORM.x - fixed_square_width / 2), Math.floor((c1.z + .5) * TRANSFORM.scale + TRANSFORM.y - fixed_square_width / 2), fixed_square_width, fixed_square_width)
    }

    if (p2 && c2) {
        ctx.lineWidth = fixed_line_width
        ctx.beginPath()
        ctx.moveTo((p2.x + .5) * TRANSFORM.scale + TRANSFORM.x, (p2.z + .5) * TRANSFORM.scale + TRANSFORM.y)
        ctx.lineTo((c2.x + .5) * TRANSFORM.scale + TRANSFORM.x, (c2.z + .5) * TRANSFORM.scale + TRANSFORM.y)
        ctx.strokeStyle = "#0000ff"
        ctx.stroke()

        ctx.fillStyle = "#ff0000"
        ctx.fillRect(Math.floor((p2.x + .5) * TRANSFORM.scale + TRANSFORM.x - fixed_square_width / 2), Math.floor((p2.z + .5) * TRANSFORM.scale + TRANSFORM.y - fixed_square_width / 2), fixed_square_width, fixed_square_width)

        ctx.fillStyle = "#0000ff"
        ctx.fillRect(Math.floor((c2.x + .5) * TRANSFORM.scale + TRANSFORM.x - fixed_square_width / 2), Math.floor((c2.z + .5) * TRANSFORM.scale + TRANSFORM.y - fixed_square_width / 2), fixed_square_width, fixed_square_width)
    }
}

export function commit(WORLD: World) {
    const [p1, c1, c2, p2] = BEZIER.points
    let last: GridPosition | null = null

    BEZIER.points = [null, null, null, null]
    BEZIER.dragging = -1

    if (!(p1 && c1 && c2 && p2)) return

    for (let t = 0; t <= 1; t += 0.0001) {
        const x = Math.floor(cubicBezier(p1.x, c1.x, c2.x, p2.x, t) + 0.5)
        const z = Math.floor(cubicBezier(p1.z, c1.z, c2.z, p2.z, t) + 0.5)

        const dx = last ? Math.abs(x - last.x) : null
        const dz = last ? Math.abs(z - last.z) : null
        
        // Fill in corner-corner connection
        if (last && dx === 1 && dz === 1) {
            const gridPoint = {
                x: last.x,
                z: z
            } as GridPosition
            placeSmoothTrack(gridPoint, WORLD)
            placeSmoothTrack(last, WORLD)
            last = gridPoint
        }

        const gridPoint = {x, z} as GridPosition
        if (last && !(last.x === gridPoint.x && last.z === gridPoint.z)) {
            placeSmoothTrack(gridPoint, WORLD)
            placeSmoothTrack(last, WORLD)
        }
        last = gridPoint
    }
    markDirty()
}

function placeSmoothTrack({x, z}: GridPosition, world: World) {
    const above = `${x},${z - 1}` in world.grid;
    const below = `${x},${z + 1}` in world.grid;
    const left  = `${x - 1},${z}` in world.grid;
    const right = `${x + 1},${z}` in world.grid;

    let orientation = RailShape.NORTH_SOUTH

    if      (above && below) orientation = RailShape.NORTH_SOUTH;
    else if (left  && right) orientation = RailShape.EAST_WEST;
    else if (above && right) orientation = RailShape.NORTH_EAST;
    else if (above && left)  orientation = RailShape.NORTH_WEST;
    else if (below && right) orientation = RailShape.SOUTH_EAST;
    else if (below && left)  orientation = RailShape.SOUTH_WEST;
    else if (above || below) orientation = RailShape.NORTH_SOUTH;
    else if (left  || right) orientation = RailShape.EAST_WEST;

    world.grid[`${x},${z}`] = orientation
}

function cubicBezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
    return (1 - t) ** 3 * p0
        + 3 * (1 - t) ** 2 * t * p1
        + 3 * (1 - t) * t ** 2 * p2
        + t ** 3 * p3;
}