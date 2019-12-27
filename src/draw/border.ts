import {DXFBuilder} from "dxf";

export function genA2Border(builder: DXFBuilder, factor: number, name?: string, project?: string){
    const model = builder.modelSpace;
    // outer
    model.setLayer('THIN');
    model.lwpolyline(
        0, 0, 0,
        594 * factor, 0, 0,
        594 * factor, 420 * factor, 0,
        0, 420 * factor, 0,
        0, 0, 0
    );
    // inner
    model.setLayer('THICKER');
    model.lwpolyline(
        25 * factor, 10 * factor, 0,
        584 * factor, 10 * factor, 0,
        584 * factor, 410 * factor, 0,
        25 * factor, 410 * factor, 0,
        25 * factor, 10 * factor, 0
    );
    // title
    model.setLayer('THICKER');
    model.lwpolyline(
        464 * factor, 10 * factor, 0,
        464 * factor, 78 * factor, 0,
        584 * factor, 78 * factor, 0
    )
    // title grid
    model.setLayer('THIN');
    model.line(
        464 * factor, 17 * factor,
        584 * factor, 17 * factor
    );
    model.line(
        464 * factor, 24 * factor,
        584 * factor, 24 * factor
    );
    model.line(
        464 * factor, 31 * factor,
        514 * factor, 31 * factor
    );
    model.line(
        464 * factor, 38 * factor,
        514 * factor, 38 * factor
    );
    model.line(
        464 * factor, 45 * factor,
        514 * factor, 45 * factor
    );
    model.line(
        464 * factor, 52 * factor,
        584 * factor, 52 * factor
    );
    model.line(
        464 * factor, 59 * factor,
        514 * factor, 59 * factor
    );
    model.line(
        464 * factor, 66 * factor,
        584 * factor, 66 * factor
    );
    model.line(
        479 * factor, 10 * factor,
        479 * factor, 66 * factor
    );
    model.line(
        504 * factor, 17 * factor,
        504 * factor, 66 * factor
    );
    model.line(
        514 * factor, 10 * factor,
        514 * factor, 66 * factor
    );
    model.line(
        529 * factor, 10 * factor,
        529 * factor, 24 * factor
    );
    model.line(
        549 * factor, 17 * factor,
        549 * factor, 24 * factor
    );
    model.line(
        564 * factor, 17 * factor,
        564 * factor, 24 * factor
    );
    model.line(
        554 * factor, 52 * factor,
        554 * factor, 66 * factor
    );
    model.line(
        554 * factor, 59 * factor,
        584 * factor, 59 * factor
    );
    model.setStyle('HZ');
    model.setTextHeight(3.5 * factor);
    model.setTextAlign('middleCenter');
    model.text(
        '设计证号',
        471.5*factor, 13.5*factor
    );
    model.text(
        '描 图',
        471.5*factor, 20.5*factor
    );
    model.text(
        '制 图',
        471.5*factor, 27.5*factor
    );
    model.text(
        '设 计',
        471.5*factor, 34.5*factor
    );
    model.text(
        '校 核',
        471.5*factor, 41.5*factor
    );
    model.text(
        '审 查',
        471.5*factor, 48.5*factor
    );
    model.text(
        '核 定',
        471.5*factor, 55.5*factor
    );
    model.text(
        '批 准',
        471.5*factor, 62.5*factor
    );
    model.text(
        '图 号',
        521.5*factor, 13.5*factor
    );
    model.text(
        '比 例',
        521.5*factor, 20.5*factor
    );
    model.text(
        '日 期',
        556.5*factor, 20.5*factor
    );
    model.text(
        '技施  设计',
        569*factor, 62.5*factor
    );
    model.text(
        '水工  部分',
        569*factor, 55.5*factor
    );
    model.text(
        project ? project : '**工程',
        534*factor, 59*factor
    );
    model.setTextHeight(5*factor);
    model.setStyle('TITLE');
    model.text(
        '湖南省水利水电勘测设计研究总院',
        524 * factor, 72 * factor
    );
    model.text(
        name ? name : '**图纸',
        549 * factor, 38 * factor
    );
}