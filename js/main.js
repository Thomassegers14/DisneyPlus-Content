const hideStartScreen = function() {
  d3.selectAll('.startScreen')
    .transition()
    .duration(500)
    .style('opacity', 0)
    .remove()
}

const btns = document.getElementsByClassName("button");

for (var i = 0; i < btns.length; i++) {
  btns[i].addEventListener("click", function() {
    var current = document.getElementsByClassName("button--active");
    current[0].className = current[0].className.replace(" button--active", "");
    this.className += " button--active";

    const x = this.value;
    document.getElementById("explanation").innerHTML = x;
  })
}

// Grab the graph wrapper
const $graphWrapper = d3.select('.dotplot')

// Clear it to be sure
$graphWrapper.selectAll('*').remove()

// Set outer dimensions
const {
  width,
  height
} = $graphWrapper.node().getBoundingClientRect()

const margin = {
  top: 30,
  right: 30,
  bottom: 30,
  left: 30
}

const parseDate = d3.timeParse('%Y-%m-%d')

// Set inner dimensions
const innerWidth = width - margin.left - margin.right
const innerHeight = height - margin.top - margin.bottom

// append the svg object to the body of the page
const svg = $graphWrapper
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

var clickFlag = false;

const tooltip = d3.select(".dotplot")
  .append("div")
  .style("opacity", 0)
  .attr("class", "tooltip")

const fixedTooltip = d3.select(".dotplot")
  .append("div")
  .style("opacity", 0)
  .attr("class", "tooltip__fixed")

const x = d3.scaleLinear()
  .range([0, innerWidth]);

const y = d3.scaleLinear()
  .range([innerHeight, 0])

const xAxis = d3.axisTop(x)
  .tickSize(innerHeight)
  .tickPadding(12)
  .tickFormat(d3.format("d"))

const yAxis = d3.axisLeft(y)
  .tickSize(-width)
  .ticks(width > 600 ? 10 : 4)

var updateData;

const radius = 5

// get the data
d3.csv("data/data.csv").then(function(data) {

  updateData = data;

  data.forEach((d) => {
    d.date = parseDate(d.date);
    d.imdb_score = +d.imdb_score;
    d.histId = +d.histId;
    d.jaar = +d.jaar
  })

  drawScatterPlot(data)

});

const mouseover = function(event, d) {
  tooltip
    .classed('tooltip--active', true)
    .transition()
    .style("opacity", 1)

  const dot = d3.select(this)
  dot.raise().classed('dot--hover', true)
    .transition()
    .duration(100)
    .attr('r', 10)
}

const mousemove = function(event, d) {
  tooltip
    .html(`<h3 class="tooltip__title">${d.titel}<span> ${d.jaar}</span></h3>`)
    .style("left", (event.x) - 75 + "px") // It is important to put the +12: other wise the tooltip is exactly where the point is an it creates a weird effect
    .style("top", (event.y) + 24 + "px")
}

// A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
const mouseleave = function(event, d) {
  tooltip
    .classed('tooltip--active', false)
    .transition()
    .duration(200)
    .style("opacity", 0)

  const dot = d3.select(this)
  dot.classed('dot--hover', false)
    .transition()
    .duration(600)
    .attr("r", radius)
}

const showDescription = function(event, d) {
  fixedTooltip
    .classed('tooltip__fixed--active', true)
    .transition()
    .style("opacity", 1)

  fixedTooltip
    .html(`<h3 class="tooltip__title">${d.titel}<span> ${d.jaar}</span></h3><p>${d.imdb_score}</p><p>${d.trailer}</p><p>${d.link}</p>`)
    .style("left", (event.x) - 75 + "px") // It is important to put the +12: other wise the tooltip is exactly where the point is an it creates a weird effect
    .style("top", (event.y) + 24 + "px")

  event.stopPropagation()

}

