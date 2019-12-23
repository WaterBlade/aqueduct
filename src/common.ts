export abstract class Environment{
}

export abstract class Calculation{
}

export function solveByBisect( left, right, tolerance = 0.001, func: (x: number) => number): number {
    const MAX_ITER = 25;
    let iterCount = 0;
    let lRes = func(left);
    let rRes = func(right);
    if (rRes * lRes > 0) { throw Error('Cannot solve: left and right has same sign') }
    let mid = (left + right) / 2;
    let midRes = func(mid);
    while (Math.abs(midRes) > tolerance) {

        if(iterCount > MAX_ITER){throw Error('solve by bisect has reached its max iter limit');}
        iterCount++;

        if (midRes * lRes > 0) {
            left = mid
        } else {
            right = mid
        }
        mid = (left + right) / 2;
        midRes = func(mid);
    }
    return mid;
}