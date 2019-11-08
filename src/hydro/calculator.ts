import { Section, Rect, Trape, UShell } from "./section";

export class HydroCalculator{
    upSection: Section;
    flumeSection: Section;
    downSection: Section;
    designSection: Section;

    Qs: number;
    Qj: number;

    // 设置流量
    setQ(qs, qj){
        this.Qs = qs;
        this.Qj = qj
    }

    // 设置断面

    private rect(b: number){
        const r = new Rect();
        r.b.val(b);
        return r;
    }

    private trape(b: number, m: number){
        const t = new Trape();
        t.b.val(b);
        t.m.val(m);
        return t;
    }

    private ushell(r: number){
        const u = new UShell();
        u.r.val(r);
        return u
    }

    setUpRect(b: number){
        this.upSection = this.rect(b);
    }

    setUpTrape(b: number, m: number){
        this.upSection = this.trape(b, m);
    }

    setDownRect(b: number){
        this.downSection = this.rect(b);
    }

    setDownTrape(b: number, m: number){
        this.downSection = this.trape(b, m);
    }

    setFlumeRect(b: number){
        this.flumeSection = this.rect(b);
    }

    setFlumeUShell(r: number){
        this.flumeSection = this.ushell(r);
    }

    setDesignRect(){
        this.designSection = new Rect();
    }

    setDesignUShell(){
        this.designSection = new UShell();
    }

    makeReport(){

    }

}