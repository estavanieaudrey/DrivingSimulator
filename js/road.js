class Road {
  constructor(left, right, length, width, lane_count, type) {
    this.width = width;
    this.length = length;
    this.lane_count = lane_count;
    this.left = left;
    this.right = right;
    this.type = type;

    this.top=0; this.bottom=0;
    let top_x, marker, offset;

    let top_left, top_right, bottom_left, bottom_right;

    this.borders = [];

    switch (type) {
      //vertical types
      case 0:
        this.top = Math.min(left.y, right.y) - length;
        this.bottom = Math.max(left.y, right.y);

        top_left = {x: this.left.x, y: this.top - width};
        top_right = {x: this.right.x, y: this.top};
        break;
      case 2:
        this.top = Math.max(left.y, right.y) - length;
        this.bottom = Math.min(left.y, right.y);

        top_left = {x: this.left.x, y: this.top + width};
        top_right = {x: this.right.x, y: this.top};
        break;
      //horizontal types
      case 1:
        this.top = left.y;
        this.bottom = right.y;
        top_x = Math.max(left.x, right.x) + length;

        top_left = {x: top_x + width, y: this.top};
        top_right = {x: top_x, y: this.bottom};
        break;
      case 3:
        this.top = right.y;
        this.bottom = left.y;
        top_x = Math.min(left.x, right.x) + length;

        top_left = {x: top_x, y: this.bottom};
        top_right = {x: top_x + width, y: this.top};
        break;
      //diagonal types
      case 4: //diagonal [ \ ]
        this.top = Math.min(left.y, right.y);
        this.bottom = Math.max(left.y, right.y);

        offset = (length < 0)? width : -width;

        marker = (right.y > left.y)? {x: right.x + width, y:left.y} : {x:left.x - width, y: right.y};
        marker.x += length; marker.y += length;

        top_left = marker;
        top_right = {x: marker.x + offset, y: marker.y - offset};
        break;
      case 5: //diagonal [ / ]
        this.top = Math.min(left.y, right.y);
        this.bottom = Math.max(left.y, right.y);

        offset = (length < 0)? width : -width;

        marker = (right.y > left.y)? {x: left.x + width, y:right.y} : {x:right.x - width, y: left.y};
        marker.x -= length; marker.y += length;

        top_left = {x: marker.x - offset, y: marker.y - offset};
        top_right = marker;
        break;
    }
    bottom_left = left; bottom_right = right;

    this.borders.push([top_left, bottom_left]);
    this.borders.push([top_right, bottom_right]);

    //save measurements to pass onto next road segment
    this.end = [top_left, top_right];
  }

  get_lane_center(index) {
    const lane_width = this.width / this.lane_count;
    //starts at leftmost point, gets center of lane with an offset of previous lane's widths
    return (this.width * 0.05) + (lane_width/2) + (index * lane_width);
  }

  draw(ctx) {
    //draw road base
    ctx.beginPath()
    ctx.fillStyle = "gray";
      ctx.moveTo(this.borders[0][0].x, this.borders[0][0].y);
      ctx.lineTo(this.borders[0][1].x, this.borders[0][1].y);
      ctx.lineTo(this.borders[1][1].x, this.borders[1][1].y);
      ctx.lineTo(this.borders[1][0].x, this.borders[1][0].y);
    ctx.closePath();
    ctx.fill();

    //draw lane markers
    ctx.lineWidth = 5;
    ctx.strokeStyle = "white";
    for (let i=1; i <= this.lane_count - 1; i++) {
      ctx.setLineDash([20,20]);
      ctx.beginPath();

      ctx.moveTo(linear_interpolation(this.borders[0][0].x, this.borders[1][0].x, (i / this.lane_count)),
        linear_interpolation(this.borders[0][0].y, this.borders[1][0].y, (i / this.lane_count)));
      ctx.lineTo(linear_interpolation(this.borders[0][1].x, this.borders[1][1].x, (i / this.lane_count)),
        linear_interpolation(this.borders[0][1].y, this.borders[1][1].y, (i / this.lane_count)));
      ctx.stroke();
    }

    //draw road borders
    ctx.setLineDash([0,0]);
    this.borders.forEach(border => {
      ctx.beginPath();
      //draw line from the 2 coordinates in each border
      ctx.moveTo(border[0].x, border[0].y);
      ctx.lineTo(border[1].x, border[1].y);
      ctx.stroke();
    });
  }
}
