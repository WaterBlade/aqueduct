import { Expression, Var, variable, unit, num, DocXBuilder, fractionVariable, MathDefinitionBuilder, MathDeclarationBuilder, MathProcedureBuilder } from "docx";
import { g } from "/constant";

export abstract class Surface{

}

export class Inlet extends Surface{
    private _v: Var = variable('ν', {inform: '槽身断面平均流速', unit: unit('m').flatDiv(unit('s'))});
    private _v1: Var = variable('ν', {sub: '1', inform: '进口渐变段上游渠道断面平均流速', unit: unit('m').flatDiv(unit('s'))});
    private _L1: Var = variable('L', {sub: '1', inform: '进口段长度', unit: unit('m')});
    private _ksi1: Var = variable('ξ', {sub: '1', inform: '进口段局部水头损失系数'});
    private _J12: Var = variable('J', {sub: '1-2', inform: '进口段的平均水力坡降'});
    private _Z1: Var = variable('Z', {sub: '1', inform: '进口水面降落值', unit: unit('m')})
    private _Q: Var = variable('Q', {inform: '过流量', unit: unit('m').pow(3).flatDiv(unit('s'))});
    private _n: Var = variable('n', {inform: '进口渐变段糙率', precision: 3})
    private _A1: Var = variable('A', {sub: '1', inform: '进口渐变段上游渠道断面过水面积', unit: unit('m').pow(2)});
    private _A2: Var = variable('A', {sub: '2', inform:'槽身过水断面面积', unit: unit('m').pow(2)});
    private _R1: Var = variable('R', {sub: '1', inform:'进口渐变段上游渠道断面水力半径', unit: unit('m')});
    private _R2: Var = variable('R', {sub: '2', inform: '槽身过水断面水力半径', unit: unit('m')});

    private V1Calc: Expression = this._Q.div(this._A1);
    private V2Calc: Expression = this._Q.div(this._A2);
    private ZCalc: Expression = num(1).add(this._ksi1).mul(this._v.pow(2).sub(this._v1.pow(2))).div(num(2).mul(g)).add(this._J12.mul(this._L1));
    private JCalc: Expression = this._Q.pow(2).mul(this._n.pow(2)).div(num(2)).mul(
        num(1).div(this._A1.pow(2).mul(this._R1.pow(num(4).flatDiv(num(3))))).add(
            num(1).div(this._A2.pow(2).mul(this._R2.pow(num(4).flatDiv(num(3))))))
    );

    set L(val: number){
        this._L1.Value = val;
    }

    set ksi(val: number){
        this._ksi1.Value = val;
    }
    
    set Q(val: number){
        this._Q.Value = val;
    }

    set n(val: number){
        this._n.Value = val;
    }

    set A1(val: number){
        this._A1.Value = val;
    }

    set A2(val: number){
        this._A2.Value = val;
    }

    set R1(val: number){
        this._R1.Value = val;
    }

    set R2(val: number){
        this._R2.Value = val;
    }

    public calcJ(){
        this._v1.Value = this.V1Calc.Value;
        this._v.Value = this.V2Calc.Value;
        this._J12.Value = this.JCalc.Value;
        return this._J12.Value;
    }

    public calcZ(){
        this.calcJ();
        this._Z1.Value = this.ZCalc.Value;
        return this._Z1.Value;
    }

    public makeDefinition(builder: MathDefinitionBuilder){
        builder.formula(this._Z1, this.ZCalc);
        builder.formula(this._J12, this.JCalc);
        builder.formula(this._v1, this.V1Calc);
        builder.formula(this._v, this.V2Calc);
    }

    public makeDeclaration(builder: MathDeclarationBuilder){
        builder.declare(this._Z1);
        builder.declare(this._v);
        builder.declare(this._v1);
        builder.declare(this._ksi1);
        builder.declare(this._J12);
        builder.declare(this._L1);
        builder.declare(this._Q);
        builder.declare(this._n);
        builder.declare(this._A1);
        builder.declare(this._A2);
        builder.declare(this._R1);
        builder.declare(this._R2);
    }

    public makeProcedure(builder: MathProcedureBuilder){
        builder.formula(this._v, this.V2Calc);
        builder.formula(this._v1, this.V1Calc);
        builder.formula(this._J12, this.JCalc);
        builder.formula(this._Z1, this.ZCalc);

    }
}

export class Outlet extends Surface{
    private _v: Var = variable('ν', {inform: '槽身断面平均流速', unit: unit('m').flatDiv(unit('s'))});
    private _v2: Var = variable('ν', {sub: '2', inform: '出口渐变段上游渠道断面平均流速', unit: unit('m').flatDiv(unit('s'))});
    private _L2: Var = variable('L', {sub: '2', inform: '出口段长度', unit: unit('m')});
    private _ksi2: Var = variable('ξ', {sub: '2', inform: '出口段局部水头损失系数'});
    private _J23: Var = variable('J', {sub: '2-3', inform: '出口段的平均水力坡降'});
    private _Z3: Var = variable('Z', {sub: '3', inform: '出口水面降落值', unit: unit('m')})
    private _Q: Var = variable('Q', {inform: '过流量', unit: unit('m').pow(3).flatDiv(unit('s'))});
    private _n: Var = variable('n', {inform: '出口渐变段糙率', precision: 3})
    private _A3: Var = variable('A', {sub: '3', inform: '出口渐变段上游渠道断面过水面积', unit: unit('m').pow(2)});
    private _A2: Var = variable('A', {sub: '2', inform:'槽身过水断面面积', unit: unit('m').pow(2)});
    private _R3: Var = variable('R', {sub: '3', inform:'出口渐变段上游渠道断面水力半径', unit: unit('m')});
    private _R2: Var = variable('R', {sub: '2', inform: '槽身过水断面水力半径', unit: unit('m')});