const showGraphAnnotations = function(data) {
  // Add zero line
  svg.append('line')
    .attr('class', 'meanLine')
    .attr('x1', x(d3.median(data, d => +d.imdb_score)))
    .attr('x2', x(d3.median(data, d => +d.imdb_score)))
    .attr('y1', 0)
    .attr('y2', innerHeight)

  svg.append('line')
    .attr('class', 'meanLine')
    .attr('x1', x(d3.quantile(data, 0.10, d => +d.imdb_score)))
    .attr('x2', x(d3.quantile(data, 0.10, d => +d.imdb_score)))
    .attr('y1', 0)
    .attr('y2', innerHeight)

  svg.append('line')
    .attr('class', 'meanLine')
    .attr('x1', x(d3.quantile(data, 0.90, d => +d.imdb_score)))
    .attr('x2', x(d3.quantile(data, 0.90, d => +d.imdb_score)))
    .attr('y1', 0)
    .attr('y2', innerHeight)

  svg.append('text')
    .attr('class', 'dotplotAnnotation')
    .attr('text-anchor', 'middle')
    .attr('x', x(d3.quantile(data, 0.50, d => +d.imdb_score)) + (x(d3.quantile(data, 0.90, d => +d.imdb_score)) - x(d3.quantile(data, 0.50, d => +d.imdb_score))) / 2)
    .attr('y', 0)
    .attr('dy', '2rem')
    .text('above average')

  svg.append('text')
    .attr('class', 'dotplotAnnotation')
    .attr('text-anchor', 'middle')
    .attr('x', x(d3.quantile(data, 0.10, d => +d.imdb_score)) + (x(d3.quantile(data, 0.50, d => +d.imdb_score)) - x(d3.quantile(data, 0.10, d => +d.imdb_score))) / 2)
    .attr('y', 0)
    .attr('dy', '2rem')
    .text('below average')

  svg.append('text')
    .attr('class', 'dotplotAnnotation')
    .attr('text-anchor', 'middle')
    .attr('x', x(d3.quantile(data, 0, d => +d.imdb_score)) + (x(d3.quantile(data, 0.10, d => +d.imdb_score)) - x(d3.quantile(data, 0, d => +d.imdb_score))) / 2)
    .attr('y', 0)
    .attr('dy', '2rem')
    .text('bad')

  svg.append('text')
    .attr('class', 'dotplotAnnotation')
    .attr('text-anchor', 'middle')
    .attr('x', x(d3.quantile(data, 0.9, d => +d.imdb_score)) + (x(d3.quantile(data, 1, d => +d.imdb_score)) - x(d3.quantile(data, 0.9, d => +d.imdb_score))) / 2)
    .attr('y', 0)
    .attr('dy', '2rem')
    .text('good')
}

const drawScatterPlot = function(inputdata) {

  x.domain(d3.extent(inputdata, d => {
    return +d.imdb_score
  }))

  y.domain(d3.extent(inputdata, d => {
    return +d.histId
  }))

  svg.append("g")
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(xAxis);

  svg.append('g')
    .attr('class', 'axis axis--y axis--hide')
    .call(yAxis)

  d3.selectAll('.axis').select('.domain').remove()

  const radius = 5

  //need to populate the bin containers with data the first time
  svg.append('g')
    .selectAll("dot")
    .data(inputdata)
    .join("circle")
    .attr("class", d => `dot dot__${d.soort}`)
    .attr("cx", 0)
    .attr("cy", innerHeight / 2)
    .attr("r", 0)
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)
    .on("click", showDescription)
    .transition()
    .delay((d, i) => i * 0.25)
    .attr("r", radius)
    .transition()
    .delay((d, i) => i * 0.25)
    .attr("cx", d => x(+d.imdb_score))
    .transition()
    .delay((d, i) => i * 0.25)
    .attr("cy", d => y(+d.histId))

  d3.select("body").on("click", function() {
    fixedTooltip
      .classed('tooltip__fixed--active', false)
      .transition()
      .duration(200)
      .style("opacity", 0)

  })

}

// A function that create / update the plot for a given variable:
const update = function(xInput, yInput) {

  x.domain(d3.extent(updateData, d => {
    return +d[xInput]
  }))

  y.domain(d3.extent(updateData, d => {
    return +d[yInput]
  }))

  svg.select('.axis--x')
    .call(xAxis);

  if (yInput != "histId") {
    svg.select('.axis--y').classed('axis--hide', false)
      .call(yAxis);
  } else {
    svg.select('.axis--y').classed('axis--hide', true)
  }

  d3.selectAll('.axis').select('.domain').remove()

  svg
    .selectAll("circle")
    .transition()
    .delay((d, i) => i * 0.25)
    .attr("cx", d => x(+d[xInput]))
    .attr("cy", d => y(+d[yInput]))

}