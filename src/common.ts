import { V, unit, pow, Expression, fdiv, Variable,  Formula} from "docx";


export abstract class Solver{
}

export abstract class Calculation{
}

export const Unit: {[name: string]: Expression} = {
    m: unit('m'),
    m2 : pow(unit('m'), 2),
    m3 : pow(unit('m'), 3),
    m_s: fdiv(unit('m'), unit('s')),
    m_s2: fdiv(unit('m'), pow(unit('s'), 2)),
    m3_s: fdiv(pow(unit('m'), 3), unit('s'))
}

export const CONST: {[name: string]: Variable} = {
    pi: V('π').info('圆周率').val(Math.PI),
    g: V('g').info('重力加速度').unit(Unit.m_s2).val(9.81)
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