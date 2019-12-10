import { V,  FV, formula, add, mul, sub, pow, inv, minus, div, fdiv, Variable, Formula } from "docx";
import { Calculation, Environment } from "../common";
import Unit from '../unit';
import Const from '../constVariable';
import { SectionCalc, SectionEnv, TrapeCalc, RectCalc, UShellCalc, TrapeEnv, RectEnv, UShellEnv} from "./section";

export class FloorCalc extends Calculation{
    // 整体参数
    Q = V('Q').info('过流量').unit(Unit.m3_s);
    i = FV('i').info('槽身坡降');
    DZ = V('ΔZ').info('渡槽总水面变化').unit(Unit.m);

    // 流速
    v1 = V('ν').subs('1').info('进口渐变段上游渠道断面平均流速').unit(Unit.m_s);
    v = V('ν').info('槽身断面平均流速').unit(Unit.m_s);
    v2 = V('ν').subs('2').info('出口渐变段上游渠道断面平均流速').unit(Unit.m_s)
    // 面积
    A1 = V('A').subs('1').info('进口渐变段上游渠道断面过水面积').unit(Unit.m2);
    A2 = V('A').subs('2').info('槽身过水断面面积').unit(Unit.m2);
    A3 = V('A').subs('3').info('出口渐变段上游渠道断面过水面积').unit(Unit.m2)
    // 水力半径
    R1 = V('R').subs('1').info('进口渐变段上游渠道断面水力半径').unit(Unit.m);
    R2 = V('R').subs('2').info('槽身过水断面水力半径').unit(Unit.m);
    R3 = V('R').subs('3').info('出口渐变段上游渠道断面水力半径').unit(Unit.m)
    // 长度
    L1 = V('L').subs('1').info('进口段长度').unit(Unit.m);
    L = V('L').info('槽身长度').unit(Unit.m)
    L2 = V('L').subs('2').info('出口段长度').unit(Unit.m);
    // 水深
    h1 = V('h').subs('1').info('通过设计流量时上游渠道水深').unit(Unit.m);
    h = V('h').info('通过设计流量时槽内水深').unit(Unit.m);
    h2 = V('h').subs(2).info('通过设计流量时下游渠道水深').unit(Unit.m);
    // 局部水头损失系数
    ksi1 = V('ξ').subs('1').info('进口段局部水头损失系数');
    ksi2 = V('ξ').subs('2').info('出口段局部水头损失系数');
    // 平均水力坡降
    J12 = V('J').subs('1-2').info('进口段的平均水力坡降');
    J34 = V('J').subs('3-4').info('出口段的平均水力坡降');
    // 糙率
    n1 = V('n').subs('1').info('进口渐变段糙率').prec(3);
    n2 = V('n').subs('2').info('出口渐变段糙率').prec(3)
    // 水面变化
    Z1 = V('Z').subs('1').info('进口水面降落值').unit(Unit.m);
    Z2 = V('Z').subs('2').info('槽身段水面降落值').unit(Unit.m);
    Z3 = V('Z').subs('3').info('出口水面降落值').unit(Unit.m);
    // 底板高程
    N1 = V('▽').subs(1).info('渡槽进口槽身底板高程').unit(Unit.m);
    N2 = V('▽').subs(2).info('渡槽出口槽身底板高程').unit(Unit.m);
    N3 = V('▽').subs(3).info('渡槽进口渐变段上游渠底高程').unit(Unit.m);
    N4 = V('▽').subs(4).info('渡槽出口渐变段下游渠底高程').unit(Unit.m);

