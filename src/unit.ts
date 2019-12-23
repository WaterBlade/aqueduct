import { unit, pow, fdiv, Expression, mul } from "docx";

export default {
    m: unit('m') as Expression,
    m2 : pow(unit('m'), 2) as Expression,
    m3 : pow(unit('m'), 3) as Expression,
    m4 : pow(unit('m'), 4) as Expression,
    m_s: fdiv(unit('m'), unit('s')) as Expression,
    m_s2: fdiv(unit('m'), pow(unit('s'), 2)) as Expression,
    m3_s: fdiv(pow(unit('m'), 3), unit('s')) as Expression,
    rad: unit('rad') as Expression,
    kN: unit('kN') as Expression,
    kN_m3: fdiv(unit('kN'), pow(unit('m'), 3)) as Expression,
    kNm: mul(unit('kN'), unit('m')) as Expression,
    cels: unit('℃') as Expression,
}