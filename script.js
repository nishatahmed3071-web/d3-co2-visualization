import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Margin and size for the SVG canvas
const margin = { top: 45, right: 30, bottom: 40, left: 250 };
const width = 800;  // Width of the pie chart
const height = 500; // Height of the pie chart

const svg = d3.select("#chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let globalData; // Store data globally so buttons can use it

// Load CSV and process it
d3.csv("CO2.csv").then(function (data) {
    console.log("Data loaded:", data.length, "rows");

    // Process the data
    data.forEach(d => {
        d.CO2_Emission = +d["CO2 emission (Tons)"] || 0;
        d.Population = +d["Population(2022)"] || 0;
        d.Year = +d.Year || 0;
        d.Area = +d.Area || 0;
        d.Country = d.Country || "Unknown";
    });

    // Get data for year 2020 (most recent in your dataset)
    const year2020Data = data.filter(d => d.Year === 2020 && d.CO2_Emission > 0);
    
    // Sort by CO2 emission (descending) and get top 5
    const topCountries = year2020Data
        .sort((a, b) => b.CO2_Emission - a.CO2_Emission)
        .slice(0, 5);

    console.log("Top 5 countries in 2020:", topCountries);

    // Calculate additional metrics for context
    const worldTotal2020 = year2020Data.reduce((sum, d) => sum + d.CO2_Emission, 0);
    
    topCountries.forEach(country => {
        country.EmissionPerCapita = country.CO2_Emission / (country.Population || 1);
        country.ShareOfWorld = (country.CO2_Emission / worldTotal2020 * 100).toFixed(1);
        country.FormattedEmission = d3.format(",.0f")(country.CO2_Emission);
    });

    globalData = topCountries;
    createPieChart(globalData, "2020");

}).catch((error) => {
    console.error("Error loading CSV:", error);
});

// Button for pie chart toggle
document.getElementById('pieChartBtn').addEventListener('click', () => {
    if (globalData) {
        clearSVG();
        createPieChart(globalData, "2020");
    }
});

// Clear SVG before drawing a new chart
function clearSVG() {
    svg.selectAll("*").remove();  // Clear any existing chart
}

// Create Pie Chart Visualization
function createPieChart(data, year) {
    console.log(`Pie chart rendering for ${year} with data:`, data);

    const radius = Math.min(width, height) / 2.5; // Adjust radius to fit in the SVG

    const pie = d3.pie()
        .value(d => d.CO2_Emission)
        .sort(null);  // Don't sort by default

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    // Create a label arc for better label positioning
    const labelArc = d3.arc()
        .innerRadius(radius * 0.5)  // Position labels inside the pie
        .outerRadius(radius * 0.5);

    // Color scale for the slices
    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.Country))
        .range(d3.schemeSet3);  // Use a color scheme that provides good contrast

    // Create the pie chart group, positioning it in the center
    const pieGroup = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const arcs = pieGroup.selectAll("path")
        .data(pie(data))
        .enter()
        .append("g")
        .attr("class", "slice");

    // Draw pie slices
    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.Country))
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("class", "pie-slice");

    // Add labels inside the slices
    arcs.append("text")
        .attr("transform", d => `translate(${labelArc.centroid(d)})`)
        .attr("dy", "0.35em")
        .style("font-size", "11px")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .style("pointer-events", "none")
        .text(d => {
            const percentage = ((d.endAngle - d.startAngle) / (2 * Math.PI) * 100).toFixed(1);
            return `${percentage}%`;
        });

    // Add legend on the right side
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 200}, 20)`);

    const legendItems = legend.selectAll(".legend-item")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 25})`);

    legendItems.append("rect")
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", d => color(d.Country))
        .attr("rx", 3)  // Rounded corners
        .attr("ry", 3);

    legendItems.append("text")
        .attr("x", 25)
        .attr("y", 15)
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .text(d => d.Country);

    // Add emission values to legend
    legendItems.append("text")
        .attr("x", 25)
        .attr("y", 30)
        .style("font-size", "10px")
        .style("fill", "#666")
        .text(d => `${d.FormattedEmission} tons`);

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .style("fill", "#2c3e50")
        .text(`Top 5 CO2 Emitting Countries (${year})`);

    // Add subtitle
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 5)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#7f8c8d")
        .style("font-style", "italic")
        .text("Based on CO2 emissions in tons");

    // Add tooltip
    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "rgba(255, 255, 255, 0.95)")
        .style("padding", "12px")
        .style("border", "1px solid #ddd")
        .style("border-radius", "6px")
        .style("box-shadow", "0 2px 8px rgba(0,0,0,0.1)")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("font-family", "Arial, sans-serif")
        .style("font-size", "12px")
        .style("z-index", "1000");

    // Add hover effects
    arcs.select(".pie-slice")
        .on("mouseover", function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("transform", "scale(1.02)");

            const perCapita = d.data.EmissionPerCapita || 0;
            
            tooltip
                .style("opacity", 1)
                .html(`
                    <div style="margin-bottom: 5px; font-weight: bold; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 5px;">
                        ${d.data.Country}
                    </div>
                    <div style="margin: 3px 0;"><strong>CO2 Emissions:</strong> ${d.data.FormattedEmission} tons</div>
                    <div style="margin: 3px 0;"><strong>Share of World:</strong> ${d.data.ShareOfWorld}%</div>
                    <div style="margin: 3px 0;"><strong>Per Capita:</strong> ${perCapita.toFixed(2)} tons/person</div>
                    <div style="margin: 3px 0;"><strong>Population:</strong> ${d3.format(",")(d.data.Population)}</div>
                    <div style="margin-top: 8px; font-size: 10px; color: #7f8c8d;">
                        Click for details
                    </div>
                `);
        })
        .on("mousemove", function(event) {
            tooltip
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 15) + "px");
        })
        .on("mouseout", function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("transform", "scale(1)");

            tooltip.style("opacity", 0);
        })
        .on("click", function(event, d) {
            console.log(`Clicked on ${d.data.Country}: ${d.data.FormattedEmission} tons`);
            // You can add more interactive features here
            alert(`${d.data.Country} emitted ${d.data.FormattedEmission} tons of CO2 in ${year}\nThat's ${d.data.ShareOfWorld}% of global emissions!`);
        });

    // Add total emissions text in center
    const totalEmissions = data.reduce((sum, d) => sum + d.CO2_Emission, 0);
    pieGroup.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.5em")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", "#2c3e50")
        .text("Top 5 Total:");

    pieGroup.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "1em")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "#e74c3c")
        .text(d3.format(",.0f")(totalEmissions) + " tons");

    // Add source note
    svg.append("text")
        .attr("x", width - 10)
        .attr("y", height + 30)
        .attr("text-anchor", "end")
        .style("font-size", "10px")
        .style("fill", "#95a5a6")
        .style("font-style", "italic")
        .text("Source: CO2.csv dataset");
}