    private V3Calc: Expression = this._Q.div(this._A3);
    private V2Calc: Expression = this._Q.div(this._A2);
    private ZCalc: Expression = num(1).sub(this._ksi2).mul(this._v.pow(2).sub(this._v2.pow(2))).div(num(2).mul(g)).sub(this._J23.mul(this._L2));
    private JCalc: Expression = this._Q.pow(2).mul(this._n.pow(2)).div(num(2)).mul(
        num(1).div(this._A3.pow(2).mul(this._R3.pow(num(4).flatDiv(num(3))))).add(
            num(1).div(this._A2.pow(2).mul(this._R2.pow(num(4).flatDiv(num(3))))))
    );

    set L(val: number){
        this._L2.Value = val;
    }

    set ksi(val: number){
        this._ksi2.Value = val;
    }
    
    set Q(val: number){
        this._Q.Value = val;
    }

    set n(val: number){
        this._n.Value = val;
    }

    set A3(val: number){
        this._A3.Value = val;
    }

    set A2(val: number){
        this._A2.Value = val;
    }

    set R3(val: number){
        this._R3.Value = val;
    }

    set R2(val: number){
        this._R2.Value = val;
    }

    public calcJ(){
        this._v2.Value = this.V3Calc.Value;
        this._v.Value = this.V2Calc.Value;
        this._J23.Value = this.JCalc.Value;
        return this._J23.Value;
    }

    public calcZ(){
        this.calcJ();
        this._Z3.Value = this.ZCalc.Value;
        return this._Z3.Value;
    }

    public makeDefinition(builder: MathDefinitionBuilder){
        builder.formula(this._Z3, this.ZCalc);
        builder.formula(this._J23, this.JCalc);
        builder.formula(this._v2, this.V3Calc);
        builder.formula(this._v, this.V2Calc);
    }

    public makeDeclaration(builder: MathDeclarationBuilder){
        builder.declare(this._Z3);
        builder.declare(this._v);
        builder.declare(this._v2);
        builder.declare(this._ksi2);
        builder.declare(this._J23);
        builder.declare(this._L2);
        builder.declare(this._Q);
        builder.declare(this._n);
        builder.declare(this._A3);
        builder.declare(this._A2);
        builder.declare(this._R3);
        builder.declare(this._R2);
    }

    public makeProcedure(builder: MathProcedureBuilder){
        builder.formula(this._v, this.V2Calc);
        builder.formula(this._v2, this.V3Calc);
        builder.formula(this._J23, this.JCalc);
        builder.formula(this._Z3, this.ZCalc);

    }
}

export class Flume extends Surface{
    private _i: Var = fractionVariable('i', {inform:'槽身坡降'});
    private _L: Var = variable('L', {inform: '槽身长度', unit: unit('m')});
    private _Z2: Var = variable('Z', {sub: '2', inform: '槽身段水面降落值', unit: unit('m')})

    private ZCalc: Expression = this._i.mul(this._L);

    set i(val: number){
        this._i.Value = val;
    }

    set L(val: number){
        this._L.Value = val;
    }

    public calcZ(){
        this._Z2.Value = this.ZCalc.Value;
        return this._Z2.Value;
    }

    public makeDefinition(builder: MathDefinitionBuilder){
        builder.formula(this._Z2, this.ZCalc)
    }

    public makeDeclaration(builder: MathDeclarationBuilder){
        builder.declare(this._Z2);
        builder.declare(this._i);
        builder.declare(this._L);
    }

    public makeProcedure(builder: MathProcedureBuilder){
        builder.formula(this._Z2, this.ZCalc, false);
    }
}

export class Total extends Surface{
    private _DZ: Var = variable('ΔZ', {inform: '渡槽总水头损失', unit: unit('m')})
    private _Z1: Var = variable('Z', {sub: '1'});
    private _Z2: Var = variable('Z', {sub: '2'});
    private _Z3: Var = variable('Z', {sub: '3'});

    private DZCalc: Expression = this._Z1.add(this._Z2).sub(this._Z3);

    set Z1(val: number){
        this._Z1.Value = val;
    }

    set Z2(val: number){
        this._Z2.Value = val;
    }

    set Z3(val: number){
        this._Z3.Value = val;
    }

    public calcDZ(){
        this._DZ.Value = this.DZCalc.Value;
        return this._DZ.Value;
    }

    public makeDefinition(builder: MathDefinitionBuilder){
        builder.formula(this._DZ, this.DZCalc);
    }

    public makeDeclaration(builder: MathDeclarationBuilder){
        builder.declare(this._DZ);
    }

    public makeProcedure(builder: MathProcedureBuilder){
        builder.formula(this._DZ, this.DZCalc);
    }

}