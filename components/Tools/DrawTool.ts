import { World } from "../../world/World.js"
import { GridPosition, markDirty, MOUSE, snap } from "../Canvas.js"
import { selectedTool, ToolTypes } from "../Toolbar.js"

export function mousedown(gridDecimalPos: GridPosition, WORLD: World) {
    if (!MOUSE.lastPos) {
        placeOrErase(snap(gridDecimalPos), WORLD)
    } else {
        interpolateLine(snap(MOUSE.lastPos), snap(gridDecimalPos), WORLD)
    }
}

export function mouseup() {}

export const mousemove = mousedown

/**
 * Bresenham's Line Algorithm
 */
function interpolateLine(pos0: GridPosition, pos1: GridPosition, WORLD: World) {
    let x = pos0.x
    let z = pos0.z
    const x1 = pos1.x
    const z1 = pos1.z
    const dx = Math.abs(x1 - x);
    const dz = Math.abs(z1 - z);
    const sx = x < x1 ? 1 : -1;
    const sz = z < z1 ? 1 : -1;
    let err = dx - dz;

    while (true) {
        placeOrErase({x, z}, WORLD);
        if (x === x1 && z === z1) break;
        const e2 = 2 * err;
        if (e2 > -dz) {
            err -= dz;
            x += sx;
        }
        if (e2 < dx) {
            err += dx;
            z += sz;
        }
    }
}

function placeOrErase(pos: GridPosition, WORLD: World) {
    switch(selectedTool) {
        case ToolTypes.ERASE:
            erase(pos, WORLD)
            break
        case ToolTypes.NS:
            place(pos, WORLD, "NS")
            break
        case ToolTypes.EW:
            place(pos, WORLD, "EW")
            break
        case ToolTypes.NE:
            place(pos, WORLD, "NE")
            break
        case ToolTypes.SE:
            place(pos, WORLD, "SE")
            break
        case ToolTypes.NW:
            place(pos, WORLD, "NW")
            break
        case ToolTypes.SW:
            place(pos, WORLD, "SW")
            break
    }
}

function place({x, z}: GridPosition, WORLD: World, shape: string) {
    const key = `${x},${z}`
    WORLD.grid[key] = shape
    markDirty()
}

function erase({x, z}: GridPosition, WORLD: World) {
    const key = `${x},${z}`
    delete WORLD.grid[key]
    markDirty()
}