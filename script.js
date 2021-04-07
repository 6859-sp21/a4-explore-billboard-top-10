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

let animationDelay = 1000;
const DELAY = 100;
let prev = null;
let next = null;

let keyframes = new Array();
let nameframes = null;
let dateValues = null;
let dateToIndex = null;
let indexToDate = null;
let updateBars = null;
let updateLabels = null;
let updateAxis = null;

let songIDtoMetaData = null;
const barSize = 48;
const animationSlider = document.querySelector("#animation-slider");
const animationDelayP = document.querySelector("#animation-delay");
const animationPlayButton = document.querySelector("#play");
const animationStopButton = document.querySelector("#stop");
const dateP = document.querySelector("#date");
const filterInputs = document.querySelectorAll(".filter");
const dateSelector = document.querySelector("#date-selection");
const genresSelected = new Set();

let numberOfWeeks = 0;
let data = [];

let tooltip = null;

//constants

function initializeConstants() {
  y = d3
    .scaleBand()
    .domain(d3.range(n + 1))
    .rangeRound([MARGIN.top, MARGIN.top + barSize * (n + 1 + 0.1)])
    .padding(0.1);

  colorScale = d3
    .scaleOrdinal(d3.schemeTableau10)
    .domain(currentBillboardData.map((d) => d["SongID"]));

  tooltip = d3.select(".tooltip");
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

function createSlider() {
  d3.select("#animation-slider").on("input", function (d) {
    index = +this.value;
    console.log(`index changed to ${index}`);
    updateHTMLElements();
    playOneFrame();
  });

  d3.select("#delay-slider").on("input", function (d) {
    animationDelay = +this.value;
    console.log(`animation delay changed to ${animationDelay}`);
    animationDelayP.innerHTML = this.value;
  });
}

function updateHTMLElements() {
  animationSlider.max = numberOfWeeks - 1;
  dateP.innerHTML = indexToDate.get(index);
}

function createPlayButton() {
  let animation = null;
  function incrementSlider() {
    if (+animationSlider.value < numberOfWeeks - 1) {
      animationSlider.value = +animationSlider.value + 1;
      console.log(
        `incrementing the slider, new value is ${animationSlider.value}`
      );
      const event = new Event("input");
      animationSlider.dispatchEvent(event);
    } else {
      console.log("animation stopped");
      clearInterval(animation);
      animationSlider.value = 0;
      animationPlayButton.disabled = false;
      animationStopButton.disabled = true;
    }
  }

  d3.select("#play").on("click", () => {
    animationPlayButton.disabled = true;
    animationStopButton.disabled = false;
    animation = setInterval(incrementSlider, animationDelay + DELAY);
  });

  d3.select("#stop").on("click", () => {
    clearInterval(animation);
    animationPlayButton.disabled = false;
    animationStopButton.disabled = true;
  });
}

function initializeGenreFilters() {
  console.log("initializing genre filters");
  d3.selectAll(".filter").on("change", function (d) {
    console.log(d);
    if (d.target.checked) {
      console.log("adding");
      genresSelected.add(d.target.name);
    } else {
      genresSelected.delete(d.target.name);
    }
    console.log(`genres selected are:`);
    console.dir(genresSelected);
    filterData();
    updateDataTranforms();
    updateHTMLElements();
    playOneFrame();
  });
}

function initializeDateSelector() {
  dateToIndex.forEach((index, date) => {
    const optionElement = document.createElement("option");
    optionElement.setAttribute("key", index);
    optionElement.innerHTML = date;
    dateSelector.appendChild(optionElement);
  });

  d3.select("#date-selection").on("change", function (d) {
    console.log(d.target);
    animationSlider.value = +animationSlider.value + 1;
    console.log(
      `incrementing the slider, new value is ${animationSlider.value}`
    );
    const event = new Event("input");
    animationSlider.dispatchEvent(event);
  });
}

function filterData() {
  billboardData = data.filter((d) => {
    if (genresSelected.size > 0) {
      return Array.from(genresSelected).some((genre) => d[genre] === "TRUE");
    } else {
      return true;
    }
  });
}

function updateDataTranforms() {
  names = new Set(billboardData.map((d) => d["SongID"]));

  songIDtoMetaData = d3.rollup(
    billboardData,
    (v) => v[0],
    (d) => d["SongID"]
  );

  console.log("Initializing meta data for songs:");
  console.log(songIDtoMetaData);

  dateValues = Array.from(
    d3.rollup(
      billboardData,
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
    .sort(([a], [b]) => d3.ascending(a, b));

  console.log("Getting date values:");
  console.log(dateValues);

  dateToIndex = new Map(dateValues.map(([ka, _], i) => [new Date(ka), i]));
  indexToDate = new Map(dateValues.map(([ka, _], i) => [i, new Date(ka)]));

  console.log("Initializing dateToIndex:");
  console.log(dateToIndex);
  console.log("Initialziing indexToDate");
  console.log(indexToDate);

  keyframes = [];

  for ([ka, a] of dateValues) {
    keyframes.push([new Date(ka), getRankAndMeta(a)]);
  }

  numberOfWeeks = keyframes.length;

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
}

function getRankAndMeta(a) {
  const data = Array.from(names, (songID) => {
    const song = songIDtoMetaData.get(songID);
    return {
      SongID: songID,
      "Week Position":
        a.get(songID) === undefined
          ? Number.MAX_VALUE
          : +a.get(songID)["Week Position"],
      Performer: song["Performer"],
      Song: song["Song"],
      //Genres: JSON.parse(song["Spotify Track ID"].trim().replace('"', "")),
      // Genres: JSON.parse(song["Spotify Track ID"]),

      "Weeks on Chart":
        a.get(songID) === undefined ? 0 : +a.get(songID)["Weeks on Chart"],
    };
  });
  data.sort((a, b) => d3.ascending(a["Week Position"], b["Week Position"]));
  data.forEach((d, i) => {
    d.rank = Math.min(i, n);
  });
  return data;
}

function initializeSvg() {
  container = d3
    .select("body")
    .append("svg")
    .attr("class", "viz")
    .attr("width", WIDTH)
    .attr("height", HEIGHT)
    .attr("overflow", "visible");

  updateBars = bars(container);
  updateLabels = labels(container);
  updateAxis = axis(container);
}

function initializeAxesLabels() {
  // container
  //   .append("g")
  //   .attr("transform", `translate(0, ${HEIGHT - MARGIN.bottom})`)
  //   .call(d3.axisBottom(x))
  container
    .append("text")
    .attr("text-anchor", "end")
    .attr("fill", "black")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .attr("x", 100)
    .attr("y", -20)
    .text("Weeks on Chart");

  container
    .append("g")
    .attr("transform", `translate(${MARGIN.left}, 0)`)
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", `translate(20, ${MARGIN.top}) rotate(-90)`)
    .attr("y", -50)
    .attr("text-anchor", "end")
    .attr("fill", "black")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .text("Rank on Chart");
}

function updateScales([_, data]) {
  x = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => +d["Weeks on Chart"])])
    .range([MARGIN.left, WIDTH - MARGIN.right]);
}

