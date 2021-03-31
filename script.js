let billboardData = new Array();
let xScale = null;
let colorScale = null;
const WIDTH = window.innerWidth / 2;
let HEIGHT = null;
const BAR_HEIGHT = 25;

//constants

function initConstants() {
  xScale = d3
    .scaleLinear()
    .domain([1, d3.max(billboardData, (d) => d["Weeks on Chart"])])
    .range([0, WIDTH]);

  colorScale = d3
    .scaleOrdinal(d3.schemeTableau10)
    .domain(billboardData.map((d) => d["SongID"]));

  HEIGHT = `${billboardData.length * BAR_HEIGHT}px`;
}

function createChart() {
  const container = d3
    .select("body")
    .append("svg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT)
    .attr("overflow", "visible");

  const barChart = container
    .selectAll("rect")
    .data(billboardData)
    .join("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * BAR_HEIGHT)
    .attr("width", (d) => xScale(d["Weeks on Chart"]))
    .attr("height", BAR_HEIGHT)
    .style("fill", (d) => colorScale(d["SongID"]))
    .style("stroke", "white");

  container
    .selectAll("text")
    .data(billboardData)
    .join("text")
    .attr("x", WIDTH)
    .attr("y", (d, i) => i * BAR_HEIGHT)
    .attr("dx", "200")
    .attr("dy", "1.2em")
    .attr("fill", "black")
    .text((d) => d["Song"]);
}

function getData() {
  const data = d3
    .csv(
      "https://raw.githubusercontent.com/6859-sp21/a4-explore-billboard-top-10/main/Hot%20Stuff-%20top%2010%20only.csv"
    )
    .then((data) => {
      billboardData = data.reverse().splice(-1000);
      billboardData = billboardData.filter(
        (d) => +d["Week Position"] <= 10 && d["WeekID"] === "10/4/1958"
      );
      console.log("done fetching data");
      initConstants();
      createChart();
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
