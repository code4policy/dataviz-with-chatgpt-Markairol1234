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
        .attr("class", "y-axis")
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
        .attr("width", d => x(d.Count)) // Width corresponds to the Count
        .attr("fill", "blue") // Initial color
        .on("mouseover", function (event, d) {
            d3.select(this).attr("fill", "orange"); // Change color on hover
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill", "blue"); // Revert color on mouseout
        });

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

    // =========================
    // Add Citation
    // =========================
    svg.append("text")
        .attr("x", 0) // Align to the left
        .attr("y", height + margin.bottom - 5) // Position just below the x-axis
        .attr("text-anchor", "start") // Align text to the start
        .style("font-size", "10px") // Smaller font size for citation
        .style("fill", "#555") // Subtle gray color
        .text("Source: City of Boston 311 Data (2023)");

    // =========================
    // Create Checkboxes for Filtering
    // =========================
    const checkboxContainer = d3.select("#checkbox-container")
        .style("position", "fixed") // Change to fixed positioning
        .style("left", "10px") // Position the container on the left side
        .style("top", "50px"); // Adjust the top position as needed

    // Add "Select All" button on top
    checkboxContainer.append("div")
        .attr("class", "checkbox-item")
        .append("input")
        .attr("type", "button")
        .attr("id", "select-all")
        .attr("value", "Select All");

    // Use only the top 20 reasons for checkboxes
    const top20Reasons = data.slice(0, 20);

    top20Reasons.forEach(d => {
        const checkboxItem = checkboxContainer.append("div")
            .attr("class", "checkbox-item");

        checkboxItem.append("input")
            .attr("type", "checkbox")
            .attr("value", d.reason)
            .attr("checked", true)
            .on("change", updateChart);

        checkboxItem.append("label")
            .text(d.reason)
            .style("margin-left", "5px"); // Add some space between checkbox and text
    });

    // Function to update the chart based on selected checkboxes
    function updateChart() {
        const selectedReasons = checkboxContainer.selectAll("input:checked")
            .nodes()
            .map(d => d.value);

        const filteredData = data.filter(d => selectedReasons.includes(d.reason));

        // Update y scale domain
        y.domain(filteredData.map(d => d.reason));

        // Update bars
        const bars = svg.selectAll(".bar")
            .data(filteredData, d => d.reason);

        bars.enter().append("rect")
            .attr("class", "bar")
            .attr("y", d => y(d.reason))
            .attr("x", 0)
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.Count))
          .merge(bars)
            .transition()
            .duration(500)
            .attr("y", d => y(d.reason))
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.Count));

        bars.exit().remove(); // Remove bars for unchecked reasons

        // Update y-axis
        svg.select(".y-axis")
            .transition()
            .duration(500)
            .call(d3.axisLeft(y));
    }

    // =========================
    // Add event listener to the existing button to show more data
    d3.select('#show-more')
        .on('click', () => {
            // Load and process the full data again
            d3.csv("boston_311_2023_by_reason.csv").then(fullData => {
                // Parse the data and convert counts to numbers
                fullData.forEach(d => {
                    d.Count = +d.Count; // Ensure 'Count' is treated as a number
                });

                // Sort data by Count in descending order
                fullData.sort((a, b) => b.Count - a.Count);

                // Get the additional data (from 21st reason onwards)
                const additionalData = fullData.slice(20);

                // Append additional data to the existing data
                data = data.concat(additionalData);

                // Update y scale domain
                y.domain(data.map(d => d.reason));

                // Update x scale domain if necessary
                x.domain([0, d3.max(data, d => d.Count)]).nice();

                // Update bars
                const bars = svg.selectAll(".bar")
                    .data(data, d => d.reason);

                bars.enter().append("rect")
                    .attr("class", "bar")
                    .attr("y", d => y(d.reason))
                    .attr("x", 0)
                    .attr("height", y.bandwidth())
                    .attr("width", d => x(d.Count))
                    .attr("fill", "blue")
                    .on("mouseover", function (event, d) {
                        d3.select(this).attr("fill", "orange"); // Change color on hover
                    })
                    .on("mouseout", function () {
                        d3.select(this).attr("fill", "blue"); // Revert color on mouseout
                    })
                  .merge(bars)
                    .transition()
                    .duration(500)
                    .attr("y", d => y(d.reason))
                    .attr("height", y.bandwidth())
                    .attr("width", d => x(d.Count));

                bars.exit().remove(); // Remove bars for unchecked reasons

                // Update y-axis
                svg.select(".y-axis")
                    .transition()
                    .duration(500)
                    .call(d3.axisLeft(y));

                // Update x-axis
                svg.select(".x-axis")
                    .transition()
                    .duration(500)
                    .call(d3.axisBottom(x).ticks(10));
            }).catch(error => {
                console.error("Error loading or parsing data:", error);
            });
        });

    // =========================
    // Add event listener to the reset button to reset the chart
    d3.select('#reset-chart')
        .on('click', () => {
            // Uncheck all checkboxes
            checkboxContainer.selectAll("input")
                .property("checked", false);

            // Reset the chart to show all data
            updateChart();
        });

    // =========================
    // Add event listener to the toggle button to hide/show the chart
    d3.select('#toggle-chart')
        .on('click', () => {
            const bars = svg.selectAll(".bar");
            const isVisible = bars.style("display") !== "none";
            bars.style("display", isVisible ? "none" : "block");
        });

    // Add event listener to the select all button to display the corresponding chart
    d3.select('#select-all')
        .on('click', () => {
            // Check all checkboxes
            checkboxContainer.selectAll("input")
                .property("checked", true);

            // Update the chart to show all data
            updateChart();
        });

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

// =========================
// Function to Draw Bar Chart
// =========================
function drawBarChart(data) {
    // ...existing code to draw the bar chart using the provided data...
}
