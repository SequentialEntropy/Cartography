import { markDirty } from "./Canvas.js"

export const ENTITIES = [
    {
        x: 0,
        y: 0,
        rotation: 0
    },
    {
        x: 1,
        y: 1,
        rotation: 45
    }
]

export function World() {

    function tick() {
        for (const cart of ENTITIES) {
            cart.rotation = (cart.rotation + 10) % 360
        }
    }

    function gameLoop() {
        // const now = performance.now()
        // const mspt = now - lastTick
        // lastTick = now

        tick()
        markDirty()

        // const tps = 1000 / mspt
        // tpsMeter.textContent = `TPS: ${tps.toFixed(2)}`
    }

    setInterval(gameLoop, 1000 / 20)
}