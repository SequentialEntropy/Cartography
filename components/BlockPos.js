import { Vec3d } from "./Vec3d.js";
import { Vec3i } from "./Vec3i.js";

export class BlockPos extends Vec3i {
    constructor(i, j, k) {
		super(i, j, k)
	}

    toCenterPos() {
		return Vec3d.ofCenter(this);
	}

    toBottomCenterPos() {
		return Vec3d.ofBottomCenter(this);
	}

    static ofFloored(pos) {
        return new BlockPos(Math.floor(pos.getX()), Math.floor(pos.getY()), Math.floor(pos.getZ()))
    }
}