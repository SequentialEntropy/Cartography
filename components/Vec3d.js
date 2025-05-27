export class Vec3d {
    static ZERO = new Vec3d(0.0, 0.0, 0.0)

    constructor(x, y, z) {
        this.x = x
        this.y = y
        this.z = z
        Object.freeze(this)
    }

    static fromVec3i(vec) {
        return new Vec3d(vec.x, vec.y, vec.z)
    }

    dotProduct(vec) {
        return this.x * vec.x + this.y * vec.y + this.z * vec.z
    }

    normalize() {
		d = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
		return d < 1.0E-5 ? ZERO : new Vec3d(this.x / d, this.y / d, this.z / d)
	}

    multiplyConst(value) {
        return this.multiplyXYZ(value, value, value)
    }

    multiplyXYZ(x, y, z) {
        return new Vec3d(this.x * x, this.y * y, this.z * z)
    }

    getHorizontal() {
        return new Vec3d(this.x, 0, this.z)
    }

    dotProduct(vec) {
		return this.x * vec.x + this.y * vec.y + this.z * vec.z
	}

    length() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	}

    getX() { return this.x }
    getY() { return this.y }
    getZ() { return this.z }

    addXYZ(x, y, z) {
        return new Vec3d(this.x + x, this.y + y, this.z + z)
    }

    addVec3d(vec) {
        return this.addXYZ(vec.x, vec.y, vec.z)
    }

    subtractXYZ(x, y, z) {
        return this.addXYZ(-x, -y, -z)
    }

    subtractVec3d(vec) {
        return this.subtractXYZ(vec.x, vec.y, vec.z)
    }

    static ofCenter(vec) {
        return Vec3d.fromVec3i(vec).addXYZ(0.5, 0.5, 0.5)
    }

    static ofBottomCenter(vec) {
        return Vec3d.fromVec3i(vec).addXYZ(0.5, 0, 0.5)
    }
}