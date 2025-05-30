import { Position } from './Position.js';

export class Vec3i implements Position {
    static ZERO = new Vec3i(0, 0, 0)
    x: number
    y: number
    z: number

    constructor(x: number, y: number, z: number) {
        this.x = Math.floor(x)
        this.y = Math.floor(y)
        this.z = Math.floor(z)
        Object.freeze(this)
    }

    getX() { return this.x }
    getY() { return this.y }
    getZ() { return this.z }
}