function axis(svg) {
  const g = svg.append("g").attr("transform", `translate(0,${MARGIN.top})`);

  return (_, transition) => {
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
    .selectAll("text");

  function textTween(a, b) {
    const i = d3.interpolateNumber(a, b);
    return function (t) {
      //this.textContent = "Weeks on Chart: " + formatNumber(i(t));
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
            //.text((d) => d["SongID"])
            .text((d) => d["Song"] + " - " + d["Performer"])
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

function bars(svg) {
  let bar = svg.append("g").attr("fill-opacity", 0.6).selectAll("rect");

  return ([date, data], transition) =>
    (bar = bar
      .data(data.slice(0, n), (d) => d["SongID"])
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("fill", (d) => colorScale(d["SongID"]))
            .attr("height", y.bandwidth())
            .attr("x", x(0))
            .attr("y", (d) => y((prev.get(d) || d).rank))
            .attr(
              "width",
              (d) => x((prev.get(d) || d)["Weeks on Chart"]) - x(0)
            )
            .on("mouseover", function (event, d) {
              d3.select(this)
                .transition()
                .duration("50")
                .attr("opacity", ".85");

              tooltip.transition().duration(50).style("opacity", 0.85);
              console.log(event, d, this);
              tooltip
                .html(d["SongID"])
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 15 + "px");
            })
            .on("mouseout", function (d, i) {
              d3.select(this).transition().duration("50").attr("opacity", "1");
              tooltip.transition().duration("50").style("opacity", 0);
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
}

function playOneFrame() {
  for (const keyframe of keyframes.slice(index, index + 1)) {
    const transition = container
      .transition()
      .duration(animationDelay)
      .ease(d3.easeLinear);

    updateScales(keyframe);

    updateAxis(keyframe, transition);
    updateBars(keyframe, transition);
    updateLabels(keyframe, transition);
  }
}

function getData() {
  d3.csv(
    "https://raw.githubusercontent.com/6859-sp21/a4-explore-billboard-top-10/main/Hot%20Stuff%20Missing%20Weeks%20Added.csv"
  ).then((allData) => {
    data = allData.slice(-10000, -5000);
    billboardData = data;
    console.log("done fetching data");
    initializeConstants();
    createSlider();
    createPlayButton();
    initializeGenreFilters();
    initializeSvg();
    updateDataTranforms();
    initializeDateSelector();
    updateHTMLElements();
    playOneFrame();
    initializeAxesLabels();
  });
}

getData();
