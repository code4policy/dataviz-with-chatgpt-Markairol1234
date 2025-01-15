// Set dimensions and margins
const margin = { top: 20, right: 30, bottom: 150, left: 60 };
const width = 1000 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create SVG container
const svg = d3.select("#chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Load the data from CSV
d3.csv("boston_311_2023_by_reason.csv").then(data => {
    // Parse the data and convert counts to numbers
    data.forEach(d => {
        d.Count = +d.Count; // Ensure 'Count' is treated as a number
    });

    // Sort data by Count in descending order
    data.sort((a, b) => b.Count - a.Count);

    // Create the x-axis scale
    const x = d3.scaleBand()
        .domain(data.map(d => d.reason)) // Use the sorted data
        .range([0, width])
        .padding(0.2);

    // Create the y-axis scale
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Count)])
        .nice()
        .range([height, 0]);

    // Add the x-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-30)")  // Adjust angle for better readability
        .style("text-anchor", "end")
        .attr("class", "axis-label");

    // Add the y-axis
    svg.append("g")
        .call(d3.axisLeft(y).ticks(10))
        .selectAll("text")
        .attr("class", "axis-label");

    // Create bars
    svg.selectAll(".bar")
        .data(data)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.reason))
        .attr("y", d => y(d.Count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.Count));

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 10)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .text("Count");

    // Add x-axis label
    svg.append("text")
        .attr("y", height + margin.bottom - 20)
        .attr("x", width / 2)
        .attr("text-anchor", "middle")
        .text("Reason for Call");
}).catch(error => {
    console.error("Error loading or parsing data:", error);
});
