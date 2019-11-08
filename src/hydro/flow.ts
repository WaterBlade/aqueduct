import { V,  FV, formula, add, mul, sub, pow, inv, minus, div, fdiv } from "docx";
import { UNIT, CONST } from "../common";
import { Section } from "./section";

export class Flow{
    // 整体参数
    Q = V('Q').info('过流量').unit(UNIT.m3_s);
    i = FV('i').info('槽身坡降');
    DZ = V('ΔZ').info('渡槽总水头损失').unit(UNIT.m);

    // 流速
    v1 = V('ν').subs('1').info('进口渐变段上游渠道断面平均流速').unit(UNIT.m_s);
    v = V('ν').info('槽身断面平均流速').unit(UNIT.m_s);
    v2 = V('ν').subs('2').info('出口渐变段上游渠道断面平均流速').unit(UNIT.m_s)
    // 面积
    A1 = V('A').subs('1').info('进口渐变段上游渠道断面过水面积').unit(UNIT.m2);
    A2 = V('A').subs('2').info('槽身过水断面面积').unit(UNIT.m2);
    A3 = V('A').subs('3').info('出口渐变段上游渠道断面过水面积').unit(UNIT.m2)
    // 水力半径
    R1 = V('R').subs('1').info('进口渐变段上游渠道断面水力半径').unit(UNIT.m);
    R2 = V('R').subs('2').info('槽身过水断面水力半径').unit(UNIT.m);
    R3 = V('R').subs('3').info('出口渐变段上游渠道断面水力半径').unit(UNIT.m)
    // 长度
    L1 = V('L').subs('1').info('进口段长度').unit(UNIT.m);
    L = V('L').info('槽身长度').unit(UNIT.m)
    L2 = V('L').subs('2').info('出口段长度').unit(UNIT.m);
    // 水深
    h1 = V('h').subs('1').info('通过设计流量时上游渠道水深').unit(UNIT.m);
    h = V('h').info('通过设计流量时槽内水深').unit(UNIT.m);
    h2 = V('h').subs(2).info('通过设计流量时下游渠道水深').unit(UNIT.m);
    // 局部水头损失系数
    ksi1 = V('ξ').subs('1').info('进口段局部水头损失系数');
    ksi2 = V('ξ').subs('2').info('出口段局部水头损失系数');
    // 平均水力坡降
    J12 = V('J').subs('1-2').info('进口段的平均水力坡降');
    J23 = V('J').subs('2-3').info('出口段的平均水力坡降');
    // 糙率
    n1 = V('n').subs('1').info('进口渐变段糙率').prec(3);
    n2 = V('n').subs('2').info('出口渐变段糙率').prec(3)
    // 水面变化
    Z1 = V('Z').subs('1').info('进口水面降落值').unit(UNIT.m);
    Z2 = V('Z').subs('2').info('槽身段水面降落值').unit(UNIT.m);
    Z3 = V('Z').subs('3').info('出口水面降落值').unit(UNIT.m);
    // 底板高程
    N1 = V('▽').subs(1).info('渡槽进口槽身底板高程').unit(UNIT.m);
    N2 = V('▽').subs(2).info('渡槽出口槽身底板高程').unit(UNIT.m);
    N3 = V('▽').subs(3).info('渡槽进口渐变段上游渠底高程').unit(UNIT.m);
    N4 = V('▽').subs(4).info('渡槽出口渐变段下游渠底高程').unit(UNIT.m);

    // 水面变化计算式
    Z1Formula = formula(
        this.Z1,
        add(
            mul(
                add(1, this.ksi1),
                sub(pow(this.v, 2), pow(this.v1, 2)),
                inv(mul(2, CONST.g))
            ),
            mul(this.J12, this.L1)
        )
    );
    Z2Formula = formula(
        this.Z2,
        mul(this.i, this.L)
    );
    Z3Formula = formula(
        this.Z3,
        sub(
            mul(
                sub(1, this.ksi2),
                sub(pow(this.v, 2), pow(this.v2, 2)),
                inv(mul(2, CONST.g))
            ),
            mul(this.J23, this.L2)
        )
    );
    DZFormula = formula(
        this.DZ,
        add(this.Z1, this.Z2, minus(this.Z3))
    );
    // 平均水力坡降计算式
    J12Formula = formula(
        this.J12,
        mul(
            div(pow(this.Q, 2), pow(this.n1, 2), 2),
            add(
                div(1, mul(pow(this.A1, 2), pow(this.R1, fdiv(4, 3)))),
                div(1, mul(pow(this.A2, 2), pow(this.R2, fdiv(4, 3))))
            )
        )
    )
    J23Formula = formula(
        this.J23,
        mul(
            div(pow(this.Q, 2), pow(this.n2, 2), 2),
            add(
                div(1, mul(pow(this.A2, 2), pow(this.R2, fdiv(4, 3)))),
                div(1, mul(pow(this.A3, 2), pow(this.R3, fdiv(4, 3))))
            )
        )
    )

    // 底板高程计算式
    N1Formula = formula(
        this.N1,
        add(this.N3, this.h1, minus(this.Z1), minus(this.h))
    );
    N2Formula = formula(
        this.N2,
        sub(this.N1, mul(this.i, this.L))
    );
    N4Formula = formula(
        this.N4,
        add(this.N2, this.h, this.Z3, minus(this.h2))
    )

    // 进口断面、槽身断面、出口断面
    upstream: Section;
    flume: Section
    downstream: Section;

    initCalc(
        iDen: number, L1: number, L: number, L2: number,
        n1: number, n2: number, k1: number, k2: number, N3: number
    ){
        this.i.den(iDen);
        this.L1.val(L1);
        this.L.val(L);
        this.L2.val(L2);
        this.n1.val(n1);
        this.n2.val(n2);
        this.ksi1.val(k1);
        this.ksi2.val(k2);
        this.N3.val(N3);
    }

    calc(Q: number){
        const up = this.upstream;
        const flume = this.flume;
        const down = this.downstream;

        this.h1.val(up.findH(Q));
        this.h.val(flume.findH(Q));
        this.h2.val(down.findH(Q));

        this.v1.val(up.vFormula.calc());
        this.v.val(flume.vFormula.calc());
        this.v2.val(down.vFormula.calc());

        this.A1.val(up.A.Value);
        this.A2.val(flume.A.Value);
        this.A3.val(down.A.Value);

        this.R1.val(up.R.Value);
        this.R2.val(flume.R.Value);
        this.R3.val(down.R.Value);

        this.J12Formula.calc();
        this.J23Formula.calc();

        this.Z1Formula.calc();
        this.Z2Formula.calc();
        this.Z3Formula.calc();
        this.DZFormula.calc();

        this.N1Formula.calc();
        this.N2Formula.calc();
        this.N4Formula.calc();

        

    }

}