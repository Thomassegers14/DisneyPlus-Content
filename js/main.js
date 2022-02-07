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
  left: width > 600 ? 30 : 48
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

const xDate = d3.scaleTime()
  .range([0, innerWidth]);

const y = d3.scaleLinear()
  .range([innerHeight, 0])

const yDate = d3.scaleTime()
  .range([innerHeight, 0])

const xAxis = d3.axisTop(x)
  .tickSize(innerHeight)
  .tickPadding(12)
  .tickFormat(d3.format("d"))

const yAxis = d3.axisLeft(y)
  .tickSize(-width)
  .tickPadding(12)
  .tickFormat(d3.format("d"))

var updateData;

const radius = width > 600 ? 5 : 3

// get the data
d3.csv("data/data.csv").then(function(data) {

  updateData = data;

  data.forEach((d) => {
    d.date_added = parseDate(d.date_added);
    d.imdb_score = +d.imdb_score;
    d.histId = +d.histId;
    d.year = +d.year
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
    .html(`<h3 class="tooltip__title">${d.titel}<span> ${d.year}</span></h3><p>Click to see more</p>`)
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
    .html(`<h3 class="tooltip__title">${d.titel}<span> ${d.year}</span></h3><p>IMDB rating: ${d.imdb_score}</p><p><a href=${d.trailer} target="_blank">Watch the trailer</a></p>`)
    .style("left", (event.x) - 75 + "px") // It is important to put the +12: other wise the tooltip is exactly where the point is an it creates a weird effect
    .style("top", (event.y) + 24 + "px")

  event.stopPropagation()

}

const drawScatterPlot = function(inputdata) {

  if (width > 600) {

    x.domain(d3.extent(inputdata, d => {
      return +d.imdb_score
    }))

    y.domain(d3.extent(inputdata, d => {
      return +d.histId
    }))

  } else {

    x.domain(d3.extent(inputdata, d => {
        return +d.histId
      }))
      .range([0, innerWidth]);

    y.domain(d3.extent(inputdata, d => {
        return +d.imdb_score
      }))
      .range([innerHeight, 0]);
  }

  svg.append('text')
    .attr('class', `axis__label axis__label--x ${width > 600 ? "" : "axis--hide"}`)
    .attr('x', innerWidth / 2)
    .attr('y', 0)
    .attr('dy', '24px')
    .attr("text-anchor", "middle")
    .text('IMDB SCORE')

  svg.append('text')
    .attr('class', `axis__label axis__label--y ${width > 600 ? "axis--hide" : ""}`)
    .attr('x', 0)
    .attr('y', 0)
    .attr('dy', 24)
    .attr('dx', -innerHeight / 2)
    .attr("text-anchor", "middle")
    .attr("transform", `translate(${0},${0}) rotate(${-90})`)
    .text('IMDB SCORE')

  svg.append("g")
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(xAxis);

  svg.append('g')
    .attr('class', 'axis axis--y')
    .call(yAxis)

  if (width > 600) {
    svg.select('.axis--y').classed('axis--hide', true)
  } else {
    svg.select('.axis--x').classed('axis--hide', true)
  }

  d3.selectAll('.axis').select('.domain').remove()

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
    .attr("r", radius)
    .transition()
    .delay((d, i) => i * 0.25)
    .attr("cx", d => width > 600 ? x(+d.imdb_score) : x(+d.histId))
    .transition()
    .delay((d, i) => i * 0.25)
    .attr("cy", d => width > 600 ? y(+d.histId) : y(+d.imdb_score))

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

  if (width > 600) {
    xVar = xInput;
    yVar = yInput
  } else {
    xVar = yInput;
    yVar = xInput;
  }

  x.domain(d3.extent(updateData, d => {
    return +d[xVar]
  }))

  y.domain(d3.extent(updateData, d => {
    return +d[yVar]
  }))

  // When we want to hide the y-axis (or x-axis on mobile)
  switch (yInput) {
    case "histId":

      svg.select(width > 600 ? '.axis--y' : '.axis--x')
        .classed('axis--hide', true)
        .call(width > 600 ? yAxis : xAxis)

      svg.select(width > 600 ? '.axis__label--x' : '.axis__label--y')
        .text(width > 600 ? xVar : yVar)
      svg.select(width > 600 ? '.axis__label--y' : '.axis__label--x')
        .classed('axis--hide', true)
        .text(yVar)

      break;
    default:

      svg.select(width > 600 ? '.axis--y' : '.axis--x')
        .classed('axis--hide', false)
        .call(width > 600 ? yAxis : xAxis);

      svg.select(width > 600 ? '.axis__label--x' : '.axis__label--y')
        .classed('axis--hide', false)
        .text(width > 600 ? xVar : yVar)
      svg.select(width > 600 ? '.axis__label--y' : '.axis__label--x')
        .classed('axis--hide', false)
        .text(width > 600 ? yVar : xVar)

  }

  // When we want to hide the x-axis (or y-axis on mobile)
  switch (xInput) {
    case "date_added":

      if (width > 600) {
        xDate.domain(d3.extent(updateData, d => {
          return +d[xVar]
        }))
      } else {
        yDate.domain(d3.extent(updateData, d => {
          return +d[yVar]
        }))
      }

      svg.select(width > 600 ? '.axis--x' : '.axis--y')
        .call(width > 600 ?
          d3.axisTop(xDate)
          .tickSize(innerHeight)
          .tickPadding(12)
          .tickFormat(d3.timeFormat('%b %y')) :

          d3.axisLeft(yDate)
          .tickSize(-width)
          .tickPadding(12)
          .tickFormat(d3.timeFormat('%b %y')))

      break;
    default:
      svg.select(width > 600 ? '.axis--x' : '.axis--y')
        .call(width > 600 ? xAxis : yAxis);
  }

  d3.selectAll('.axis').select('.domain').remove()

  svg
    .selectAll("circle")
    .transition()
    .delay((d, i) => i * 0.25)
    .attr("cx", d => yInput == "date_added" ? xDate(d[xVar]) : x(+d[xVar]))
    .attr("cy", d => yInput == "date_added" ? yDate(d[yVar]) : y(+d[yVar]))

}