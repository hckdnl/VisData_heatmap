import React, { useEffect, useState } from "react";
import * as d3 from "d3";
import "./App.css";

function App() {
  const [data, setData] = useState([]);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipStyle, setTooltipStyle] = useState({ visibility: 'hidden', opacity: 0 });
  const [dataYear, setDataYear] = useState('');

  useEffect(() => {
    d3.json(
      "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json"
    ).then((response) => {
      const processedData = response.monthlyVariance.map((d) => ({
        ...d,
        year: d.year,
        month: d.month - 1,
        temperature: response.baseTemperature + d.variance,
      }));
      setData(processedData);
      if (processedData.length > 0) {
        createHeatMap(processedData, response.baseTemperature);
      }
    });
  }, []);

  const createHeatMap = (data, baseTemperature) => {
    const heatMapContainer = d3.select("#heat-map");
    heatMapContainer.selectAll("*").remove();


    const margin = { top: 20, right: 20, bottom: 30, left: 70 };
    const width = Math.floor(1400 - margin.left - margin.right);
    const height = Math.floor(500 - margin.top - margin.bottom);

    const svg = heatMapContainer
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
      .range([0, width])
      .domain(data.map(d => d.year))
      .padding(0);

    const yScale = d3.scaleBand()
      .range([height, 0])
      .domain([...Array(12).keys()].reverse())
      .padding(0);

    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateInferno)
      .domain([d3.min(data, d => d.temperature), d3.max(data, d => d.temperature)]);

    const tooltip = d3.select("body").append("div")
      .attr("id", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "lightgrey")
      .style("border", "1px solid black")
      .style("border-radius", "5px")
      .style("padding", "5px")
      .style("pointer-events", "none");

    svg.selectAll(".cell")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("data-month", d => d.month)
      .attr("data-year", d => d.year)
      .attr("data-temp", d => d.temperature)
      .attr("x", d => xScale(d.year))
      .attr("y", d => yScale(d.month))
      .attr("width", xScale.bandwidth()+0.6)
      .attr("height", yScale.bandwidth()+0.5)
      .style("fill", d => colorScale(d.temperature))
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .style("stroke", "black")
          .style("stroke-width", "2px")
          .style("shape-rendering", "crispEdges");
          
      
        const tooltipHtml = `${d.year} - ${d3.timeFormat("%B")(new Date(0, d.month))}<br>${d.temperature.toFixed(1)}°C<br> ${(d.temperature - baseTemperature).toFixed(1)}°C`;
        
        setTooltipContent(tooltipHtml);
        setDataYear(d.year.toString());
        setTooltipStyle({
          visibility: 'visible',
          opacity: 0.9,
          left: `${event.pageX -50}px`, // Adjust this if needed
          top: `${event.pageY - 100}px`// Position slightly above the cursor
        });
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget)
          .style("stroke", "none")
          .style("stroke-width", 0); 
      
        setTooltipContent('');
        setDataYear('');
        setTooltipStyle({ visibility: 'hidden', opacity: 0 });
      });

    svg.append("g")
      .attr("id", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter(year => year % 10 === 0)));

    svg.append("g")
      .attr("id", "y-axis")
      .call(d3.axisLeft(yScale).tickFormat(month => d3.timeFormat("%B")(new Date(0, month))));

    // Legend size and positioning
    const legendWidth = 400;
    const legendHeight = 20;
    const legendRectWidth = legendWidth / colorScale.ticks().length;

    // Legend scale - maps temperature values to x positions
    const legendXScale = d3.scaleLinear()
      .domain([2.8, 12.8]) // Set this to your temperature range
      .range([0, legendWidth]);

    // Define the axis for the legend
    const legendAxis = d3.axisBottom(legendXScale)
      .tickSize(10)
      .tickValues(colorScale.ticks().map(tick => tick))
      .tickFormat(d3.format(".1f")); // Format the tick labels to one decimal place

    // Append the legend SVG to the container
    const legendSvg = heatMapContainer.append("svg")
      .attr("id", "legend")
      .attr("width", width)
      .attr("height", legendHeight + 20) // Add space for the axis
      .style("margin-top", "5px");

    // Append colored rectangles to the legend
    legendSvg.selectAll("rect")
      .data(colorScale.ticks())
      .enter()
      .append("rect")
      .attr("x", (d, i) => i * legendRectWidth)
      .attr("y", 0)
      .attr("width", legendRectWidth)
      .attr("height", legendHeight)
      .style("fill", d => colorScale(d));

    // Append the axis to the legend
    legendSvg.append("g")
      .attr("transform", `translate(0,${legendHeight})`)
      .call(legendAxis);
  };

  return (
    <div className="App">
      <h1 id="title">Global Temperature Heat Map</h1>
      <p id="description">1753 - 2015: base temperature 8.66℃</p>
      <div id="heat-map"></div>
      <div id="tooltip" style={tooltipStyle} dangerouslySetInnerHTML={{ __html: tooltipContent }} data-year={dataYear}></div> 
    </div>
  
  );
}

export default App;
