// example of a single song object
// {
//   "url": "http://www.billboard.com/charts/hot-100/1958-10-04",
//   "WeekID": "10/4/1958",
//   "Week Position": "10",
//   "Song": "Near You",
//   "Performer": "Roger Williams",
//   "SongID": "Near YouRoger Williams",
//   "Instance": "1",
//   "Previous Week Position": "10",
//   "Peak Position": "10",
//   "Weeks on Chart": "8"
// }

// Code based on https://observablehq.com/@d3/bar-chart-race-explained

let billboardData = new Array();
let currentBillboardData = new Array();
let container = null;
let xScale = null;
let yScale = null;
let colorScale = null;
const WIDTH = window.innerWidth / 2;
const HEIGHT = 500;
const MARGIN = {
  top: 10,
  right: 10,
  bottom: 20,
  left: 20,
};
let xMargin = null;
let yMargin = null;
let index = 0;
let PLAY_SPEED = 500;
let x = null;
let y = null;

let names = null;
const n = 10;

const duration = 500;
let prev = null;
let next = null;

let keyframes = new Array();
let nameframes = null;
let dateValues = null;
let updateBars = null;
let updateLabels = null;
let updateAxis = null;

//constants

function updateConstants() {
  xScale = d3
    .scaleLinear()
    .domain([0, d3.max(currentBillboardData, (d) => +d["Weeks on Chart"])])
    .range([0, WIDTH]);

  xMargin = xScale.copy().range([MARGIN.left, WIDTH - MARGIN.right]);

  yScale = d3
    .scaleBand()
    .domain(currentBillboardData.map((d) => +d["Week Position"]))
    .range([HEIGHT, 0]);

  yMargin = yScale.copy().range([HEIGHT - MARGIN.bottom, MARGIN.top]);

  colorScale = d3
    .scaleOrdinal(d3.schemeTableau10)
    .domain(currentBillboardData.map((d) => d["SongID"]));
}

