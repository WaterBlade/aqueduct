import { Calculation, CONST, solveByBisect, Environment } from "../common";
import Unit from '../unit';
import { V, EQ, add, div, pow, mul, Relation, inv, abs, sub, formula, fdiv } from "docx";
import { SectionCalc, UShellCalc, RectCalc, TrapeCalc, SectionEnv } from "./section";

export class LineCalc extends Calculation {
    Q = V('Q').info('流量').unit(Unit.m3_s);
    L = V('L').subs('k-k+1').info('渠段长度').unit(Unit.m);
    ksi = V('ξ').subs('k-k+1').info('局部水头损失系数');
    J12 = V('J').subs('k-k+1').info('渠段内的平均水力坡降');
    n = V('n').subs('k-k+1').info('渠段糙率');
    z1 = V('z').subs('k').info('下游断面底板高程').unit(Unit.m);
    z2 = V('z').subs('k+1').info('上游断面底板高程').unit(Unit.m);
    h1 = V('h').subs('k').info('下游断面水深').unit(Unit.m);
    h2 = V('h').subs('k+1').info('上游断面水深').unit(Unit.m);
    R1 = V('R').subs('k').info('下游断面水力半径').unit(Unit.m);
    R2 = V('R').subs('k+1').info('上游断面水力半径').unit(Unit.m);
    A1 = V('A').subs('k').info('下游断面过水面积').unit(Unit.m2);
    A2 = V('A').subs('k+1').info('上游断面过水面积').unit(Unit.m2);
    hs = V('h').subs('s:k-k+1').info('局部水头损失').unit(Unit.m);
    hf = V('h').subs('f:k-k+1').info('沿程水头损失').unit(Unit.m);

    setIndex(i: number) {
        const k = `${i}`;
        const k1 = `${i + 1}`;
        const kk1 = `${i}-${i + 1}`;

        this.L.subs(kk1);
        this.ksi.subs(kk1);
        this.J12.subs(kk1);
        this.n.subs(kk1);
        this.z1.subs(k);
        this.z2.subs(k1);
        this.h1.subs(k);
        this.h2.subs(k1);
        this.R1.subs(k);
        this.R2.subs(k1);
        this.A1.subs(k);
        this.A2.subs(k1);
        this.hs.subs('s:' + kk1);
        this.hf.subs('f:' + kk1);

        this.down.h.subs(k);
        this.down.A.subs(k);
        this.down.R.subs(k);

        this.up.h.subs(k1);
        this.up.A.subs(k1);
        this.up.R.subs(k1);

    }

    EnergyEquation: Relation = EQ(
        add(
            this.z1,
            this.h1,
            div(
                pow(this.Q, 2),
                mul(2, CONST.g, pow(this.A1, 2))
            ),
            this.hs,
            this.hf
        ),
        add(
            this.z2,
            this.h2,
            div(
                pow(this.Q, 2),
                mul(2, CONST.g, pow(this.A2, 2))
            )
        ),
    ).setRightLong().setLeftLong();
    hsFormula = formula(
        this.hs,
        mul(
            this.ksi,
            inv(mul(2, CONST.g)),
            abs(
                sub(
                    div(pow(this.Q, 2), pow(this.A1, 2)),
                    div(pow(this.Q, 2), pow(this.A2, 2))
                )
            )
        )
    );
    hfFormula = formula(
        this.hf,
        mul(this.J12, this.L)
    );
    J12Formula = formula(
        this.J12,
        mul(
            div(mul(pow(this.Q, 2), pow(this.n, 2)), 2),
            add(
                div(1, mul(pow(this.A1, 2), pow(this.R1, fdiv(4, 3)))),
                div(1, mul(pow(this.A2, 2), pow(this.R2, fdiv(4, 3))))
            )
        )
    ).setLong();

    constructor(public down: SectionCalc, public up: SectionCalc) { super(); }

    calc(Q: number, h?: number) {
        const up = this.up;
        const down = this.down;
        if (h) {
            down.h.val(h);
            down.AFormula.calc();
            down.RFormula.calc();
        } else {
            down.calcH(Q);
        }

        this.Q.val(Q);
        this.h1.val(down.h.Value);
        this.R1.val(down.R.Value);
        this.A1.val(down.A.Value);

        up.Q.val(Q);
        const left = up.calcHk(Q);

        return solveByBisect(left + 0.0001, 10, 0.0001, (h) => {
            this.h2.val(h);
            up.h.val(h);

            this.R2.val(up.RFormula.calc());
            this.A2.val(up.AFormula.calc());

            this.J12Formula.calc();
            this.hsFormula.calc();
            this.hfFormula.calc();
            return this.EnergyEquation.Left.Value - this.EnergyEquation.Right.Value;
        })
    }
    defEq() {
        return [this.EnergyEquation]
    }
    defFml() {
        return [
            this.hsFormula,
            this.hfFormula,
            this.J12Formula
        ];
    }
    prcEq() {
        return [this.EnergyEquation]
    }
    prcFml() {
        return [
            this.J12Formula,
            this.hfFormula,
            this.hsFormula
        ]
    }
    prcUp() {
        return [
            this.up.AFormula,
            this.up.RFormula
        ]
    }
    prcDown() {
        return [
            this.down.AFormula,
            this.down.RFormula
        ]
    }
    dclEq() {
        return [
            this.z1,
            this.z2,
            this.h1,
            this.h2,
            this.Q,
            this.A1,
            this.A2,
            this.hs,
            this.hf
        ]
    }
    dclFml() {
        return [
            this.L,
            this.R1,
            this.R2,
            this.ksi,
            this.n,
            this.J12
        ]
    }
}


export class LineEnv extends Environment {
    L: number;
    n: number;
    ksi: number;
    z1: number;
    z2: number;
    h: number;
    constructor(public down: SectionEnv, public up: SectionEnv) { super(); }
    initCalc(calc: LineCalc) {
        calc.L.val(this.L);
        calc.n.val(this.n);
        calc.ksi.val(this.ksi);
        calc.z1.val(this.z1);
        calc.z2.val(this.z2);
        calc.down.h.val(this.h);
    }
    genCalc() {
        const calc = new LineCalc(this.down.genCalc(), this.up.genCalc());
        this.initCalc(calc);
        return calc;
    }

}

