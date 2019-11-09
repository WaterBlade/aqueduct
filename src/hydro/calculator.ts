import { Section, Rect, Trape, UShell, FindW, FindH,  FindSurmount } from "./section";
import { ProcedureContent, DefinitionContent, DeclarationContent, DocXBuilder, V, Variable } from "docx";
import { UNIT } from "../common";

export class HydroCalculator{
    upSection: Section;
    flumeSection: Section;
    downSection: Section;
    designSection: Section;

    uRatio = [0.7, 0.9]
    rRatio = [0.6, 0.8]

    Qs: number;
    Qj: number;

    sectType: 'ushell' | 'rect';

    // design part
    private designDef: DefinitionContent;
    private designDcl: DeclarationContent;
    private designQsPrcLeft: ProcedureContent;
    private designQsPrcRight: ProcedureContent;
    private designQjPrcLeft: ProcedureContent;
    private designQjPrcRight: ProcedureContent;
    private designValue: number;
    private designVar: Variable[] =[];

    // confirm part
    private confirmHDef: DefinitionContent;
    private confirmHDcl: DeclarationContent;
    private confirmQsPrc: ProcedureContent;
    private confirmQjPrc: ProcedureContent;
    private confirmHPrc: ProcedureContent;
    private confirmHs: Variable;
    private confirmHj: Variable;

    rect(){
        return new Rect();
    }

    trape(){
        return new Trape();
    }

    ushell(){
        return new UShell();
    }

    // 步骤1： 求断面尺寸取值范围
    setDesign(sect: Section){
        this.designSection = sect;
        if(sect instanceof UShell){
            this.sectType = 'ushell';
        }else{
            this.sectType = 'rect';
        }
        const findW = new FindW(sect);
        this.designDef = findW.toDefCnt();
        this.designDcl = findW.toDclCnt();
    }

    design(Qs: number, Qj: number){
        this.Qs = Qs;
        this.Qj = Qj;

        const findW = new FindW(this.designSection);
        let ratio;
        if(this.designSection instanceof UShell){
            ratio = this.uRatio;
        }else if(this.designSection instanceof Rect){
            ratio = this.rRatio;
        }
        const [min , max] = ratio;

        const sleft = findW.findW(Qs, max);
        this.designQsPrcLeft = findW.toPrcCnt(1);
        this.designVar.push(findW.getVar().subs(1));

        const sright = findW.findW(Qs, min);
        this.designQsPrcRight = findW.toPrcCnt(2);
        this.designVar.push(findW.getVar().subs(2));

        const jleft = findW.findW(Qj, max);
        this.designQjPrcLeft = findW.toPrcCnt(3);
        this.designVar.push(findW.getVar().subs(3));

        const jright = findW.findW(Qj, min);
        this.designQjPrcRight = findW.toPrcCnt(4);
        this.designVar.push(findW.getVar().subs(4));

        return [sleft, sright, jleft, jright];
    }

    setDesignValue(val: number){
        this.designValue = val;
    }

    // 步骤2：确定断面尺寸
    confirm(t: number){
        const findH = new FindH(this.designSection);

        const hs = findH.findH(this.Qs);
        this.confirmQsPrc = findH.toPrcCnt(5);
        this.confirmHs = V('h').val(hs).subs(5).unit(UNIT.m);

        const hj = findH.findH(this.Qj);
        this.confirmQjPrc = findH.toPrcCnt(6);
        this.confirmHj = V('h').val(hj).subs(6).unit(UNIT.m);

        const sur = new FindSurmount(this.designSection);
        this.confirmHDef = sur.toDefCnt();
        this.confirmHDcl = sur.toDclCnt();

        const H = sur.findSurmount(hs, hj, t);
        this.confirmHPrc = sur.toPrcCnt();

        return H;
    }


    makeReport(){
        const sect = this.sectType === 'ushell' ? 'U形槽': '矩形槽';
        const ratio = this.sectType === 'ushell' ? this.uRatio : this.rRatio;
        const Qs = V('Q').subs('s').val(this.Qs).unit(UNIT.m3_s);
        const Qj = V('Q').subs('j').val(this.Qj).unit(UNIT.m3_s);
        const [left, right] = [
            Math.max(this.designVar[0].Value, this.designVar[1].Value),
            Math.min(this.designVar[2].Value, this.designVar[3].Value)
        ]
        // 生成器
        const b = new DocXBuilder();
        
        // 封面
        b.cover().Name = '渡槽水力设计计算';

        // 参数与结果
        b.h(1).t('计算参数及计算结果');
        b.h(2).t('计算参数');
        b.p().t('设计流量：').varVal(Qs);
        b.p().t('加大流量：').varVal(Qj);

        // 断面尺寸
        b.h(1).t('槽身断面尺寸设计计算');
        // --槽宽或内径
        b.h(2).t('按深宽比拟定槽宽（内径）');
        b.p().t('规范对槽身深宽比取值做出了限定，本节通过拟定不同的槽宽（内径），按流量计算公式试算确定对应的尺寸。试算公式如下：');
        b.definition().content(this.designDef);
        b.declaration().content(this.designDcl);
        //
        b.p().t(`根据规范，${sect}深宽比的取值范围是${ratio[0]}至${ratio[1]}。当通过设计流量`)
            .varVal(Qs)
            .t(`，且槽内深宽比为${ratio[0]}时，试算得到的尺寸`)
            .varVal(this.designVar[0])
            .t('，验算如下：')
        b.procedure().content(this.designQsPrcLeft);
        //
        b.p().t(`当通过设计流量`)
            .varVal(Qs)
            .t(`且槽内深宽比为${ratio[1]}时，试算得到的尺寸为`)
            .varVal(this.designVar[1])
            .t('，验算如下：')
        b.procedure().content(this.designQsPrcRight);
        //
        b.p().t(`当通加大流量`)
            .varVal(Qj)
            .t(`且槽内深宽比为${ratio[0]}时，试算得到的尺寸为`)
            .varVal(this.designVar[2])
            .t('，验算如下：')
        b.procedure().content(this.designQjPrcLeft);
        //
        b.p().t(`当通加大流量`)
            .varVal(Qj)
            .t(`且槽内深宽比为${ratio[1]}时，试算得到的尺寸为`)
            .varVal(this.designVar[3])
            .t('，验算如下：')
        b.procedure().content(this.designQjPrcRight);
        //

        // --净高
        b.h(2).t('槽身净高计算')
        b.p().t('规范对槽身超高做出了规定，其最小净高可按下式计算：')
        b.definition().content(this.confirmHDef);
        b.declaration().content(this.confirmHDcl);
        //
        b.p().t('槽内水深可以通过试算确定。当通过设计流量')
            .varVal(Qs)
            .t('时，槽内水深为：')
            .varVal(this.confirmHs)
            .t('，试算如下：')
        b.procedure().content(this.confirmQsPrc);
        //
        b.p().t('当通过加大流量')
            .varVal(Qj)
            .t('时，槽内水深为：')
            .varVal(this.confirmHj)
            .t('，试算如下：')
        b.procedure().content(this.confirmQjPrc);
        //
        b.p().t('最小净高计算如下：')
        b.procedure().content(this.confirmHPrc);

        

        // 生成文档
        b.saveBlob('渡槽水力设计计算')
        

    }

}


// 水深计算

