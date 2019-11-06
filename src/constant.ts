import { variable, unit } from "docx";


export const pi = variable('π');
pi.Value = Math.PI;


export const g = variable('g', {inform: '重力加速度', unit: unit('m').flatDiv(unit('s').pow(2))});
g.Value = 9.81;