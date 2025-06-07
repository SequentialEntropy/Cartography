import { AbstractMinecartEntity } from "./world/AbstractMinecartEntity.js"
import { Canvas, markDirty } from "./components/Canvas.js"
import { Toolbar } from "./components/Toolbar.js"
import { Vec3d } from "./world/Vec3d.js"
import { World } from "./world/World.js"

const WORLD = new World()
// const TPS = 20
const TPS = 1

async function curvePreset() {
    const response = await fetch("assets/curve_test.json")
    const json = await response.json()
    WORLD.import(json)
    WORLD.entities = [
        new AbstractMinecartEntity(Vec3d.fromXYZ(0, 0, 0), Vec3d.fromXYZ(-1.6, 0, 0), 0, WORLD),
    ]
}

async function autoPreset() {
    const response = await fetch("assets/auto_layout.json")
    const json = await response.json()
    WORLD.import(json)
    WORLD.entities = [
        new AbstractMinecartEntity(Vec3d.fromXYZ(-185.5, 0, 15.5), Vec3d.fromXYZ(1.6, 0, 0), 0, WORLD),
        new AbstractMinecartEntity(Vec3d.fromXYZ(-105.5, 0, 19.5), Vec3d.fromXYZ(1.3, 0, 0), 0, WORLD),
        new AbstractMinecartEntity(Vec3d.fromXYZ(150.5, 0, 5.5),   Vec3d.fromXYZ(1.7, 0, 0), 0, WORLD),
        new AbstractMinecartEntity(Vec3d.fromXYZ(200.5, 0, 19.5),  Vec3d.fromXYZ(1.4, 0, 0), 0, WORLD),
    ]
}

Toolbar(WORLD)
Canvas(WORLD)
autoPreset()

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