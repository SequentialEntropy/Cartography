export class MathHelper {
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
}
MathHelper.SQUARE_ROOT_OF_TWO = Math.sqrt(2.0);
