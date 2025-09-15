import { selectedTool, ToolTypes } from "./Toolbar.js"
import { World } from "../world/World.js"
import { RailShape } from "../world/RailShape.js"

import * as DrawTool from "./Tools/DrawTool.js"
import * as BezierTool from "./Tools/BezierTool.js"
import * as CircleTool from "./Tools/CircleTool.js"

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

export const MOUSE: {draw: boolean, lastPos: null | GridPosition} = {
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

export function snap({x, z}: GridPosition) {
    return {
        x: Math.floor(x),
        z: Math.floor(z)
    }
}

const ZOOM_SPEED = 0.01
const RENDER_IMAGE_THRESHOLD = 8
const MINECART_ALPHA = 0.8
export const LINE_WIDTH = 0.1875
export const FIXED_WIDTH = 8

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
            const canvasPos = Object.freeze({x: e.clientX, y: e.clientY})
            const gridPos = canvasToGrid(canvasPos)

            if (selectedTool === ToolTypes.BEZIER) {
                BezierTool.mousedown(gridPos)
            } else if (selectedTool === ToolTypes.CIRCLE) {
                CircleTool.mousedown(gridPos)
            } else {
                DrawTool.mousedown(gridPos, WORLD)
            }

            MOUSE.lastPos = gridPos
        }
    })

    CANVAS.addEventListener("mouseup", () => {
        MOUSE.draw = false
        MOUSE.lastPos = null
        BezierTool.mouseup()
        CircleTool.mouseup()
    })

    CANVAS.addEventListener("mousemove", e => {
        if (MOUSE.draw) {
            const canvasPos = Object.freeze({x: e.clientX, y: e.clientY})
            const gridPos = canvasToGrid(canvasPos)

            if (selectedTool === ToolTypes.BEZIER) {
                BezierTool.mousemove(gridPos)
            } else if (selectedTool === ToolTypes.CIRCLE) {
                CircleTool.mousemove(gridPos)
            } else {
                DrawTool.mousemove(gridPos, WORLD)
            }

            MOUSE.lastPos = gridPos
        }
    })

    function canvasToGrid({x, y}: CanvasPosition) {
        const rect = CANVAS.getBoundingClientRect();
        return {
            x: ((x - rect.left) - TRANSFORM.x) / TRANSFORM.scale,
            z: ((y - rect.top) - TRANSFORM.y) / TRANSFORM.scale
        };
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

        BezierTool.render(ctx)

        CircleTool.render(ctx)

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