// =========================
// Set Dimensions and Margins
// =========================
const margin = { top: 20, right: 30, bottom: 50, left: 200 }; // Increased left margin to fix text clash
const width = 1000 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// =========================
// Create SVG Container
// =========================
const svg = d3.select("#chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// =========================
// Load and Process Data
// =========================
d3.csv("boston_311_2023_by_reason.csv").then(data => {
    // Parse the data and convert counts to numbers
    data.forEach(d => {
        d.Count = +d.Count; // Ensure 'Count' is treated as a number
    });

    // Sort data by Count in descending order
    data.sort((a, b) => b.Count - a.Count);

    // Slice to get only the top 20 reasons
    data = data.slice(0, 20);

    // =========================
    // Create Scales
    // =========================
    // Create the y-axis scale (categorical)
    const y = d3.scaleBand()
        .domain(data.map(d => d.reason)) // Use the sorted and sliced data
        .range([0, height])
        .padding(0.2);

    // Create the x-axis scale (numerical)
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Count)])
        .nice()
        .range([0, width]);

    // =========================
    // Add Axes
    // =========================
    // Add the y-axis (reason categories)
    svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .attr("class", "axis-label")
        .style("font-size", "12px") // Adjust font size for better fit
        .style("text-anchor", "end") // Align text to the end for better readability
        .call(wrapText, 180); // Custom function to wrap text

    // Add the x-axis (Count values)
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(10))
        .selectAll("text")
        .attr("class", "axis-label")
        .style("font-size", "12px"); // Adjust font size for consistency

    // =========================
    // Create Bars
    // =========================
    svg.selectAll(".bar")
        .data(data)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("y", d => y(d.reason)) // Align bars based on the categorical axis
        .attr("x", 0) // Start bars at the origin (x=0)
        .attr("height", y.bandwidth()) // Set height based on band size
        .attr("width", d => x(d.Count)); // Width corresponds to the Count

    // =========================
    // Add Labels
    // =========================
    // Add x-axis label
    svg.append("text")
        .attr("y", height + margin.bottom - 10)
        .attr("x", width / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "14px") // Adjust label font size
        .text("Count");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "14px") // Adjust label font size
        .text("Reason for Call");

}).catch(error => {
    // =========================
    // Handle Errors
    // =========================
    console.error("Error loading or parsing data:", error);
});

// =========================
// Custom Function to Wrap Text
// =========================
function wrapText(text, width) {
    text.each(function () {
        const textElement = d3.select(this);
        const words = textElement.text().split(/\s+/).reverse();
        let word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = textElement.attr("y"),
            dy = parseFloat(textElement.attr("dy")) || 0,
            tspan = textElement.text(null)
                .append("tspan")
                .attr("x", 0)
                .attr("y", y)
                .attr("dy", dy + "em");

        while ((word = words.pop())) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = textElement.append("tspan")
                    .attr("x", 0)
                    .attr("y", y)
                    .attr("dy", ++lineNumber * lineHeight + dy + "em")
                    .text(word);
            }
        }
    });
}
