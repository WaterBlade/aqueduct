import {
    V, formula, mul, div, add, root, pow, unit, acos, sub,
    condition, GE, LT, sin, Formula, FV, Variable,
} from "docx";
import { CONST, solveByBisect, Calculation, Solver } from "../common";
import Unit from '../unit';


export abstract class Section extends Calculation {
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
    abstract get width(): Variable;
}

class QCalc extends Calculation {
    Q = V('Q').info('流量').unit(Unit.m3_s);
    n = V('n').info('糙率');
    i = FV('i').info('底坡');
    A = V('A').info('过水断面面积').unit(Unit.m2);
    R = V('R').info('过水断面水力半径').unit(Unit.m);
    h = V('h').info('水深').unit(Unit.m);
    get QFormula() {
        return formula(
            this.Q,
            mul(div(1, this.n), this.A, pow(this.R, div(2, 3)), pow(this.i, div(1, 2)))
        ).setLong();
    }
}

class FlowCalculator {
    constructor(
        public Q: Variable,
        public n: Variable,
        public i: Variable,
        public A: Variable,
        public R: Variable,
        public h: Variable
    ){}
    get QFormula() {
        return formula(
            this.Q,
            mul(div(1, this.n), this.A, pow(this.R, div(2, 3)), pow(this.i, div(1, 2)))
        ).setLong();
    }
}

class RectCalculator {
    constructor(
        public b: Variable,
        public h: Variable,
        public A: Variable,
        public R: Variable,
    ) { }
    get AFormula() {
        return formula(this.A, mul(this.b, this.h));
    }
    get RFormula(){
        return formula(this.R, div(mul(this.b, this.h), add(this.b, mul(2, this.h))));
    }
    calc() {
        this.AFormula.calc();
        this.RFormula.calc();
    }
}

export class Rect extends Section {
    b = V('b').info('矩形槽底宽').unit(Unit.m);

    get width() {
        return this.b;
    }

    hFormula = formula(this.h, mul(this.beta, this.b))
    AFormula = formula(this.A, mul(this.b, this.h));
    RFormula = formula(this.R, div(mul(this.b, this.h), add(this.b, mul(2, this.h))));
    BFormula = formula(this.B, this.b);

}

export class Trape extends Section {
    b = V('b').info('梯形槽底宽').unit(Unit.m);
    m = V('m').info('梯形边坡坡比');

    get width() {
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
    r = V('r').info('U形槽内径').unit(Unit.m);
    theta = V('θ').info('U形槽水面对应的圆心角').unit(unit('rad'));

    get width() {
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
    hs = V('h').subs('s').info('通过设计流量时的水深').unit(Unit.m);
    hj = V('h').subs('j').info('通过加大流量时的水深').unit(Unit.m);
    Hmin = V('H').info('槽内最小净高').unit(Unit.m);
    Hj = V('H').unit(Unit.m);
    t = V('t').info('拉杆高度').unit(Unit.m);
    d = V('d').info('U形槽直径').unit(Unit.m);
    H = V('H').info('槽内净高').unit(Unit.m);

    sectType: 'ushell' | 'rect';

    HjFormula = formula(this.Hj, add(this.hj, this.t, 0.1));
    get HsFormula() {
        if (this.sectType === 'ushell') {
            return formula(this.Hmin, add(this.hs, div(this.d, 10)))
        } else {
            return formula(this.Hmin, add(this.hs, div(this.hs, 12), 0.05));
        }
    }
}


export const FindH = {
    initUshell(sect: UShell, n: number, iDen: number, r: number) {
        sect.n.val(n);
        sect.i.den(iDen);
        sect.r.val(r);
    },
    initRect(sect: Rect, n: number, iDen: number, b: number) {
        sect.n.val(n);
        sect.i.den(iDen);
        sect.b.val(b);
    },
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
    prc(sect: Section): Formula[] {
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
    def(sect: Section): Formula[] {
        const defList: Formula[] = [];
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
    vars(sect: Section): Variable[] {
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
    init(sect: Section, n: number, iDen: number) {
        sect.n.val(n);
        sect.i.den(iDen);
    },
    solve(sect: Section, Q: number, beta: number) {
        sect.beta.Value = beta;
        if (sect instanceof UShell) {
            return solveByBisect(0.1, 10, 0.0001, (w) => {
                sect.width.val(w);
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
            sect.width.val(w);
            sect.hFormula.calc();
            sect.AFormula.calc();
            sect.RFormula.calc();
            return Q - sect.QFormula.calc();
        })
    },
    prc(sect: Section) {
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
    def(sect: Section) {
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

    vars(sect: Section) {
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
    init(sur: Surmount, hs: number, hj: number, sectType: 'ushell' | 'rect') {
        sur.hs.val(hs);
        sur.hj.val(hj);
        sur.sectType = sectType;
    },
    solve(sur: Surmount, t: number) {
        sur.t.val(t);
        return [
            sur.HsFormula.calc(),
            sur.HjFormula.calc()
        ]
    },
    prc(surmount: Surmount) {
        return [
            surmount.HsFormula,
            surmount.HjFormula
        ]
    },
    def(surmount: Surmount) {
        return [
            surmount.HsFormula,
            surmount.HjFormula
        ]
    },
    vars(surmount: Surmount) {
        const varList: Variable[] = [];
        varList.push(
            surmount.Hmin,
            surmount.hs,
            surmount.hj
        )
        if (surmount.sectType === 'ushell') {
            varList.push(surmount.d);
        }
        return varList;
    },
}

export const FindHk = {
    solve(sect: Section, Q: number) {
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