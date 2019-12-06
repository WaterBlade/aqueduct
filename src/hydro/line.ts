import { Calculation, CONST, solveByBisect } from "../common";
import Unit from '../unit';
import { V, EQ, add, div, pow, mul, Relation, inv, abs, sub, formula, fdiv } from "docx";
import { Section, FindHk, UShell, Rect, Trape } from "./section";

export class Line extends Calculation {
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
}


export const FindLineH = {
    initLine(
        line: Line, 
        l: number, // 长度
        n: number, // 糙率
        ksi: number, // 局部水头损失系数
    ){
        line.L.val(l);
        line.n.val(n);
        line.ksi.val(ksi);
    },
    initUShell(
        sect: UShell,
        r: number, // 半径
    ){
        sect.r.val(r);
    },
    initRect(
        sect: Rect,
        b: number, // 底宽
    ){
        sect.b.val(b);
    },
    initTrap(
        sect: Trape,
        b: number, // 底宽
        m: number, // 坡比
    ){
        sect.b.val(b);
        sect.m.val(m)
    },
    solve(line: Line, down: Section, up: Section, Q: number) {
        line.Q.val(Q);
        up.Q.val(Q);

        const left = FindHk.solve(up, Q);

        return solveByBisect(left + 0.0001, 10, 0.0001, (h) => {
            line.h1.val(down.h.Value);
            line.h2.val(h);
            up.h.val(h);

            up.AFormula.calc();
            up.RFormula.calc();

            line.R1.val(up.R.Value);
            line.R2.val(down.R.Value);
            line.A1.val(up.A.Value);
            line.A2.val(down.A.Value);

            line.J12Formula.calc();
            line.hsFormula.calc();
            line.hfFormula.calc();
            return line.EnergyEquation.Left.Value - line.EnergyEquation.Right.Value;
        })
    },
    eqDef(line: Line){
        return [line.EnergyEquation]
    },
    fmlDef(line: Line){
        return [
            line.hsFormula,
            line.hfFormula,
            line.J12Formula
        ];
    },
    eqPrc(line: Line){
        return [line.EnergyEquation]
    },
    fmlPrc(line: Line){
        return [
            line.J12Formula,
            line.hfFormula,
            line.hsFormula
        ]
    },
    eqVars(line: Line){
        return [
            line.z1,
            line.z2,
            line.h1,
            line.h2,
            line.Q,
            line.A1,
            line.A2,
            line.hs,
            line.hf
        ]
    },
    fmlVars(line: Line){
        return [
            line.L,
            line.R1,
            line.R2,
            line.ksi,
            line.n,
            line.J12
        ]
    }
}