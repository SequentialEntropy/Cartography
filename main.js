import { Canvas, markDirty } from "./components/Canvas.js"
import { Toolbar } from "./components/toolbar.js"
import { World } from "./components/World.js"

const WORLD = new World()
const TPS = 20

Toolbar(WORLD)
Canvas(WORLD)

function gameLoop() {
    // const now = performance.now()
    // const mspt = now - lastTick
    // lastTick = now

    WORLD.tick()
    markDirty()

    // const tps = 1000 / mspt
    // tpsMeter.textContent = `TPS: ${tps.toFixed(2)}`
}

setInterval(gameLoop, 1000 / TPS)
// gameLoop()