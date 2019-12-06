import { unit, pow, fdiv, Expression } from "docx";

export default {
    m: unit('m') as Expression,
    m2 : pow(unit('m'), 2) as Expression,
    m3 : pow(unit('m'), 3) as Expression,
    m_s: fdiv(unit('m'), unit('s')) as Expression,
    m_s2: fdiv(unit('m'), pow(unit('s'), 2)) as Expression,
    m3_s: fdiv(pow(unit('m'), 3), unit('s')) as Expression
}