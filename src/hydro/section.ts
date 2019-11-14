import {
    V, formula, mul, div, add, root, pow, unit, acos, sub,
    condition, GE, LT, sin, Formula, FV, Variable,
} from "docx";
import { UNIT, CONST, solveByBisect, Calculation, Calculator } from "../common";


export abstract class Section extends Calculation {
    Q = V('Q').info('流量').unit(UNIT.m3_s);
    n = V('n').info('糙率');
    i = FV('i').info('底坡');
    A = V('A').info('过水断面面积').unit(UNIT.m2);
    R = V('R').info('过水断面水力半径').unit(UNIT.m);
    h = V('h').info('水深').unit(UNIT.m);
    v = V('v').info('流速').unit(UNIT.m_s);
    beta = V('β').info('深宽比');
    B = V('B').info('水面宽').unit(UNIT.m);
    Fr = V('Fr').info('弗劳德常数');

    setIndex(index: number) {
        this.Q.subs(index);
        this.n.subs(index);
        this.i.subs(index);
        this.A.subs(index);
        this.R.subs(index);
        this.h.subs(index);
        this.v.subs(index);
        this.beta.subs(index);
    }

    abstract hFormula: Formula;
    abstract AFormula: Formula;
    abstract RFormula: Formula;
    abstract BFormula: Formula;
    vFormula = formula(
        this.v,
        div(this.Q, this.A)
    );
    QFormula = formula(
        this.Q,
        mul(div(1, this.n), this.A, pow(this.R, div(2, 3)), pow(this.i, div(1, 2)))
    ).setLong();
    FrFormula = formula(
        this.Fr,
        div(mul(pow(this.Q, 2), this.B), mul(CONST.g, pow(this.A, 3)))
    );
    abstract set w(val: number);
    abstract get width();
}

export class Rect extends Section {
    b = V('b').info('矩形槽底宽').unit(UNIT.m);

    clone(){
        return this.cloneVarTo(new Rect());
    }

    setIndex(index: number) {
        super.setIndex(index);
        this.b.subs(index)
    }

    set w(val: number) {
        this.b.Value = val;
    }

    get width(){
        return this.b;
    }

    hFormula = formula(this.h, mul(this.beta, this.b))
    AFormula = formula(this.A, mul(this.b, this.h));
    RFormula = formula(this.R, div(mul(this.b, this.h), add(this.b, mul(2, this.h))));
    BFormula = formula(this.B, this.b);

}

export class Trape extends Section {
    b = V('b').info('梯形槽底宽').unit(UNIT.m);
    m = V('m').info('梯形边坡坡比');

    clone(){
        return this.cloneVarTo(new Trape());
    }

    setIndex(index: number) {
        super.setIndex(index);
        this.b.subs(index);
        this.b.subs(index);
    }

    set w(val: number) {
        this.b.Value = val;
    }

    get width(){
        return this.b;
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
    BFormula = formula(this.B, add(this.b, mul(2, this.m, this.h)));
}

export class UShell extends Section {
    r = V('r').info('U形槽内径').unit(UNIT.m);
    theta = V('θ').info('U形槽水面对应的圆心角').unit(unit('rad'));

    clone(){
        return this.cloneVarTo(new UShell());
    }

    setIndex(index: number) {
        super.setIndex(index);
        this.r.subs(index);
        this.theta.subs(index);
    }

    set w(val: number) {
        this.r.Value = val;
    }

    get width(){
        return this.r;
    }


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

export class Surmount extends Calculation {
    hs = V('h').subs('s').info('通过设计流量时的水深').unit(UNIT.m);
    hj = V('h').subs('j').info('通过加大流量时的水深').unit(UNIT.m);
    Hmin = V('H').info('槽内最小净高').unit(UNIT.m);
    Hj = V('H').unit(UNIT.m);
    t = V('t').info('拉杆高度').unit(UNIT.m);
    d = V('d').info('U形槽直径').unit(UNIT.m);
    H = V('H').info('槽内净高').unit(UNIT.m);

    clone(){
        return this.cloneVarTo(new Surmount());
    }