    // 水面变化计算式
    Z1Formula = formula(
        this.Z1,
        add(
            mul(
                add(1, this.ksi1),
                sub(pow(this.v, 2), pow(this.v1, 2)),
                inv(mul(2, Const.g))
            ),
            mul(this.J12, this.L1)
        )
    ).setLong();
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
                inv(mul(2, Const.g))
            ),
            mul(this.J34, this.L2)
        )
    ).setLong();
    DZFormula = formula(
        this.DZ,
        add(this.Z1, this.Z2, minus(this.Z3))
    );
    // 平均水力坡降计算式
    J12Formula = formula(
        this.J12,
        mul(
            div(mul(pow(this.Q, 2), pow(this.n1, 2)), 2),
            add(
                div(1, mul(pow(this.A1, 2), pow(this.R1, fdiv(4, 3)))),
                div(1, mul(pow(this.A2, 2), pow(this.R2, fdiv(4, 3))))
            )
        )
    ).setLong();
    J34Formula = formula(
        this.J34,
        mul(
            div(mul(pow(this.Q, 2), pow(this.n2, 2)), 2),
            add(
                div(1, mul(pow(this.A2, 2), pow(this.R2, fdiv(4, 3)))),
                div(1, mul(pow(this.A3, 2), pow(this.R3, fdiv(4, 3))))
            )
        )
    ).setLong();

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

    constructor(public up: TrapeCalc | RectCalc, public flume: UShellCalc | RectCalc, public down: TrapeCalc | RectCalc){
        super();
        this.up.h.subs(1);
        this.up.A.subs(1);
        this.up.R.subs(1);
        this.up.v.subs(1);
        this.up.i.subs(1);
        this.up.n.subs(3);
        this.up.b.subs(1);
        if(this.up instanceof TrapeCalc) this.up.m.subs(1);

        this.flume.A.subs(2);
        this.flume.R.subs(2);

        this.down.h.subs(2);
        this.down.A.subs(3);
        this.down.R.subs(3);
        this.down.v.subs(2);
        this.down.i.subs(3);
        this.down.n.subs(4);
        this.down.b.subs(3);
        if(this.down instanceof TrapeCalc) this.down.m.subs(3);
    }

    // 计算式
    calc(Q: number){

        this.Q.val(Q);
        this.i.val(this.flume.i.Value);

        this.up.calcH(Q);
        this.flume.calcH(Q);
        this.down.calcH(Q);

        this.h1.val(this.up.h.Value);
        this.h.val(this.flume.h.Value);
        this.h2.val(this.down.h.Value);

        this.A1.val(this.up.A.Value);
        this.A2.val(this.flume.A.Value);
        this.A3.val(this.down.A.Value);

        this.R1.val(this.up.R.Value);
        this.R2.val(this.flume.R.Value);
        this.R3.val(this.down.R.Value);

        this.v1.val(this.up.vFormula.calc());
        this.v.val(this.flume.vFormula.calc());
        this.v2.val(this.down.vFormula.calc());

        this.J12Formula.calc();
        this.J34Formula.calc();

        this.Z1Formula.calc();
        this.Z2Formula.calc();
        this.Z3Formula.calc();

        this.DZFormula.calc();
        
        this.N1Formula.calc();
        this.N2Formula.calc();
        this.N4Formula.calc();
    }
    // 定义
    defZ(){
        return [
            this.Z1Formula,
            this.Z2Formula,
            this.Z3Formula,
            this.J12Formula,
            this.J34Formula,
        ];
    }
    defDZ(){
        return [this.DZFormula];
    }
    defN(){
        return [
            this.N1Formula,
            this.N2Formula,
            this.N4Formula
        ];
    }
    // 变量
    dclZ(){
        return [
            this.Z1,
            this.Z2,
            this.Z3,
            this.v1,
            this.v,
            this.v2,
            this.J12,
            this.J34,
            this.L1,
            this.L,
            this.L2,
            this.i,
            this.n1,
            this.n2,
            this.A1,
            this.A2,
            this.A3,
            this.R1,
            this.R2,
            this.R3
        ]
    }
    dclDZ(){
        return [this.DZ];
    }
    dclN(){
        return [
            this.N1,
            this.N2,
            this.N3,
            this.N4
        ];
    }
    // 计算过程
    prcZUp(){
        return [...this.up.prcH(), this.up.vFormula];
    }
    prcZFlume(){
        return [...this.flume.prcH(), this.flume.vFormula];
    }
    prcZDown(){
        return [...this.down.prcH(), this.down.vFormula];
    }
    prcZ(){
        return [
            this.J12Formula,
            this.J34Formula,
            this.Z1Formula,
            this.Z2Formula,
            this.Z3Formula
        ];
    }
    prcDZ(){
        return [this.DZFormula];
    }
    prcN(){
        return [
            this.N1Formula,
            this.N2Formula,
            this.N4Formula
        ];
    }
    
}

export class FloorEnv extends Environment{
    N3: number;
    L1: number;
    L: number;
    L2: number;
    n1: number;
    n2: number;
    ksi1: number;
    ksi2: number;
    constructor(public up: TrapeEnv | RectEnv, public flume: UShellEnv | RectEnv, public down: TrapeEnv | RectEnv){super();}
    genCalc(){
        const calc = new FloorCalc(this.up.genCalc(), this.flume.genCalc(), this.down.genCalc());
        this.initCalc(calc);
        return calc;
    }
    initCalc(calc: FloorCalc){
        calc.N3.val(this.N3);
        calc.L1.val(this.L1);
        calc.L.val(this.L);
        calc.L2.val(this.L2);
        calc.n1.val(this.n1);
        calc.n2.val(this.n2);
        calc.ksi1.val(this.ksi1);
        calc.ksi2.val(this.ksi2);
    }
}