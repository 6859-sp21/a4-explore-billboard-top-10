let gapminder = new Array();

d3.json(
  "https://raw.githubusercontent.com/vega/vega-datasets/master/data/gapminder.json"
).then((data) => {
  gapminder = data;
});

console.log(gapminder);

d3.select(".target") // select the elements that have the class 'target'
  .style("stroke-width", 8); // change their style: stroke width is not equal to 8 pixels

const LIMIT = 10;

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", window.innerWidth)
  .attr("height", 40);

const g = svg
  .append("g")
  .attr("transform", "translate(20, 20)")
  .style("opacity", 0.1)
  .attr("counter", 1); // Store the counter's state on a DOM node attribute.

const circle = g.append("circle").attr("r", 20).style("fill", "steelblue");

const label = g
  .append("text")
  .style("fill", "white")
  .style("font", "bold 1.2em sans-serif")
  .style("text-anchor", "middle")
  .attr("dy", "0.3em")
  .text(g.attr("counter"));

// Attach an event listener to the <g> that is called when any element within it is clicked.
// This function is passed the input event and, like other d3 selection functions, the current `datum`.
g.on("click", function (event, datum) {
  const count = Math.min(+g.attr("counter") + 1, LIMIT);
  label.text(count);
  g.style("opacity", count * 0.1).attr("counter", count);
});

g.on("dblclick", function (event, datum) {
  g.style("opacity", 0.1).attr("counter", 1);
  label.text(1);
});