    HsRectFormula = formula(this.Hmin, add(this.hs, div(this.hs, 12), 0.05));
    HsUShellFormula = formula(this.Hmin, add(this.hs, div(this.d, 10)))
    HjFormula = formula(this.Hj, add(this.hj, this.t, 0.1))
}


export const FindH = {
    solve(sect: Section, Q: number) {
        if (sect instanceof UShell) {
            return solveByBisect(0.1, 10, 0.0001, (h) => {
                sect.h.Value = h;
                if (h < sect.r.Value) {
                    sect.thetaFormula.calc();
                }
                sect.AFormula.calc();
                sect.RFormula.calc();
                return Q - sect.QFormula.calc();
            })
        }
        return solveByBisect(0.1, 10, 0.0001, (h) => {
            sect.h.Value = h;
            sect.AFormula.calc();
            sect.RFormula.calc();
            return Q - sect.QFormula.calc();
        })
    },
    prc(sect: Section): Formula[]{
        const prcList: Formula[] = [];
        if (sect instanceof UShell && sect.h < sect.r) {
            prcList.push(sect.thetaFormula);
        }
        prcList.push(
            sect.AFormula,
            sect.RFormula,
            sect.QFormula
        )
        return prcList;
    },
    def(sect:Section): Formula[]{
        const defList : Formula[] = [];
        defList.push(
            sect.QFormula,
            sect.AFormula,
            sect.RFormula
        )
        if (sect instanceof UShell) {
            defList.push(sect.thetaFormula)
        }
        return defList;
    },
    vars(sect: Section): Variable[]{
        const varList: Variable[] = [];
        varList.push(sect.Q, sect.A, sect.R, sect.n, sect.i, sect.h)
        if (sect instanceof UShell) {
            varList.push(sect.r, sect.theta)
        } else if (sect instanceof Rect) {
            varList.push(sect.b)
        } else if (sect instanceof Trape) {
            varList.push(sect.b, sect.m)
        }
        return varList;
    }
}




export const FindW = {

    solve(sect: Section, Q: number, beta: number) {
        sect.beta.Value = beta;
        if (sect instanceof UShell) {
            return solveByBisect(0.1, 10, 0.0001, (w) => {
                sect.w = w;
                sect.hFormula.calc();
                if (sect.h.Value < sect.r.Value) {
                    sect.thetaFormula.calc();
                }
                sect.AFormula.calc();
                sect.RFormula.calc();
                return Q - sect.QFormula.calc();
            })
        }
        return solveByBisect(0.1, 10, 0.0001, (w) => {
            sect.w = w;
            sect.hFormula.calc();
            sect.AFormula.calc();
            sect.RFormula.calc();
            return Q - sect.QFormula.calc();
        })
    },
    prc(sect: Section){
        const prcList: Formula[] = [];
        prcList.push(sect.hFormula);

        if (sect instanceof UShell && sect.h < sect.r) {
            prcList.push(sect.thetaFormula);
        }
        prcList.push(
            sect.AFormula,
            sect.RFormula,
            sect.QFormula
        )
        return prcList;
    },
    def(sect: Section){
        const defList: Formula[] = [];
        defList.push(
            sect.QFormula,
            sect.AFormula,
            sect.RFormula
        )
        if (sect instanceof UShell) {
            defList.push(sect.thetaFormula)
        }
        defList.push(sect.hFormula);
        return defList;
    },

    vars(sect: Section){
        const varList: Variable[] = [];
        varList.push(sect.Q, sect.A, sect.R, sect.n, sect.i, sect.h, sect.beta)
        if (sect instanceof UShell) {
            varList.push(sect.r, sect.theta)
        } else if (sect instanceof Rect) {
            varList.push(sect.b)
        } else if (sect instanceof Trape) {
            varList.push(sect.b, sect.m)
        }
        return varList;
    }
}


export const FindSurmount = {
    solve(sur: Surmount, sects: Section, sectj: Section, t: number) {

        sur.hs.val(sects.h.Value);
        sur.hj.val(sectj.h.Value);
        sur.t.val(t);

        let Hs: number;
        if (sects instanceof UShell) {
            sur.d.val(sects.r.Value * 2);
            Hs = sur.HsUShellFormula.calc();
        } else {
            Hs = sur.HsRectFormula.calc();
        }
        const Hj = sur.HjFormula.calc();

        return [Hs, Hj]

    },
    prc( surmount: Surmount, sect: Section) {
        const prcList: Formula[] = [];
        if (sect instanceof UShell) {
            prcList.push(surmount.HsUShellFormula);
        } else {
            prcList.push(surmount.HsRectFormula);
        }
        prcList.push(surmount.HjFormula);
        return prcList;
    },
    def( surmount: Surmount, sect: Section) {
        const defList: Formula[] = [];
        if (sect instanceof UShell) {
            defList.push(surmount.HsUShellFormula);
        } else {
            defList.push(surmount.HsRectFormula);
        }
        defList.push(surmount.HjFormula);
        return defList;
    },
    vars(surmount: Surmount, sect: Section) {
        const varList: Variable[] =[];
        varList.push(
            surmount.Hmin,
            surmount.hs,
            surmount.hj
        )
        if (sect instanceof UShell) {
            varList.push(surmount.d);
        }
        return varList;
    },
}

export const FindHk = {
    solve(sect: Section, Q: number){
        sect.Q.val(Q);
        if (sect instanceof UShell) {
            return solveByBisect(0.1, 10, 0.0001, (h) => {
                sect.h.Value = h;
                if (h < sect.r.Value) {
                    sect.thetaFormula.calc();
                }
                sect.AFormula.calc();
                sect.BFormula.calc()
                return 1 - sect.FrFormula.calc();
            })
        }
        return solveByBisect(0.1, 10, 0.0001, (h) => {
            sect.h.Value = h;
            sect.AFormula.calc();
            sect.BFormula.calc();
            return 1 - sect.FrFormula.calc();
        })
    }
}