import { cubicBezier, selectedTool, ToolTypes } from "./Toolbar.js"
import { World } from "../world/World.js"
import { RailShape } from "../world/RailShape.js"

export const BEZIER = {
    points: [
        null,
        null,
        null,
        null,
    ] as (GridPosition | null)[],
    dragging: -1,
}

export const BACKGROUND: {
    image: MipmapImage[],
    x: number,
    z: number
}[] = []

export const TRANSFORM = {
    x: 600,
    y: 250,
    scale: 2.4,
}

const MOUSE: {draw: boolean, lastPos: null | CanvasPosition} = {
    draw: false,
    lastPos: null
}

let DIRTY = true

export function markDirty() { DIRTY = true }

export const MIPMAP_LEVELS = 3

export type MipmapImage = HTMLImageElement | HTMLCanvasElement

export interface GridPosition {
    x: number,
    z: number
}

interface CanvasPosition {
    x: number,
    y: number
}

export function Canvas(WORLD: World) {
    const CANVAS = document.getElementById("canvas") as HTMLCanvasElement
    const ctx = CANVAS.getContext("2d", { alpha: false }) as CanvasRenderingContext2D

    function updateCanvasSize() {
        CANVAS.width = CANVAS.clientWidth
        CANVAS.height = CANVAS.clientHeight
        ctx.imageSmoothingEnabled = false
        markDirty()
    }
    window.addEventListener('resize', updateCanvasSize)
    updateCanvasSize()

    const textures: Record<string, HTMLImageElement> = {}

    const ZOOM_SPEED = 0.01
    const RENDER_IMAGE_THRESHOLD = 8
    const MINECART_ALPHA = 0.8
    const LINE_WIDTH = 0.1875
    const FIXED_WIDTH = 8

    for (const shapeName in RailShape) {
        const shape = RailShape[shapeName as keyof typeof RailShape]
        textures[shape] = new Image()
        textures[shape].src = `assets/${shape}.png`
    }
    textures.minecart = new Image()
    textures.minecart.src = `assets/minecart_top.png`

    CANVAS.addEventListener("wheel", e => {
        e.preventDefault()
        if (e.ctrlKey || e.metaKey || e.deltaZ !== 0) {
            const zoomFactor = Math.exp(-e.deltaY * ZOOM_SPEED)
            const rect = CANVAS.getBoundingClientRect()
            const mouseX = e.clientX - rect.left
            const mouseY = e.clientY - rect.top
            const worldX = (mouseX - TRANSFORM.x) / TRANSFORM.scale
            const worldY = (mouseY - TRANSFORM.y) / TRANSFORM.scale

            TRANSFORM.scale *= zoomFactor
            TRANSFORM.x = mouseX - worldX * TRANSFORM.scale
            TRANSFORM.y = mouseY - worldY * TRANSFORM.scale
        } else if (e.shiftKey) {
            TRANSFORM.x -= e.deltaX
            TRANSFORM.x -= e.deltaY
        } else {
            TRANSFORM.x -= e.deltaX
            TRANSFORM.y -= e.deltaY
        }
        markDirty()
    }, { passive: false })

    CANVAS.addEventListener("mousedown", e => {
        if (e.button === 0) {
            MOUSE.draw = true
            const pos = Object.freeze({x: e.clientX, y: e.clientY})

            if (selectedTool === ToolTypes.BEZIER) {
                const gridDecimalPos = canvasToGrid(pos)
                const gridPos = snap(gridDecimalPos)

                if (BEZIER.points[0] === null) { // If first drag, set p1 and c1
                    BEZIER.points[0] = gridPos
                    BEZIER.points[1] = gridPos
                    BEZIER.dragging = 1
                    return
                } else if (BEZIER.points[3] === null) { // If second drag, set p2 and c2
                    BEZIER.points[3] = gridPos
                    BEZIER.points[2] = gridPos
                    BEZIER.dragging = 2
                    return
                }

                if (BEZIER.points[1] === null || BEZIER.points[2] === null) {
                    return
                }

                const fixed_square_width_in_grid = FIXED_WIDTH / TRANSFORM.scale
                for (let i = 0; i < 4; i++) {
                    const point = BEZIER.points[i] as GridPosition
                    const dist = Math.max(Math.abs(point.x - gridDecimalPos.x), Math.abs(point.z - gridDecimalPos.z))

                    if (dist < fixed_square_width_in_grid / 2) {
                        BEZIER.dragging = i
                        break
                    }
                }
            } else {
                draw(pos)
                MOUSE.lastPos = pos
            }
        }
    })

    CANVAS.addEventListener("mouseup", () => {
        MOUSE.draw = false
        MOUSE.lastPos = null
        BEZIER.dragging = -1
    })

    CANVAS.addEventListener("mousemove", e => {
        if (MOUSE.draw) {
            const pos = Object.freeze({x: e.clientX, y: e.clientY})
            if (selectedTool === ToolTypes.BEZIER) {
                const gridPos = snap(canvasToGrid(pos))
                BEZIER.points[BEZIER.dragging] = gridPos
            } else {
                draw(pos)
                MOUSE.lastPos = pos
            }
        }
    })

    /**
     * Bresenham's Line Algorithm
     */
    function interpolateLine(pos0: GridPosition, pos1: GridPosition, callback: (pos: GridPosition) => void) {
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
            callback({x, z});
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

    function draw(pos: CanvasPosition) {
        if (!MOUSE.lastPos) {
            placeOrErase(snap(canvasToGrid(pos)))
        } else {
            interpolateLine(snap(canvasToGrid(MOUSE.lastPos)), snap(canvasToGrid(pos)), placeOrErase)
        }
    }

    function placeOrErase(pos: GridPosition) {
        switch(selectedTool) {
            case ToolTypes.ERASE:
                erase(pos)
                break
            case ToolTypes.NS:
                place(pos, "NS")
                break
            case ToolTypes.EW:
                place(pos, "EW")
                break
            case ToolTypes.NE:
                place(pos, "NE")
                break
            case ToolTypes.SE:
                place(pos, "SE")
                break
            case ToolTypes.NW:
                place(pos, "NW")
                break
            case ToolTypes.SW:
                place(pos, "SW")
                break
        }
    }

    function place({x, z}: GridPosition, shape: string) {
        const key = `${x},${z}`
        WORLD.grid[key] = shape
        markDirty()
    }

    function erase({x, z}: GridPosition) {
        const key = `${x},${z}`
        delete WORLD.grid[key]
        markDirty()
    }

    function canvasToGrid({x, y}: CanvasPosition) {
        const rect = CANVAS.getBoundingClientRect();
        return {
            x: ((x - rect.left) - TRANSFORM.x) / TRANSFORM.scale,
            z: ((y - rect.top) - TRANSFORM.y) / TRANSFORM.scale
        };
    }

    function snap({x, z}: GridPosition) {
        return {
            x: Math.floor(x),
            z: Math.floor(z)
        }
    }

    function drawRotatedImage(image: HTMLImageElement, x: number, y: number, angle: number, width: number, height: number) {
        ctx.save(); // Save current state

        ctx.globalAlpha = MINECART_ALPHA

        // Move to the center of the image
        ctx.translate(x + width / 2, y + height / 2);
        
        // Rotate the canvas context
        ctx.rotate(Math.PI / -180 * angle); // angle in radians
        
        // Draw the image centered
        ctx.drawImage(image, -width / 2, -height / 2, width, height);

        ctx.restore(); // Restore to original state
    }

    function render() {
        ctx.clearRect(0, 0, CANVAS.width, CANVAS.height)
        ctx.save()

        const current_level = Math.max(0, Math.min(MIPMAP_LEVELS, Math.floor(Math.log2(1 / TRANSFORM.scale))))
        for (const bg of BACKGROUND) {
            ctx.drawImage(
                bg.image[current_level],
                Math.floor(bg.x * TRANSFORM.scale + TRANSFORM.x),
                Math.floor(bg.z * TRANSFORM.scale + TRANSFORM.y),
                Math.ceil(bg.image[current_level].width * TRANSFORM.scale * Math.pow(2, current_level)),
                Math.ceil(bg.image[current_level].height * TRANSFORM.scale * Math.pow(2, current_level)),
            )
        }

        if (TRANSFORM.scale < RENDER_IMAGE_THRESHOLD) {
            ctx.fillStyle = "#b8afa2"
            for (const key in WORLD.grid) {
                const [x, y] = key.split(",").map(Number)
                ctx.fillRect(Math.floor(x * TRANSFORM.scale + TRANSFORM.x), Math.floor(y * TRANSFORM.scale + TRANSFORM.y), Math.ceil(TRANSFORM.scale), Math.ceil(TRANSFORM.scale))
            }
        } else {
            for (const key in WORLD.grid) {
                const [x, y] = key.split(",").map(Number)
                const shape = WORLD.grid[key]
                const img = textures[shape]
                if (!img) {
                    ctx.fillStyle = "#ff0000"
                    ctx.fillRect(Math.floor(x * TRANSFORM.scale + TRANSFORM.x), Math.floor(y * TRANSFORM.scale + TRANSFORM.y), Math.ceil(TRANSFORM.scale), Math.ceil(TRANSFORM.scale))
                    continue
                } else if (!img.complete) {
                    ctx.fillStyle = "#b8afa2"
                    ctx.fillRect(Math.floor(x * TRANSFORM.scale + TRANSFORM.x), Math.floor(y * TRANSFORM.scale + TRANSFORM.y), Math.ceil(TRANSFORM.scale), Math.ceil(TRANSFORM.scale))
                    continue
                }
                ctx.drawImage(img, Math.floor(x * TRANSFORM.scale + TRANSFORM.x), Math.floor(y * TRANSFORM.scale + TRANSFORM.y), Math.ceil(TRANSFORM.scale), Math.ceil(TRANSFORM.scale))
            }
        }

        for (const cart of WORLD.entities) {
            drawRotatedImage(
                textures.minecart,
                (cart.pos.x - 0.625) * TRANSFORM.scale + TRANSFORM.x,
                (cart.pos.z - 0.5) * TRANSFORM.scale + TRANSFORM.y,
                cart.yaw,
                TRANSFORM.scale * 1.25,
                TRANSFORM.scale
            )

            for (const {points, color} of cart.canvasLines) {
                if (points.length > 1) {
                    ctx.lineWidth = LINE_WIDTH * TRANSFORM.scale
                    ctx.beginPath()
                    ctx.moveTo(points[0].getX() * TRANSFORM.scale + TRANSFORM.x, points[0].getZ() * TRANSFORM.scale + TRANSFORM.y)
                    for (let i = 1; i < points.length; i++) {
                        ctx.lineTo(points[i].getX() * TRANSFORM.scale + TRANSFORM.x, points[i].getZ() * TRANSFORM.scale + TRANSFORM.y)
                    }
                    ctx.strokeStyle = color
                    ctx.stroke()
                }
            }
        }

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

        ctx.restore()
    }

    let lastFrameTime = performance.now()
    const fpsMeter = document.getElementById("fpsMeter")

    function animationLoop() {
        const now = performance.now()
        const msPerFrame = now - lastFrameTime
        lastFrameTime = now

        if (DIRTY) {
            render()
            DIRTY = false
        }

        const fps = 1000 / msPerFrame
        if (fpsMeter) fpsMeter.textContent = `FPS: ${fps.toFixed(0)}`

        requestAnimationFrame(animationLoop)
    }
    requestAnimationFrame(animationLoop)
}