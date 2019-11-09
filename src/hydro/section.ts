import {
    V, formula, mul, div, add, root, pow, unit, acos, sub,
    condition, GE, LT, sin, Formula, FV,
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
    vFormula = formula(
        this.v,
        div(this.Q, this.A)
    )
    QFormula = formula(
        this.Q,
        mul(div(1, this.n), this.A, pow(this.R, div(2, 3)), pow(this.i, div(1, 2)))
    ).setLong()

    abstract set w(val: number);
}

export class Rect extends Section {
    b = V('b').info('矩形槽底宽').unit(UNIT.m);

    setIndex(index: number) {
        super.setIndex(index);
        this.b.subs(index)
    }

    set w(val: number) {
        this.b.Value = val;
    }

    hFormula = formula(this.h, mul(this.beta, this.b))
    AFormula = formula(this.A, mul(this.b, this.h));
    RFormula = formula(this.R, div(mul(this.b, this.h), add(this.b, mul(2, this.h))));

}

export class Trape extends Section {
    b = V('b').info('梯形槽底宽').unit(UNIT.m);
    m = V('m').info('梯形边坡坡比');

    setIndex(index: number) {
        super.setIndex(index);
        this.b.subs(index);
        this.b.subs(index);
    }

    set w(val: number) {
        this.b.Value = val;
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

    setIndex(index: number) {
        super.setIndex(index);
        this.r.subs(index);
        this.theta.subs(index);
    }

    set w(val: number) {
        this.r.Value = val;
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
}

export class Surmount extends Calculation {
    hs = V('h').subs('s').info('通过设计流量时的水深').unit(UNIT.m);
    hj = V('h').subs('j').info('通过加大流量时的水深').unit(UNIT.m);
    H = V('H').info('槽内最小净高').unit(UNIT.m);
    Hj = V('H').unit(UNIT.m);
    t = V('t').info('拉杆高度').unit(UNIT.m);
    d = V('d').info('U形槽直径').unit(UNIT.m);

    HsRectFormula = formula(this.H, add(this.hs, div(this.hs, 12), 0.05));
    HsUShellFormula = formula(this.H, add(this.hs, div(this.d, 10)))
    HjFormula = formula(this.Hj, add(this.hj, this.t, 0.1))
}


export class FindH extends Calculator {
    constructor(public sect: Section) { super() }

    findH(Q: number) {
        const sect = this.sect;
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
    }

    protected buildDef() {
        const sect = this.sect;
        this.pushDef(
            sect.QFormula,
            sect.AFormula,
            sect.RFormula
        )
        if (sect instanceof UShell) {
            this.pushDef(sect.thetaFormula)
        }
    }

    protected buildDcl() {
        const sect = this.sect;
        this.pushDcl(sect.Q, sect.A, sect.R, sect.n, sect.i, sect.h)
        if (sect instanceof UShell) {
            this.pushDcl(sect.r, sect.theta)
        } else if (sect instanceof Rect) {
            this.pushDcl(sect.b)
        } else if (sect instanceof Trape) {
            this.pushDcl(sect.b, sect.m)
        }
    }

    protected buildPrc(index?: number) {
        const sect = this.sect;
        if (index !== undefined) {
            sect.setIndex(index)
        }
        if (sect instanceof UShell && sect.h < sect.r) {
            this.pushPrc(sect.thetaFormula);
        }
        this.pushPrc(
            sect.AFormula,
            sect.RFormula,
            sect.QFormula
        )
    }
}

export class FindW extends Calculator {
    constructor(public sect: Section) { super() }

    findW(Q: number, beta: number) {
        const sect = this.sect;
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
    }

    getVar() {
        if (this.sect instanceof UShell) {
            return V('r').val(this.sect.r.Value).unit(UNIT.m);
        } else if (this.sect instanceof Rect) {
            return V('b').val(this.sect.b.Value).unit(UNIT.m);
        } else {
            throw Error;
        }
    }

    protected buildDef() {
        const sect = this.sect;
        this.pushDef(
            sect.QFormula,
            sect.AFormula,
            sect.RFormula
        )
        if (sect instanceof UShell) {
            this.pushDef(sect.thetaFormula)
        }
        this.pushDef(sect.hFormula);
    }

    protected buildDcl() {
        const sect = this.sect;
        this.pushDcl(sect.Q, sect.A, sect.R, sect.n, sect.i, sect.h, sect.beta)
        if (sect instanceof UShell) {
            this.pushDcl(sect.r, sect.theta)
        } else if (sect instanceof Rect) {
            this.pushDcl(sect.b)
        } else if (sect instanceof Trape) {
            this.pushDcl(sect.b, sect.m)
        }
    }

    protected buildPrc(index?: number) {
        const sect = this.sect;
        if (index !== undefined) {
            sect.setIndex(index);
        }

        this.pushPrc(sect.hFormula);

        if (sect instanceof UShell && sect.h < sect.r) {
            this.pushPrc(sect.thetaFormula);
        }
        this.pushPrc(
            sect.AFormula,
            sect.RFormula,
            sect.QFormula
        )
    }
}


export class FindSurmount extends Calculator {
    surmount = new Surmount();
    constructor(public sect: Section) {
        super();
    }
    buildDef() {
        if (this.sect instanceof UShell) {
            this.pushDef(this.surmount.HsUShellFormula);
        } else {
            this.pushDef(this.surmount.HsRectFormula);
        }
        this.pushDef(this.surmount.HjFormula);
    }
    buildDcl() {
        this.pushDcl(
            this.surmount.H,
            this.surmount.hs,
            this.surmount.hj
        )
        if (this.sect instanceof UShell) {
            this.pushDcl(this.surmount.d);
        }
    }
    buildPrc() {
        if (this.sect instanceof UShell) {
            this.pushPrc(this.surmount.HsUShellFormula);
        } else {
            this.pushPrc(this.surmount.HsRectFormula);
        }
        this.pushPrc(this.surmount.HjFormula);
    }

    findSurmount(hs: number, hj: number, t: number) {
        const sur = this.surmount;
        const sect = this.sect;

        sur.hs.val(hs);
        sur.hj.val(hj);
        sur.t.val(t);

        let Hs: number;
        if (sect instanceof UShell) {
            sur.d.val(sect.r.Value * 2);
            Hs = sur.HsUShellFormula.calc();
        } else {
            Hs = sur.HsRectFormula.calc();
        }
        const Hj = sur.HjFormula.calc();

        return [Hs, Hj]

    }
}