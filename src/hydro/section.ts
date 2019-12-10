import {
    V, formula, mul, div, add, root, pow, unit, acos, sub,
    condition, GE, LT, sin, Formula, FV, Variable, Relation, LE,
} from "docx";
import { solveByBisect, Calculation, Environment } from "../common";
import Unit from '../unit';
import Const from '../constVariable';

export abstract class SectionCalc extends Calculation {
    // ========== 
    // 变量
    Q = V('Q').info('流量').unit(Unit.m3_s);
    n = V('n').info('糙率');
    i = FV('i').info('底坡');
    A = V('A').info('过水断面面积').unit(Unit.m2);
    R = V('R').info('过水断面水力半径').unit(Unit.m);
    h = V('h').info('水深').unit(Unit.m);
    v = V('v').info('流速').unit(Unit.m_s);
    beta = V('β').info('深宽比');
    B = V('B').info('水面宽').unit(Unit.m);
    Fr = V('Fr').info('弗劳德常数');
    h0 = V('h').subs(0).info('计算水深').unit(Unit.m);
    rised: boolean = false;

    // 截面宽度变量
    abstract get width(): Variable;

    // ========== 
    // 计算式
    // 流速计算式
    vFormula = formula(this.v, div(this.Q, this.A));
    // 流量计算式
    QFormula = formula(
        this.Q,
        mul(div(1, this.n), this.A, pow(this.R, div(2, 3)), pow(this.i, div(1, 2)))
    ).setLong();
    // 弗劳德数计算式
    FrFormula = formula(
        this.Fr,
        div(mul(pow(this.Q, 2), this.B), mul(Const.g, pow(this.A, 3)))
    );
    // 深宽比计算式
    abstract hFormula: Formula;
    // 过水断面面积计算式
    abstract AFormula: Formula;
    // 过水断面水力半径计算式
    abstract RFormula: Formula;
    // 过水断面水面宽计算式
    abstract BFormula: Formula;
    // 断面壅高验算式
    hEquation: Relation = LE(this.h0, mul(1.03, this.h));

    protected ARCalc(){
        this.AFormula.calc();
        this.RFormula.calc();
    }
    protected abstract ARDcl(): Variable[];
    protected ARDef(){ return [this.AFormula, this.RFormula]; }
    protected ARPrc(){ return [this.AFormula, this.RFormula]; }

    // 计算功能
    // 3 计算正常水深
    calcH(Q: number) {
        return solveByBisect(0.1, 10, 0.0001, (h) => {
            this.h.val(h);
            this.ARCalc();
            this.QFormula.calc();
            return Q - this.Q.Value;
        })
    }
    defH(){
        return [this.QFormula, ...this.ARDef()]
    }
    dclH(){
        return [this.Q, this.n, this.i, this.A, this.R, this.h,...this.ARDcl()];
    }
    prcH(){
        return [...this.ARPrc(), this.QFormula]
    }
    // 4 计算宽度
    calcW(Q: number, ratio: number){
        this.beta.val(ratio);
        return solveByBisect(0.1, 10, 0.0001, (w)=>{
            this.width.val(w);
            this.hFormula.calc();
            this.ARCalc();
            this.QFormula.calc();
            return Q - this.Q.Value;
        })
    }
    dclW(){
        return [...this.dclH(), this.beta];
    }
    prcW(){
        return [this.hFormula, ...this.prcH()];
    }
    // 5 计算临界水深
    calcHk(Q: number){
        this.Q.val(Q);
        return solveByBisect(0.1, 10, 0.0001, (h) => {
            this.h.val(h);
            this.ARCalc();
            this.BFormula.calc();
            return 1 - this.FrFormula.calc();
        })
    }
    // 6 验算壅高
    checkRise(h0: number){
        this.h0.val(h0);
        this.rised =  !this.hEquation.calc();
        return this.rised
    }
    defRise(){
        return [this.hEquation];
    }
    dclRise(){
        return [this.h0];
    }
    prcRise(){
        return [this.hEquation];
    }
}

export class TrapeCalc extends SectionCalc {
    b = V('b').info('梯形槽底宽').unit(Unit.m);
    m = V('m').info('梯形边坡坡比');

    get width() { return this.b; }
    protected ARDcl(){return [this.b, this.m];}

