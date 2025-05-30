import { RailShape } from "./RailShape.js"
import { selectedTool, ToolTypes } from "./toolbar.js"

export const TRANSFORM = {
    x: 600,
    y: 250,
    scale: 0.15,
}

const MOUSE = {
    draw: false,
    lastPos: null
}

let DIRTY = true

export function markDirty() { DIRTY = true }

export function Canvas(WORLD) {
    const CANVAS = document.getElementById("canvas")
    const ctx = CANVAS.getContext("2d")

    function updateCanvasSize() {
        CANVAS.width = CANVAS.clientWidth
        CANVAS.height = CANVAS.clientHeight
        ctx.imageSmoothingEnabled = false
        markDirty()
    }
    window.addEventListener('resize', updateCanvasSize)
    updateCanvasSize()


    const textures = {}
    const TILE_SIZE = 16

    const ZOOM_SPEED = 0.01

    for (const shapeName in RailShape) {
        const shape = RailShape[shapeName]
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
            draw(pos)
            MOUSE.lastPos = pos
        }
    })

    CANVAS.addEventListener("mouseup", () => {
        MOUSE.draw = false
        MOUSE.lastPos = null
    })

    CANVAS.addEventListener("mousemove", e => {
        if (MOUSE.draw) {
            const pos = Object.freeze({x: e.clientX, y: e.clientY})
            draw(pos)
            MOUSE.lastPos = pos
        }
    })

    /**
     * Bresenham's Line Algorithm
     */
    function interpolateLine(pos0, pos1, callback) {
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

    function draw(pos) {
        if (!MOUSE.lastPos) {
            placeOrErase(snap(canvasToGrid(pos)))
        } else {
            interpolateLine(snap(canvasToGrid(MOUSE.lastPos)), snap(canvasToGrid(pos)), placeOrErase)
        }
    }

    function placeOrErase({x, z}) {
        switch(selectedTool) {
            case ToolTypes.ERASE:
                erase({x, z})
                break
            case ToolTypes.NS:
            case ToolTypes.EW:
            case ToolTypes.NE:
            case ToolTypes.SE:
            case ToolTypes.NW:
            case ToolTypes.SW:
                place({x, z}, selectedTool)
                break
        }
    }

    function place({x, z}, shape) {
        const key = `${x},${z}`
        WORLD.grid[key] = shape
        markDirty()
    }

    function erase({x, z}) {
        const key = `${x},${z}`
        delete WORLD.grid[key]
        markDirty()
    }

    function canvasToGrid({x, y}) {
        const rect = CANVAS.getBoundingClientRect();
        return {
            x: ((x - rect.left) - TRANSFORM.x) / (TILE_SIZE * TRANSFORM.scale),
            z: ((y - rect.top) - TRANSFORM.y) / (TILE_SIZE * TRANSFORM.scale)
        };
    }

    function snap({x, z}) {
        return {
            x: Math.floor(x),
            z: Math.floor(z)
        }
    }

    function drawRotatedImage(ctx, image, x, y, angle, width, height) {
        ctx.save(); // Save current state

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
        ctx.translate(TRANSFORM.x, TRANSFORM.y)
        ctx.scale(TRANSFORM.scale, TRANSFORM.scale)

        if (TRANSFORM.scale * TILE_SIZE < 8) {
            ctx.fillStyle = "#b8afa2"
            for (const key in WORLD.grid) {
                const [x, y] = key.split(",").map(Number)
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
            }
        } else {
            for (const key in WORLD.grid) {
                const [x, y] = key.split(",").map(Number)
                const shape = WORLD.grid[key]
                const img = textures[shape]
                if (!img) {
                    ctx.fillStyle = "#ff0000"
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
                    continue
                } else if (!img.complete) {
                    ctx.fillStyle = "#b8afa2"
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
                    continue
                }
                ctx.drawImage(img, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
            }
        }

        for (const cart of WORLD.entities) {
            drawRotatedImage(ctx, textures.minecart, (cart.pos.x - 0.625) * TILE_SIZE, (cart.pos.z - 0.5) * TILE_SIZE, cart.yaw, TILE_SIZE * 1.25, TILE_SIZE)
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
        fpsMeter.textContent = `FPS: ${fps.toFixed(2)}`

        requestAnimationFrame(animationLoop)
    }
    requestAnimationFrame(animationLoop)
}