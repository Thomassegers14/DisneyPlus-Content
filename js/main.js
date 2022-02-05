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
  .range([0, innerHeight])

// get the data
d3.csv("data/data.csv").then(function(data) {

  drawDotPlot(data)

});

const drawDotPlot = function(data) {

  x.domain(d3.extent(data, d => {
    return +d.imdb_score
  }))

  svg.append("g")
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(
      d3.axisTop(x)
      .tickSize(innerHeight)
      .tickPadding(12)
    );

  d3.selectAll('.axis').select('.domain').remove()

  // set the parameters for the histogram
  const histogram = d3.histogram()
    .value(function(d) {
      return d.imdb_score;
    }) // I need to give the vector of value
    .domain(x.domain()) // then the domain of the graphic
    .thresholds(x.ticks(200)); // then the numbers of bins

  // And apply this function to data to get the bins
  const bins = histogram(data).filter(d => d.length > 0)

  const radius = 5

  showGraphAnnotations(data)

  //g container for each bin
  const binContainer = svg.selectAll(".gBin")
    .data(bins);

  const binContainerEnter = binContainer.enter()
    .append("g")
    .attr("class", "gBin")
    .attr("transform", d => `translate(${x(d.x0)}, ${innerHeight/2 + (d.length * radius)})`)

  //need to populate the bin containers with data the first time
  binContainerEnter.selectAll("circle")
    .data(d => d.map((p, i) => {
      return {
        idx: i,
        jaar: p.jaar,
        type: p.soort,
        titel: p.titel,
        imdb_score: p.imdb_score,
        link: p.kijken,
        trailer: p.trailer,
        radius: radius
      }
    }))
    .enter()
    .append("circle")
    .attr("class", d => `dot dot__${d.type}`)
    .attr("cx", 0) //g element already at correct x pos
    .attr("cy", function(d) {
      return -d.idx * 2 * d.radius;
    })
    // .attr("r", 0)
    .attr("r", function(d) {
      return (d.length == 0) ? 0 : d.radius;
    })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)
    .on("click", showDescription)

  d3.select("body").on("click", function() {
    fixedTooltip
      .classed('tooltip__fixed--active', false)
      .transition()
      .duration(200)
      .style("opacity", 0)

  })

}

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
    .attr("r", function(d) {
      return (d.length == 0) ? 0 : d.radius;
    })
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

  const data = inputdata.filter(function(d) {
    return !isNaN(+d.imdb_score) & !isNaN(+d.jaar);
  })

  x.domain(d3.extent(data, d => {
    return +d.jaar
  }))

  y.domain([10, 1])

  svg.append("g")
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(
      d3.axisTop(x)
      .tickSize(innerHeight)
      .tickPadding(12)
    );

  svg.append('g')
    .attr('class', 'axis axis--y')
    .call(d3.axisLeft(y)
      .tickSize(-width)
      .ticks(width > 600 ? 10 : 4))
    .call(g => g.selectAll('.tick text')
      .attr('text-anchor', 'start')
      .attr('x', 0)
      .attr('dy', -4))

  d3.selectAll('.axis').select('.domain').remove()

  const radius = 5

  //need to populate the bin containers with data the first time
  svg.selectAll("circle")
    .data(d => data.map((p, i) => {
      return {
        idx: i,
        jaar: p.jaar,
        type: p.soort,
        titel: p.titel,
        imdb_score: p.imdb_score,
        link: p.kijken,
        trailer: p.trailer,
        radius: radius
      }
    }))
    .enter()
    .append("circle")
    .attr("class", d => `dot dot__${d.type}`)
    .attr("cx", d => x(d.jaar) + Math.random() * (1 - 0.5 + 1) + 0.5) //g element already at correct x pos
    .attr("cy", d => y(d.imdb_score))
    // .attr("r", 0)
    .attr("r", function(d) {
      return (d.length == 0) ? 0 : d.radius;
    })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)
    .on("click", showDescription)

  d3.select("body").on("click", function() {
    fixedTooltip
      .classed('tooltip__fixed--active', false)
      .transition()
      .duration(200)
      .style("opacity", 0)

  })

}