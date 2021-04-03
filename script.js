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

function updateAxis() {
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

function createSlider() {
  d3.select("#slider").on("change", function (d) {
    index = +this.value;
    console.log(`index changed to ${index}`);
    updateData();
    updateConstants();
    updateChart();
    updateAxis();
  });
}

function createPlayButton() {
  d3.select("#play").on("click", function (d) {
    const animation = setInterval(incrementSlider, PLAY_SPEED);

    function incrementSlider() {
      if (+document.querySelector("#slider").value < 9) {
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

function getData() {
  const data = d3
    .csv(
      "https://raw.githubusercontent.com/6859-sp21/a4-explore-billboard-top-10/main/Hot%20Stuff-%20top%2010%20only.csv"
    )
    .then((data) => {
      billboardData = data.reverse().slice(-1000);
      billboardData = billboardData.filter((d) => +d["Week Position"] <= 10);
      console.log("done fetching data");
      updateData();
      updateConstants();
      createChart();
      updateAxis();
      createSlider();
      createPlayButton();
    });
}

getData();

// d3.select(".target") // select the elements that have the class 'target'
//   .style("stroke-width", 8); // change their style: stroke width is not equal to 8 pixels

// const LIMIT = 10;

// const svg = d3
//   .select("body")
//   .append("svg")
//   .attr("width", window.innerWidth)
//   .attr("height", 40);

// const g = svg
//   .append("g")
//   .attr("transform", "translate(20, 20)")
//   .style("opacity", 0.1)
//   .attr("counter", 1); // Store the counter's state on a DOM node attribute.

// const circle = g.append("circle").attr("r", 20).style("fill", "steelblue");

// const label = g
//   .append("text")
//   .style("fill", "white")
//   .style("font", "bold 1.2em sans-serif")
//   .style("text-anchor", "middle")
//   .attr("dy", "0.3em")
//   .text(g.attr("counter"));

// // Attach an event listener to the <g> that is called when any element within it is clicked.
// // This function is passed the input event and, like other d3 selection functions, the current `datum`.
// g.on("click", function (event, datum) {
//   const count = Math.min(+g.attr("counter") + 1, LIMIT);
//   label.text(count);
//   g.style("opacity", count * 0.1).attr("counter", count);
// });

// g.on("dblclick", function (event, datum) {
//   g.style("opacity", 0.1).attr("counter", 1);
//   label.text(1);
// });
