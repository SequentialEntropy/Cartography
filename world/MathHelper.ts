export class MathHelper {
    static SQUARE_ROOT_OF_TWO = Math.sqrt(2.0);
    static clamp(value: number, min: number, max: number) {
        return Math.min(Math.max(value, min), max)
    }
}