function createChart() {
  container = d3
    .select("body")
    .append("svg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT)
    .attr("overflow", "visible");

  const g = container
    .selectAll("g")
    .data(currentBillboardData, function (d) {
      if (d !== undefined) {
        return d["SongID"];
      }
    })
    .enter()
    .append("g")
    .attr(
      "transform",
      (d) => `translate(${MARGIN.left}, ${yMargin(+d["Week Position"])})`
    );

  g.append("rect")
    .attr("width", (d) => xMargin(+d["Weeks on Chart"]) - xMargin(0))
    .attr("height", yMargin.bandwidth())
    .style("fill", (d) => colorScale(d["SongID"]));

  g.append("text")
    .attr("x", WIDTH)
    .attr("dx", "50")
    .attr("dy", "2em")
    .attr("fill", "black")
    .text((d) => d["Song"]);
}

function updateAxisOld() {
  container
    .append("g")
    .attr("transform", `translate(0, ${HEIGHT - MARGIN.bottom})`)
    .call(d3.axisBottom(xMargin))
    .append("text")
    .attr("text-anchor", "end")
    .attr("fill", "black")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .attr("x", WIDTH - MARGIN.right)
    .attr("y", 50)
    .text("Weeks on Chart");

  container
    .append("g")
    .attr("transform", `translate(${MARGIN.left}, 0)`)
    .call(d3.axisLeft(yMargin))
    .append("text")
    .attr("transform", `translate(20, ${MARGIN.top}) rotate(-90)`)
    .attr("y", -50)
    .attr("text-anchor", "end")
    .attr("fill", "black")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .text("Position on Chart");
}

function updateData() {
  currentBillboardData = billboardData.slice(10 * index, 10 * index + 10);
  console.log(currentBillboardData);
}

function updateChart() {
  let newChart = container.selectAll("g").data(currentBillboardData);

  console.dir(newChart);

  const g = newChart
    .enter()
    .append("g")
    .attr(
      "transform",
      (d) => `translate(${MARGIN.left}, ${yMargin(+d["Week Position"])})`
    );

  g.append("rect");
  g.append("text");

  newChart
    .select("rect")
    .attr("width", (d) => xMargin(+d["Weeks on Chart"]) - xMargin(0))
    .attr("height", yMargin.bandwidth())
    .style("fill", (d) => colorScale(d["SongID"]));

  newChart
    .select("text")
    .attr("x", WIDTH)
    .attr("dx", "50")
    .attr("dy", "2em")
    .attr("fill", "black")
    .text((d) => d["Song"]);

  const removedNodes = newChart.exit().remove();
}

// function createSlider() {
//   d3.select("#slider").on("change", function (d) {
//     index = +this.value;
//     console.log(`index changed to ${index}`);
//     updateData();
//     updateConstants();
//     updateChart();
//     updateAxis();
//   });
// }

function createSlider() {
  d3.select("#slider").on("change", function (d) {
    index = +this.value;
    console.log(`index changed to ${index}`);
    playOneFrame();
  });
}

// function createPlayButton() {
//   d3.select("#play").on("click", function (d) {
//     const animation = setInterval(incrementSlider, PLAY_SPEED);

//     function incrementSlider() {
//       if (+document.querySelector("#slider").value < 9) {
//         document.querySelector("#slider").value =
//           +document.querySelector("#slider").value + 1;
//         console.log(
//           `incrementing the slider, new value is ${
//             document.querySelector("#slider").value
//           }`
//         );
//         const event = new Event("change");
//         document.querySelector("#slider").dispatchEvent(event);
//       } else {
//         console.log("animation stopped");
//         clearInterval(animation);
//         document.querySelector("#slider").value = 0;
//       }
//     }
//   });
// }

// function incrementSlider() {
//   if (+document.querySelector("#slider").value < 9) {
//     document.querySelector("#slider").value =
//       +document.querySelector("#slider").value + 1;
//     console.log(
//       `incrementing the slider, new value is ${
//         document.querySelector("#slider").value
//       }`
//     );
//     const event = new Event("change");
//     document.querySelector("#slider").dispatchEvent(event);
//   } else {
//     console.log("animation stopped");
//     clearInterval(animation);
//     document.querySelector("#slider").value = 0;
//   }
// }

function createPlayButton() {
  d3.select("#play").on("click", () => {
    const animation = setInterval(incrementSlider, duration);
    function incrementSlider() {
      if (+document.querySelector("#slider").value < 199) {
        document.querySelector("#slider").value =
          +document.querySelector("#slider").value + 1;
        console.log(
          `incrementing the slider, new value is ${
            document.querySelector("#slider").value
          }`
        );
        const event = new Event("change");
        document.querySelector("#slider").dispatchEvent(event);
      } else {
        console.log("animation stopped");
        clearInterval(animation);
        document.querySelector("#slider").value = 0;
      }
    }
  });
}

function testNewMethod() {
  names = new Set(billboardData.map((d) => d["SongID"]));

  colorScale = d3.scaleOrdinal(d3.schemeTableau10);
  const categoryByName = new Set(billboardData.map((d) => d["SongID"]));
  colorScale.domain(categoryByName);

  dateValues = Array.from(
    d3.rollup(
      billboardData,
      //last place (rank 10) is evaluating to 1
      ([d]) =>
        new Object({
          "Week Position": +d["Week Position"],
          "Weeks on Chart": +d["Weeks on Chart"],
        }),
      (d) => d["WeekID"],
      (d) => d["SongID"]
    )
  )
    .map(([date, data]) => [new Date(date), data])
    .sort(([a], [b]) => d3.ascending(a["Week Position"], b["Week Position"]));

  console.log("Getting date values:");
  console.log(dateValues);

  for ([ka, a] of dateValues) {
    const t = 0;
    keyframes.push([
      new Date(ka),
      rank((name) => {
        return [
          a.get(name) === undefined
            ? Number.MAX_VALUE
            : a.get(name)["Week Position"],
          a.get(name) === undefined ? 0 : a.get(name)["Weeks on Chart"],
        ];
      }),
    ]);
  }

  console.log("Getting keyframes:");
  console.log(keyframes);

  nameframes = d3.groups(
    keyframes.flatMap(([, data]) => data),
    (d) => d["SongID"]
  );

  console.log("Getting nameframes");
  console.log(nameframes);

  prev = new Map(
    nameframes.flatMap(([, data]) => d3.pairs(data, (a, b) => [b, a]))
  );

  next = new Map(nameframes.flatMap(([, data]) => d3.pairs(data)));

  console.log("prev");
  console.log(prev);
  console.log("next");
  console.log(next);

  container = d3
    .select("body")
    .append("svg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT)
    .attr("overflow", "visible");

  updateBars = bars(container);
  updateLabels = labels(container);
  updateAxis = axis(container);
}

function axis(svg) {
  const g = svg.append("g").attr("transform", `translate(0,${MARGIN.top})`);

  return ([date, data], transition) => {
    x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => +d["Weeks on Chart"])])
      .range([MARGIN.left, WIDTH - MARGIN.right]);

    const axis = d3
      .axisTop(x)
      .ticks(WIDTH / 160)
      .tickSizeOuter(0)
      .tickSizeInner(-48 * (n + y.padding()));

    g.transition(transition).call(axis);
    g.select(".tick:first-of-type text").remove();
    g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "white");
    g.select(".domain").remove();
  };
}

