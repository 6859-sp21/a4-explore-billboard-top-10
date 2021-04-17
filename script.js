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
const n = 10;
const barSize = 32;
const animationLabelCount = 4;
let billboardData = new Array();
let currentBillboardData = new Array();
let container = null;
let colorScale = null;
const WIDTH = window.innerWidth / 2 - 100;
const HEIGHT = barSize * (n + 1 - 0.4);
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

let animationDelay = 1000;
const DELAY = 750;
let prev = null;
let next = null;

let keyframes = new Array();
let nameframes = null;
let dateValues = null;
let dateToIndex = null;
let dates = null;
let indexToDate = null;
let updateBars = null;
let updateLabels = null;
let updateAxis = null;

let songIDtoMetaData = null;
const animationSlider = document.querySelector("#animation-slider");
const animationDelayP = document.querySelector("#animation-delay");
const animationPlayButton = document.querySelector("#play");
const animationStopButton = document.querySelector("#stop");
const animationPlayContainer = document.querySelector("#play-container");
const animationStopContainer = document.querySelector("#stop-container");
const nextButton = document.querySelector("#next");
const previousButton = document.querySelector("#previous");
const dateP = document.querySelector("#date");
const filterInputs = document.querySelectorAll(".filter");
const dateSelector = document.querySelector("#date-selection");
const labelsElement = document.querySelector("#labels");
const genresSelected = new Set();
const sliderLabels = new Array();
const tooltipElement = document.querySelector(".tooltip");
const imgElement = document.querySelector("img");
const audioElement = document.querySelector("audio");
const songPlayingElement = document.querySelector("#song-playing");

let numberOfWeeks = 0;
let data = [];

let tooltip = null;

//constants

function initializeConstants() {
  y = d3
    .scaleBand()
    .domain(d3.range(1, n + 2))
    .rangeRound([MARGIN.top, MARGIN.top + barSize * (n + 2)])
    .padding(0.1);

  colorScale = d3
    .scaleOrdinal(d3.schemeTableau10)
    .domain(currentBillboardData.map((d) => d["SongID"]));

  tooltip = d3.select(".tooltip");
}

function createSlider() {
  d3.select("#animation-slider").on("input", function (d) {
    index = +this.value;
    console.log(`index changed to ${index}`);
    updateHTMLElements();
    playOneFrame();
    updateBarsOnClick();
  });

  d3.select("#delay-slider").on("input", function (d) {
    animationDelay = +this.value;
    console.log(`animation delay changed to ${animationDelay}`);
    animationDelayP.innerHTML = this.value;
  });
}

function updateHTMLElements() {
  animationSlider.max = numberOfWeeks - 1;
  dateP.innerHTML = indexToDate.get(index).toDateString();

  nextButton.disabled = index === numberOfWeeks - 1;
  previousButton.disabled = index === 0;
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
      removeTooltips();
    } else {
      console.log("animation stopped");
      clearInterval(animation);
      animationSlider.value = 0;
      animationPlayContainer.hidden = false;
      animationStopContainer.hidden = true;
      tooltipElement.hidden = false;
    }
  }

  d3.select("#play").on("click", () => {
    animationPlayContainer.hidden = true;
    animationStopContainer.hidden = false;
    tooltipElement.hidden = true;
    animation = setInterval(incrementSlider, animationDelay + DELAY);
  });

  d3.select("#stop").on("click", () => {
    clearInterval(animation);
    animationPlayContainer.hidden = false;
    animationStopContainer.hidden = true;
    tooltipElement.hidden = false;
    updateBarsOnClick();
  });

  d3.select("#previous").on("click", () => {
    animationSlider.value = +animationSlider.value - 1;
    console.log(
      `incrementing the slider, new value is ${animationSlider.value}`
    );
    const event = new Event("input");
    animationSlider.dispatchEvent(event);
  });

  d3.select("#next").on("click", () => {
    animationSlider.value = +animationSlider.value + 1;
    console.log(
      `incrementing the slider, new value is ${animationSlider.value}`
    );
    const event = new Event("input");
    animationSlider.dispatchEvent(event);
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
    updateBarsOnClick();
    initializeSongPlayer();
  });
}

// function initializeDateSelector() {
//   dateToIndex.forEach((index, date) => {
//     const optionElement = document.createElement("option");
//     optionElement.setAttribute("value", index);
//     optionElement.innerHTML = date.toDateString();
//     dateSelector.appendChild(optionElement);
//   });

//   d3.select("#date-selection").on("change", function (d) {
//     animationSlider.value = this.value;
//     console.log(`selecting new date, new index is ${this.index}`);
//     const event = new Event("input");
//     animationSlider.dispatchEvent(event);
//   });
// }

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
  dates = dateValues.map(([ka, _]) => new Date(ka));

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
      Album: song["album"],
      isPop: song["isPop"],
      isRap: song["isRap"],
      isCountry: song["isCountry"],
      "isR&B": song["isR&B"],
      isHipPop: song["isHipPop"],
      "Preview URL": song["Preview URL"],
      "Album Image URL": song["Album Image URL"],
      "Spotify Genre List": song["Spotify Genre List"],

      //Genres: JSON.parse(song["Spotify Track ID"].trim().replace('"', "")),
      // Genres: JSON.parse(song["Spotify Track ID"]),

      "Weeks on Chart":
        a.get(songID) === undefined ? 0 : +a.get(songID)["Weeks on Chart"],
    };
  });
  data.sort((a, b) => d3.ascending(a["Week Position"], b["Week Position"]));
  data.forEach((d, i) => {
    d.rank = Math.min(i, n) + 1;
  });
  return data;
}