    hFormula = formula(this.h, mul(this.beta, this.b));
    AFormula = formula(this.A, mul(add(this.b, mul(this.m, this.h)), this.h));
    RFormula = formula(this.R, div(
        mul(
            add(this.b, mul(this.m, this.h)),
            this.h
        ),
        add(
            this.b,
            mul(2, this.h, root(add(1, pow(this.m, 2)), 2))
        )
    ))
    BFormula = formula(this.B, add(this.b, mul(2, this.m, this.h)));

}


export class RectCalc extends SectionCalc {
    b = V('b').info('矩形槽底宽').unit(Unit.m);

    get width() {
        return this.b;
    }
    protected ARDcl(){return [this.b];}

    hFormula = formula(this.h, mul(this.beta, this.b))
    AFormula = formula(this.A, mul(this.b, this.h));
    RFormula = formula(this.R, div(mul(this.b, this.h), add(this.b, mul(2, this.h))));
    BFormula = formula(this.B, this.b);

}

export class UShellCalc extends SectionCalc {
    r = V('r').info('U形槽内径').unit(Unit.m);
    theta = V('θ').info('U形槽水面对应的圆心角').unit(unit('rad'));

    get width() { return this.r; }
    protected ARDcl(){return [this.r, this.theta];}
    protected ARDef(){
        return [
            this.AFormula,
            this.RFormula,
            this.thetaFormula
        ]
    }
    protected ARPrc(){
        const prc = super.ARPrc();
        if(this.h.Value < this.r.Value){
            prc.push(this.thetaFormula);
        }
        return prc;
    }
    ARCalc(){
        if(this.h.Value < this.r.Value){
            this.thetaFormula.calc();
        }
        return [this.AFormula.calc(), this.RFormula.calc()]
    }

    hFormula = formula(this.h, mul(2, this.beta, this.r));
    thetaFormula = formula(this.theta, mul(2, acos(div(sub(this.r, this.h), this.r))));
    AFormula = condition(
        this.A,
        [
            GE(this.h, this.r),
            add(
                mul(div(1, 2), Const.pi, pow(this.r, 2)),
                mul(2, this.r, sub(this.h, this.r))
            )

        ],
        [
            LT(this.h, this.r),
            mul(div(1, 2), pow(this.r, 2), sub(this.theta, sin(this.theta)))
        ]
    ).setLong();
    RFormula = condition(
        this.R,
        [
            GE(this.h, this.r),
            mul(
                div(this.r, 2),
                add(
                    1,
                    div(
                        mul(2, sub(this.h, this.r)),
                        add(mul(Const.pi, this.r), mul(2, sub(this.h, this.r)))
                    )
                )
            )
        ],
        [
            LT(this.h, this.r),
            mul(
                div(this.r, 2),
                sub(1, div(sin(this.theta), this.theta))
            )
        ]
    ).setLong();
    BFormula = condition(
        this.B,
        [
            GE(this.h, this.r),
            mul(2, this.r)
        ],
        [
            LT(this.h, this.r),
            mul(2, root(sub(pow(this.r, 2), pow(sub(this.r, this.h), 2)), 2))
        ]
    );
    
}

export abstract class SectionEnv extends Environment {
    n: number;
    iDen: number;
    ratio: number[];
    abstract set width(value: number);
    abstract genCalc();
    initCalc(calc: SectionCalc){
        if(this.n) calc.n.val(this.n);
        if(this.iDen) calc.i.den(this.iDen);
    }
}

export class RectEnv extends SectionEnv{
    b: number;
    set width(value: number){this.b = value;}
    genCalc(){
        const calc = new RectCalc();
        this.initCalc(calc);
        return calc;
    }
    initCalc(calc: RectCalc){
        super.initCalc(calc);
        if(this.b) calc.b.val(this.b);
    }
}

export class TrapeEnv extends SectionEnv{
    b: number;
    m: number;
    set width(value: number){this.b = value;}
    genCalc(){
        const calc = new TrapeCalc();
        this.initCalc(calc);
        return calc;
    }
    initCalc(calc: TrapeCalc){
        super.initCalc(calc);
        if(this.b) calc.b.val(this.b);
        if(this.m) calc.m.val(this.m);
    }
}

export class UShellEnv extends SectionEnv{
    r: number;
    set width(value: number){this.r = value;}
    genCalc(){
        const calc = new UShellCalc();
        this.initCalc(calc);
        return calc;
    }
    initCalc(calc: UShellCalc){
        super.initCalc(calc);
        if(this.r) calc.r.val(this.r);
    }
}