function labels(svg) {
  let label = svg
    .append("g")
    .style("font", "bold 12px var(--sans-serif)")
    .style("font-variant-numeric", "tabular-nums")
    .attr("text-anchor", "end")
    .selectAll("text");

  function textTween(a, b) {
    const i = d3.interpolateNumber(a, b);
    return function (t) {
      this.textContent = formatNumber(i(t));
    };
  }

  formatNumber = d3.format(",d");

  return ([date, data], transition) =>
    (label = label
      .data(data.slice(0, n), (d) => d["SongID"])
      .join(
        (enter) =>
          enter
            .append("text")
            .attr(
              "transform",
              (d) => `translate(0,${y((prev.get(d) || d).rank)})`
            )
            .attr("y", y.bandwidth() / 2)
            .attr("x", WIDTH)
            .attr("dy", "-0.25em")
            .text((d) => d["SongID"])
            .call((text) =>
              text
                .append("tspan")
                .attr("fill-opacity", 0.7)
                .attr("font-weight", "normal")
                .attr("x", WIDTH)
                .attr("dy", "1.15em")
            ),
        (update) => update,
        (exit) =>
          exit
            .transition(transition)
            .remove()
            .attr(
              "transform",
              (d) => `translate(0,${y((next.get(d) || d).rank)})`
            )
            .call((g) =>
              g
                .select("tspan")
                .tween("text", (d) =>
                  textTween(
                    d["Weeks on Chart"],
                    (next.get(d) || d)["Weeks on Chart"]
                  )
                )
            )
      )
      .call((bar) =>
        bar
          .transition(transition)
          .attr("transform", (d) => `translate(0,${y(d.rank)})`)
          .call((g) =>
            g
              .select("tspan")
              .tween("text", (d) =>
                textTween(
                  (prev.get(d) || d)["Weeks on Chart"],
                  d["Weeks on Chart"]
                )
              )
          )
      ));
}

function rank(value) {
  const data = Array.from(names, (name) => ({
    SongID: name,
    "Week Position": value(name)[0],
    "Weeks on Chart": value(name)[1],
  }));
  data.sort((a, b) => d3.ascending(a["Week Position"], b["Week Position"]));
  //Week position of 0 = not on chart (or rank 10)
  //Week position of 10 = hit number 1 (or rank 0)
  for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
  return data;
}

function bars(svg) {
  let bar = svg.append("g").attr("fill-opacity", 0.6).selectAll("rect");

  x = d3.scaleLinear([0, 30], [MARGIN.left, WIDTH - MARGIN.right]);

  let barSize = 48;

  y = d3
    .scaleBand()
    .domain(d3.range(n + 1))
    .rangeRound([MARGIN.top, MARGIN.top + barSize * (n + 1 + 0.1)])
    .padding(0.1);

  return ([date, data], transition) => {
    x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => +d["Weeks on Chart"])])
      .range([MARGIN.left, WIDTH - MARGIN.right]);
    return (bar = bar
      .data(data.slice(0, n), (d) => d["SongID"])
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("fill", (d) => colorScale(d["SongID"]))
            .attr("height", y.bandwidth())
            .attr("x", x(0))
            .attr("y", (d) => y((prev.get(d) || d).rank))
            .attr("width", (d) => {
              // console.log(`entering:`);
              // console.dir(d);
              //console.log(prev.get(d));
              return x((prev.get(d) || d)["Weeks on Chart"]) - x(0);
            }),
        (update) => update,
        (exit) =>
          exit
            .transition(transition)
            .remove()
            .attr("y", (d) => y((next.get(d) || d).rank))
            .attr("width", (d) => {
              console.log(next.get(d));
              x((next.get(d) || d)["Weeks on Chart"]) - x(0);
            })
      )
      .call((bar) =>
        bar
          .transition(transition)
          .attr("y", (d) => y(d.rank))
          .attr("width", (d) => x(d["Weeks on Chart"]) - x(0))
      ));
  };
}

async function playOneFrame() {
  for (const keyframe of keyframes.slice(index, index + 1)) {
    const transition = container
      .transition()
      .duration(duration)
      .ease(d3.easeLinear);

    updateAxis(keyframe, transition);
    updateBars(keyframe, transition);
    updateLabels(keyframe, transition);
    await transition.end();
  }
}

function getData() {
  const data = d3
    .csv(
      "https://raw.githubusercontent.com/6859-sp21/a4-explore-billboard-top-10/main/Hot%20Stuff%20Missing%20Weeks%20Added.csv"
    )
    .then((data) => {
      billboardData = data.slice(-20000);
      billboardData = billboardData.filter((d) => +d["Week Position"] <= 15);
      console.log("done fetching data");
      // updateData();
      // updateConstants();
      // createChart();
      // updateAxis();
      createSlider();
      createPlayButton();
      testNewMethod();
    });
}

getData();
