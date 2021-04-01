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
let xScale = null;
let yScale = null;
let colorScale = null;
const WIDTH = window.innerWidth / 2;
const HEIGHT = 500;

//constants

function initConstants() {
  xScale = d3
    .scaleLinear()
    .domain([0, d3.max(billboardData, (d) => +d["Weeks on Chart"])])
    .range([0, WIDTH]);

  yScale = d3
    .scaleBand()
    .domain(billboardData.map((d) => +d["Week Position"]))
    .range([HEIGHT, 0]);

  colorScale = d3
    .scaleOrdinal(d3.schemeTableau10)
    .domain(billboardData.map((d) => d["SongID"]));
}

function createChart() {
  const container = d3
    .select("body")
    .append("svg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT)
    .attr("overflow", "visible");

  const g = container
    .selectAll("g")
    .data(billboardData)
    .enter()
    .append("g")
    .attr("transform", (d) => `translate(0, ${yScale(+d["Week Position"])})`);

  g.append("rect")
    .attr("width", (d) => xScale(+d["Weeks on Chart"]))
    .attr("height", yScale.bandwidth())
    .style("fill", (d) => colorScale(d["SongID"]));

  g.append("text")
    .attr("x", WIDTH)
    .attr("dx", "50")
    .attr("dy", "2em")
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
