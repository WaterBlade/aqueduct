export class Turtle{
    points: number[][] = [];
    x0: number;
    y0: number;
    line(x: number, y: number){
        this.points.push([x, y]);
    }
    moveTo(x: number, y: number){
        this.x0 = x;
        this.y0 = y;
    }
    flush(){
        let x: number = this.x0;
        let y: number = this.y0;
        const points: number[] = [x, y, 0]
        for(const p of this.points){
            x += p[0];
            y += p[1];
            points.push(x, y, 0);
        }
        this.points = [];
        return points;
    }
}