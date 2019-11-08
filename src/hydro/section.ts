import {
    V, formula, mul, div, add, root, pow, unit, acos, sub,
    condition, GE, LT, sin, Formula, FV
} from "docx";
import { UNIT, CONST, solveByBisect} from "../common";


export abstract class Section {
    Q = V('Q').info('流量').unit(UNIT.m3_s);
    n = V('n').info('糙率');
    i = FV('i').info('底坡');
    A = V('A').info('过水断面面积').unit(UNIT.m);
    R = V('R').info('过水断面水力半径').unit(UNIT.m);
    h = V('h').info('水深').unit(UNIT.m);
    v = V('v').info('流速').unit(UNIT.m_s);
    beta = V('β').info('深宽比');

    abstract hFormula: Formula;
    abstract AFormula: Formula;
    abstract RFormula: Formula;
    vFormula = formula(
        this.v,
        div(this.Q, this.A)
    )
    QFormula = formula(
        this.Q,
        mul(div(1, this.n), this.A, pow(this.R, div(2, 3)), pow(this.i, div(1, 2)))
    )

    abstract set w(val: number);

    abstract initFindH(...nums: number[]);
    abstract initFindW(...nums: number[]);

    findH(Q: number){
        return solveByBisect(0.1, 10, 0.001, (h)=>{
            this.h.Value = h;
            this.AFormula.calc();
            this.RFormula.calc();
            return Q - this.QFormula.calc();
        })
    }

    findW(Q: number, beta: number){
        this.beta.Value = beta;
        return solveByBisect(0.1, 10, 0.001, (w)=>{
            this.w = w;
            this.hFormula.calc();
            this.AFormula.calc();
            this.RFormula.calc();
            return Q - this.QFormula.calc();
        })
    }
}

export class Rect extends Section {
    b = V('b').info('矩形槽底宽').unit(UNIT.m);

    set w(val: number){
        this.b.Value = val;
    }

    initFindH(b: number){
        this.b.val(b);
    }

    initFindW(){}


    hFormula = formula(this.h, mul(this.beta, this.b))
    AFormula = formula(this.A, mul(this.b, this.h));
    RFormula = formula(this.R, div(mul(this.b, this.h), add(this.b, mul(2, this.h))));

}

export class Trape extends Section {
    b = V('b').info('梯形槽底宽').unit(UNIT.m);
    m = V('m').info('梯形边坡坡比');

    set w(val: number){
        this.b.Value = val;
    }

    initFindH(b: number, m: number){
        this.b.val(b);
        this.m.val(m);
    }

    initFindW(m: number){
        this.m.val(m);
    }

    hFormula = formula(this.h, mul(this.beta, this.b))
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
}

export class UShell extends Section {
    r = V('r').info('U形槽内径').unit(UNIT.m);
    theta = V('θ').info('U形槽水面对应的圆心角').unit(unit('rad'));

    set w(val: number){
        this.r.Value = val;
    }

    initFindH(r: number){
        this.r.val(r);
    }

    initFindW(){}

    hFormula = formula(this.h, mul(2, this.beta, this.r));
    thetaFormula = formula(this.theta, mul(2, acos(div(sub(this.r, this.h), this.r))));
    AFormula = condition(
        this.A,
        [
            GE(this.h, this.r),
            add(
                mul(div(1, 2), CONST.pi, pow(this.r, 2)),
                mul(2, this.r, sub(this.h, this.r))
            )

        ],
        [
            LT(this.h, this.r),
            mul(div(1, 2), pow(this.r, 2), sub(this.theta, sin(this.theta)))
        ]
    )
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
                        add(mul(CONST.pi, this.r), mul(2, sub(this.h, this.r)))
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
    )

    findH(Q: number){
        return solveByBisect(0.1, 10, 0.001, (h)=>{
            this.h.Value = h;
            if(h<this.r.Value){
                this.thetaFormula.calc();
            }
            this.AFormula.calc();
            this.RFormula.calc();
            return Q - this.QFormula.calc();
        })
    }

    findW(Q: number, beta: number){
        this.beta.Value = beta;
        return solveByBisect(0.1, 10, 0.001, (w)=>{
            this.w = w;
            this.hFormula.calc();
            if(this.h.Value<this.r.Value){
                this.thetaFormula.calc();
            }
            this.AFormula.calc();
            this.RFormula.calc();
            return Q - this.QFormula.calc();
        })
    }
}