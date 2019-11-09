import { V, unit, pow, Expression, fdiv, Variable, DefinitionContent, DeclarationContent, ProcedureContent, Formula} from "docx";


export abstract class Calculator{
    private vars: Variable[] = []; // variable list for declaration
    private defs: Formula[] = []; // formula list for definition
    private prcs: Formula[] = []; // formula list for procedure

    protected abstract buildDef();
    protected abstract buildDcl();
    protected abstract buildPrc(index?: number);

    protected pushDef(...defs: Formula[]){
        this.defs.push(...defs);
    }

    protected pushDcl(...vars: Variable[]){
        this.vars.push(...vars);
    }

    protected pushPrc(...prcs: Formula[]){
        this.prcs.push(...prcs);
    }

    toDefCnt(): DefinitionContent{
        this.buildDef();
        const cnt = new DefinitionContent(...this.defs.map(m=>m.toDefinition()));
        this.defs = [];
        return cnt;
    }
    toDclCnt(): DeclarationContent{
        this.buildDcl();
        const cnt = new DeclarationContent(...this.vars.map(m=>m.toDeclaration()));
        this.vars = [];
        return cnt;
    }
    toPrcCnt(index?: number): ProcedureContent{
        this.buildPrc(index);
        const cnt = new ProcedureContent(...this.prcs.map(m=>m.toProcedure()));
        this.prcs = [];
        return cnt;
    }
}

export class Calculation{

}

export const UNIT: {[name: string]: Expression} = {
    m: unit('m'),
    m2 : pow(unit('m'), 2),
    m3 : pow(unit('m'), 3),
    m_s: fdiv(unit('m'), unit('s')),
    m_s2: fdiv(unit('m'), pow(unit('s'), 2)),
    m3_s: fdiv(pow(unit('m'), 3), unit('s'))
}

export const CONST: {[name: string]: Variable} = {
    pi: V('π').info('圆周率').val(Math.PI),
    g: V('g').info('重力加速度').unit(UNIT.m_s2).val(9.81)
}


export function solveByBisect( left, right, tolerance = 0.001, func: (x: number) => number): number {
    const MAX_ITER = 20;
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