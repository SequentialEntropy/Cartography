export class Vec3i {
    constructor(x, y, z) {
        this.x = Math.floor(x);
        this.y = Math.floor(y);
        this.z = Math.floor(z);
        Object.freeze(this);
    }
    getX() { return this.x; }
    getY() { return this.y; }
    getZ() { return this.z; }
}
Vec3i.ZERO = new Vec3i(0, 0, 0);
