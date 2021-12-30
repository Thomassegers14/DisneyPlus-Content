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

// get the data
d3.csv("data/data.csv").then(function(data) {

  // X axis: scale and draw:
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => {
      return +d.imdb_score
    }))
    .range([0, innerWidth]);

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

  // Y axis: scale and draw:
  const y = d3.scaleLinear()
    .range([innerHeight / 2, 0]);

  const tooltip = d3.select(".dotplot")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")

  const mouseover = function(event, d) {
    tooltip.transition().style("opacity", 1)

    const dot = d3.select(this)
    dot.raise().classed('dot--hover', true)
      .transition()
      .duration(100)
      .attr('r', 10)
  }

  const mousemove = function(event, d) {
    tooltip
      .html(`<h3 class="tooltip__title">${d.titel}<span> ${d.jaar}</span></h3><p>${d.imdb_score}</p>`)
      .style("left", (event.x) - 75 + "px") // It is important to put the +12: other wise the tooltip is exactly where the point is an it creates a weird effect
      .style("top", (event.y) + 24 + "px")
  }

  // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
  const mouseleave = function(event, d) {
    tooltip.style("opacity", 0)

    const dot = d3.select(this)
    dot.classed('dot--hover', false)
      .transition()
      .duration(600)
      .attr("r", function(d) {
        return (d.length == 0) ? 0 : d.radius;
      })
  }

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
        titel: p.titel,
        imdb_score: p.imdb_score,
        // radius: (x(d.x1)-x(d.x0))/2
        radius: radius
      }
    }))
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", 0) //g element already at correct x pos
    .attr("cy", function(d) {
      return -d.idx * 2 * d.radius;
    })
    .attr("r", 0)
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)
    .transition()
    .duration(500)
    .delay(function(d) {
      return Math.random() * 400;
    })
    .attr("r", function(d) {
      return (d.length == 0) ? 0 : d.radius;
    })

});