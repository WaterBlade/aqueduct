import { Var, variable, unit, Expression, fractionVariable, FracVar, MathDefinitionBuilder, MathDeclarationBuilder, MathProcedureBuilder } from "docx";

export class Floor{
    private _N1: Var = variable('▽', {sub: '1', inform: '渡槽进口槽身底部高程', unit: unit('m')});
    private _N2: Var = variable('▽', {sub: '2', inform: '渡槽出口槽身底部高程', unit: unit('m')});
    private _N3: Var = variable('▽', {sub: '3', inform: '渡槽进口渐变段前上游渠底高程', unit: unit('m')});
    private _N4: Var = variable('▽', {sub: '4', inform: '渡槽出口渐变段末端下游渠底高程', unit: unit('m')});
    private _h: Var = variable('h', {inform: '通过设计流量时槽内水深', unit: unit('m')})
    private _h1: Var = variable('h', {sub: '1', inform: '通过设计流量时上游渠道内的水深', unit: unit('m')})
    private _h2: Var = variable('h', {sub: '2', inform: '通过设计流量时下游渠道内的水深', unit: unit('m')})
    private _Z1: Var = variable('Z', {sub: '1'});
    private _Z3: Var = variable('Z', {sub: '3'});
    private _i: FracVar = fractionVariable('i');
    private _L: Var = variable('L');

    private N1Calc: Expression = this._N3.add(this._h1).sub(this._Z1).sub(this._h1);
    private N2Calc: Expression = this._N1.sub(this._i.mul(this._L))
    private N4Calc: Expression = this._N2.add(this._h).add(this._Z3).sub(this._h2);
    

    set N3(val: number){
        this._N3.Value = val;
    }

    set h(val: number){
        this._h.Value = val;
    }

    set h1(val: number){
        this._h1.Value = val;
    }

    set h2(val: number){
        this._h2.Value = val;
    }

    set Z1(val: number){
        this._Z1.Value = val;
    }

    set Z3(val: number){
        this._Z3.Value = val;
    }

    set iDen(val: number){
        this._i.Den = val;
    }

    set L(val: number){
        this._L.Value = val;
    }

    public calcN1(){
        this._N1.Value = this.N1Calc.Value;
    }

    public calcN2(){
        this._N2.Value = this.N2Calc.Value;
    }

    public calcN4(){
        this._N4.Value = this.N4Calc.Value;
    }

    public makeDefinition(builder: MathDefinitionBuilder){
        builder.formula(this._N1, this.N1Calc);
        builder.formula(this._N2, this.N2Calc);
        builder.formula(this._N4, this.N4Calc);
    }

    public makeDeclaration(builder: MathDeclarationBuilder){
        builder.declare(this._N1);
        builder.declare(this._N2);
        builder.declare(this._N3);
        builder.declare(this._N4);
    }

    public makeProcedure(builder: MathProcedureBuilder){
        builder.formula(this._N1, this.N1Calc);
        builder.formula(this._N2, this.N2Calc);
        builder.formula(this._N4, this.N4Calc);
    }

}