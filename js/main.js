const canvas = document.getElementById("main_canvas");
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
const road_width = 300;
const measurements = [road_width * 0.95, road_width/100]

const ctx = canvas.getContext("2d");

const t0_pos = [0, 1];
const t0_neg = [0, -1];
const t1_pos = [1, 1];
const t1_neg = [1, -1];
const t2_pos = [2, 1];
const t2_neg = [2, -1];
const t3_pos = [3, 1];
const t3_neg = [3, -1];
const t4_pos = [4, 1];
const t4_neg = [4, -1];
const t5_pos = [5, 1];
const t5_neg = [5, -1];

const segment_mapping = {
  0: {
    positive: [t0_pos, t1_pos, t2_pos, t3_pos, t5_neg],
    negative: [t0_neg, t1_pos, t2_neg, t3_pos, t5_pos]
  },
  1: {
    positive: [t0_neg, t1_pos, t2_neg, t3_pos, t4_pos],
    negative: [t1_neg, t0_neg, t2_neg, t3_neg, t5_pos]
  },
  2: {
    positive: [t2_pos, t0_pos, t1_neg, t3_neg, t4_neg],
    negative: [t2_neg, t0_neg, t1_neg, t3_neg, t5_pos]
  },
  3: {
    positive: [t3_pos, t0_neg, t1_pos, t2_pos, t5_neg],
    negative: [t3_neg, t0_pos, t1_neg, t2_pos, t4_neg]
  },
  4: {
    positive: [t0_neg, t1_pos, t2_neg, t3_pos, t4_pos],
    negative: [t0_pos, t1_neg, t2_pos, t3_neg, t4_neg]
  },
  5: {
    positive: [t0_neg, t1_neg, t2_neg, t3_neg, t5_pos],
    negative: [t0_pos, t1_pos, t2_pos, t3_pos, t5_neg]
  }
};

let roads = [];
let borders = [];

roads.push(new Road({x:0,y:road_width}, {x:road_width,y:0}, 1000, ...measurements,0));
generate_road(roads[0], roads, borders); generate_road(roads[1], roads, borders);
generate_road(roads[2], roads, borders); generate_road(roads[3], roads, borders);
generate_road(roads[4], roads, borders);
// roads.push(new Road(...roads[0].end, -500, ...measurements, 5));
// roads.push(new Road(...roads[1].end, 1000, ...measurements, 1));
// roads.push(new Road(...roads[2].end, 500, ...measurements, 4));
// roads.push(new Road(...roads[3].end, -1010, ...measurements, 2));
// roads.push(new Road(...roads[4].end, 300, ...measurements, 5));
// roads.push(new Road(...roads[5].end, -1110, ...measurements, 3));
// roads.push(new Road(...roads[6].end, -300, ...measurements, 4));

roads.forEach((road) => {
  borders.push(...road.borders);
});

//initialize player car
let cars = [];
// cars.push(new Car(roads[0].get_lane_center(0),
//   -300, 30, 50,
//   4, "KEYS"));


generate_cars(450, cars);

let best_car = cars[0];

let best_score = 0;
animate();

//display initial generation info
document.getElementById("car_count").innerHTML = "Cars: " + cars.length;
document.getElementById("distance").innerHTML = "0 pts";

//refresh display every N seconds
let inverval_timer;
inverval_timer = setInterval(function() {
  //stop run if 1 or less cars are left
  if (cars.length <= 1) {
    location.reload();
    save_best();
  }

  //remove all player cars that are outside bounds
  cars = cars.filter(c => Math.abs(best_car.score - c.score) <= 200 && (!c.damaged));

  best_score = Math.max(...cars.map(c => c.score))
  best_car = cars.find(c => c.score === best_score);

  //update info
  document.getElementById("car_count").innerHTML = "Cars: " + cars.length;
  document.getElementById("distance").innerHTML = Math.abs(best_car.score).toLocaleString() + " pts";
}, 1000);

// procedural track generation timer
let road_timer;
road_timer = setInterval(function() {
  generate_road(roads[roads.length-1], roads, borders);
  roads.shift();
  borders.shift();
  borders = [];
  roads.forEach((road) => {
    borders.push(...road.borders);
  });
}, 9000);

let generation_timer;
generation_timer = setInterval(function() {
  save_best();
  location.reload();
}, 120000);

function generate_road(last_road, roads, borders) {
  const last_direction = (last_road.length > 0)? "positive": "negative";
  const mapping = segment_mapping[last_road.type][last_direction];
  const next_type = mapping[Math.floor(Math.random() * 5)];
  console.log(next_type);
  let new_road = new Road(...last_road.end, next_type[1] * (Math.random() * road_width + road_width*3), ...measurements, next_type[0])
  roads.push(new_road);
  borders.push(...new_road.borders)
}

function generate_cars(number, arr) {
  let saved_chromosome = !!(JSON.parse(localStorage.getItem("best_car")));
  const mutation_amount = 0.2;

  for (let i=0; i<number; i++) {
    let generated_car = new Car(roads[0].get_lane_center(Math.floor(roads[0].lane_count/2)), -100, 30, 50, 3, "CPU");
    if (saved_chromosome && i > 0) {
      generated_car.sensor.chromosome = JSON.parse(localStorage.getItem("best_car"));
      generated_car.sensor.mutate(mutation_amount);
    }
    arr.push(generated_car);
  }

}

function save_best() {
  //perform swap mutation on the current best car and the saved best car
  let saved_best = JSON.parse(localStorage.getItem("best_car"));
  let current_best = best_car.sensor.chromosome;
  if (saved_best) {
    //perform n swaps
    for (let i=0; i<3; i++) {
      const index = Math.floor(Math.random()*7);
      current_best[index] = saved_best[index];
    }
  }

  //save current best
  localStorage.setItem("best_car",
    JSON.stringify(current_best));
}

function delete_best() {
  localStorage.removeItem("best_car");
}

function animate() {
  //update player car
  for (let i=0; i<cars.length; i++) {
    cars[i].update(borders, []);
    //cars[i].update(borders, cars);
  }

  //reset and re-center canvas
  canvas.height = window.innerHeight;
  ctx.save();

  //follow car with "camera"
  ctx.translate(-best_car.x + (window.innerWidth/2), -best_car.y + canvas.height * 0.5);

  //draw road
  for (let i=0; i<roads.length; i++) {
    roads[i].draw(ctx);
  }

  //draw player cars
  ctx.globalAlpha = 0.2;
  for (let i=0; i<cars.length; i++) {
    cars[i].draw(ctx);
  }
  ctx.globalAlpha = 1;
  best_car.draw(ctx, true)

  ctx.restore();
  requestAnimationFrame(animate);
}