function initializeSvg() {
  container = d3
    .select(".container")
    .append("svg")
    .attr("class", "viz")
    .attr("width", WIDTH)
    .attr("height", HEIGHT);

  updateBars = bars(container);
  updateAxis = axis(container);
  updateLabels = labels(container);
}

function initializeAxesLabels() {
  container
    .append("text")
    .style("font-size", "16px")
    .call(d3.axisTop(x))
    .attr("fill", "black")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .attr("x", WIDTH / 2)
    .attr("y", -20)
    .text("Weeks on Top 100 Chart");

  container
    .append("g")
    .attr("transform", `translate(${MARGIN.left}, 0)`)
    .style("font-size", "14px")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", `translate(20, ${HEIGHT / 2.75}) rotate(-90)`)
    .attr("y", -50)
    .attr("text-anchor", "end")
    .attr("fill", "black")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text("Rank on Chart");

  var months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const firstLabel = document.createElement("li");
  const middleLabel = document.createElement("li");
  const lastLabel = document.createElement("li");
  firstLabel.innerHTML =
    months[dates[0].getMonth()] + " " + dates[0].getFullYear();
  middleLabel.innerHTML =
    months[dates[Math.floor(dates.length / 2)].getMonth()] +
    " " +
    dates[Math.floor(dates.length / 2)].getFullYear();
  lastLabel.innerHTML =
    months[dates[dates.length - 1].getMonth()] +
    " " +
    dates[dates.length - 1].getFullYear();
  labelsElement.appendChild(firstLabel);
  labelsElement.appendChild(middleLabel);
  labelsElement.appendChild(lastLabel);
}

function updateScales([_, data]) {
  x = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => +d["Weeks on Chart"])])
    .range([MARGIN.left, WIDTH - MARGIN.right]);
}

function axis(svg) {
  const g = svg
    .append("g")
    .attr("transform", `translate(0,${MARGIN.top})`)
    .style("font-size", "14px");

  return (_, transition) => {
    const axis = d3
      .axisTop(x)
      .ticks(WIDTH / 160)
      .tickSizeOuter(0)
      .tickSizeInner(-barSize * (n + 1));

    g.transition(transition).call(axis);
    g.select(".tick:first-of-type text").remove();
    g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "white");
    g.select(".domain").remove();
  };
}

function labels(svg) {
  let label = svg.append("g").selectAll("text");

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
              (d) =>
                `translate(${x((prev.get(d) || d)["Weeks on Chart"])},${y(
                  (prev.get(d) || d).rank
                )})`
            )
            .attr("y", y.bandwidth() / 2)
            .attr("x", "0.25em")
            .attr("dy", "0.275em")
            .text((d) => d["Song"] + " - " + d["Performer"]),
        (update) => update,
        (exit) =>
          exit
            .transition(transition)
            .remove()
            .attr(
              "transform",
              (d) =>
                `translate(${x((next.get(d) || d)["Weeks on Chart"])},${y(
                  (next.get(d) || d).rank
                )})`
            )
      )
      .call((bar) =>
        bar
          .transition(transition)
          .attr(
            "transform",
            (d) => `translate(${x(d["Weeks on Chart"])},${y(d.rank)})`
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
            ),
        (update) => update,
        (exit) =>
          exit
            .transition(transition)
            .remove()
            .attr("y", (d) => y((next.get(d) || d).rank))
            .attr("width", (d) => {
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

function updateBarsOnClick() {
  d3.selectAll("rect")
    .on("mouseover", function (event, d) {
      d3.select(this).transition().duration("50").attr("opacity", ".95");

      tooltip.transition().duration(50).style("opacity", 0.95);
      const img = `<img class="tooltip-image" src="${d["Album Image URL"]}"/>`;
      const tooltipString = `<div class="tooltip-container">${img} 
      <div><p>${d["Song"]}</p>
      <p>Artist: ${d["Performer"]}</p>
      <p>Album: ${d["Album"]}</p>
      <p>Genres: ${d["Spotify Genre List"]}</p>
      <p class="ital">Click to play preview</p></div></div>`;
      tooltip
        .html(tooltipString)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 15 + "px");
    })
    .on("mouseout", function (event, d) {
      d3.select(this).transition().duration("50").attr("opacity", "1");
      tooltip.transition().duration("0").style("opacity", 0);
      tooltip.style("left", "0px").style("top", "0px");
      tooltip.html("");
    })
    .on("click", function (event, d) {
      console.log(`clicked on:`);
      console.log(d);
      imgElement.src = d["Album Image URL"];
      songPlayingElement.innerHTML = `${d["Song"]} - ${d["Performer"]}`;
      audioElement.querySelector("source").src = d["Preview URL"];
      audioElement.load();
    });
}

function removeTooltips() {
  d3.selectAll("rect")
    .on("mouseover", null)
    .on("mouseout", null)
    .on("click", null);
}

function initializeSongPlayer() {
  const d = keyframes[0][1][0];
  imgElement.src = d["Album Image URL"];
  songPlayingElement.innerHTML = `${d["Song"]} - ${d["Performer"]}`;
  audioElement.querySelector("source").src = d["Preview URL"];
  audioElement.load();
}

function getData() {
  d3.csv(
    "https://raw.githubusercontent.com/6859-sp21/a4-explore-billboard-top-10/main/Hot%20Stuff%20Final%20Dataset.csv"
  ).then((allData) => {
    data = allData.slice(-15600, -5200);
    billboardData = data;
    console.log("done fetching data");
    initializeConstants();
    createSlider();
    createPlayButton();
    initializeGenreFilters();
    initializeSvg();
    updateDataTranforms();
    //initializeDateSelector();
    updateHTMLElements();
    playOneFrame();
    initializeAxesLabels();
    updateBarsOnClick();
    initializeSongPlayer();
  });
}

getData();
