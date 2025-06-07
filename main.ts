import { AbstractMinecartEntity } from "./world/AbstractMinecartEntity.js"
import { Canvas } from "./components/Canvas.js"
import { Toolbar } from "./components/Toolbar.js"
import { Vec3d } from "./world/Vec3d.js"
import { World } from "./world/World.js"
import { ExperimentalMinecartController } from "./world/ExperimentalMinecartController.js"
import { CustomMinecartController } from "./world/CustomMinecartController.js"

const WORLD = new World()
const TPS = 20

async function curvePreset() {
    const response = await fetch("assets/curve_test.json")
    const json = await response.json()
    WORLD.import(json)
    WORLD.entities = [
        new AbstractMinecartEntity(Vec3d.fromXYZ(0, 0, 0), Vec3d.fromXYZ(-1.6, 0, 0), 0, WORLD, ExperimentalMinecartController),
    ]
}

async function autoPreset() {
    const response = await fetch("assets/auto_layout.json")
    const json = await response.json()
    WORLD.import(json)
    WORLD.entities = [
        new AbstractMinecartEntity(Vec3d.fromXYZ(-185.5, 0, 15.5), Vec3d.fromXYZ(1.6, 0, 0), 0, WORLD, CustomMinecartController),
        new AbstractMinecartEntity(Vec3d.fromXYZ(-105.5, 0, 19.5), Vec3d.fromXYZ(1.3, 0, 0), 0, WORLD, CustomMinecartController),
        new AbstractMinecartEntity(Vec3d.fromXYZ(150.5, 0, 5.5),   Vec3d.fromXYZ(1.7, 0, 0), 0, WORLD, CustomMinecartController),
        new AbstractMinecartEntity(Vec3d.fromXYZ(200.5, 0, 19.5),  Vec3d.fromXYZ(1.4, 0, 0), 0, WORLD, CustomMinecartController),
    ]
}

Toolbar(WORLD)
Canvas(WORLD)

autoPreset()
setInterval(() => WORLD.gameLoop(), 1000 / TPS)