d3.csv("traffic_weekly.csv").then(csv => {
	////////////////////////////////////////////////////////////
	//// Process Data //////////////////////////////////////////
	////////////////////////////////////////////////////////////
	const csvTransformed = csv.map(d => ({
		name: d.name,
		date: d.date * 1000,
		value: +d.total_1 + +d.total_2
	}));

	const data = d3
		.nest()
		.key(d => d.name)
		.sortValues((a, b) => a.date - b.date)
		.entries(csvTransformed)
		.map(d => ((d.sum = d3.sum(d.values, d => d.value)), d))
		.sort((a, b) => b.sum - a.sum);

	////////////////////////////////////////////////////////////
	//// Setup /////////////////////////////////////////////////
	////////////////////////////////////////////////////////////
	const svg = d3.select(".chart");
	const scheme = "schemeOrRd";
	const step = 15;
	const yRangeMax = 75;
	const margin = {
		top: 0,
		right: 16,
		bottom: 32,
		left: 112
	};
	const svgWidth = svg.node().clientWidth;
	const width = svgWidth - margin.left - margin.right;
	const height = (data.length - 1) * step + yRangeMax;
	const svgHeight = height + margin.top + margin.bottom;

	// Scale
	const x = d3
		.scaleUtc()
		.domain([
			data[0].values[0].date,
			data[0].values[data[0].values.length - 1].date
		])
		.range([0, width]);

	const y = d3
		.scaleLinear()
		.domain([0, d3.max(data, d => d3.max(d.values, d => d.value))])
		.range([0, -yRangeMax]);

	const colorRange = ["#FA6", "#D65", "#936", "#525"];
	const colorDomain = d3.range(colorRange.length).map(d => {
		return (
			data[data.length - 1].sum -
			((data[data.length - 1].sum - data[0].sum) / (colorRange.length - 1)) * d
		);
	});

	const color = d3
		.scaleLinear()
		.domain(colorDomain)
		.range(colorRange);

	// Axis
	const xAxis = g =>
		g
			.call(
				d3
					.axisBottom(x)
					.ticks(width / 80)
					.tickSizeOuter(0)
			)
			.call(g => g.select(".domain").remove());

	const yAxis = g =>
		g
			.call(
				d3
					.axisLeft(y)
					.ticks(4)
					.tickSizeOuter(0)
			)
			.call(g => g.select(".domain").remove())
			.call(g => g.select(".tick").remove());

	// Path generator
	const area = d3
		.area()
		.curve(d3.curveBasis)
		.defined(d => !isNaN(d.value))
		.x(d => x(d.date))
		.y0(0)
		.y1(d => y(d.value));

	const line = area.lineY1();

	// Containers
	svg.attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
	const g = svg
		.append("g")
		.attr("transform", `translate(${margin.left},${margin.top})`);

	////////////////////////////////////////////////////////////
	//// Render ////////////////////////////////////////////////
	////////////////////////////////////////////////////////////
	// Render axis
	const gAxis = g
		.append("g")
		.attr("class", "axis")
		.attr("transform", `translate(0,${height})`);
	const gXAxis = gAxis
		.append("g")
		.attr("class", "x")
		.call(xAxis);
	const gYAxis = gAxis
		.append("g")
		.attr("class", "y")
		.style("opacity", 0)
		.call(yAxis);

	const group = g
		.append("g")
		.selectAll("g")
		.data(data)
		.join("g")
		.attr("transform", (d, i) => `translate(0,${i * step + yRangeMax})`)
		.on("mouseenter", mouseenter)
		.on("mouseleave", mouseleave);

	// Group label
	group
		.append("text")
		.attr("x", -4)
		.attr("text-anchor", "end")
		.text(d => d.key);

	// Ridgeline plot area
	group
		.append("path")
		.attr("fill", d => color(d.sum))
		.attr("d", d => area(d.values));

	// Ridgeline plot line
	group
		.append("path")
		.attr("fill", "none")
		.attr("stroke", "#fff")
		.attr("d", d => line(d.values));

	group
		.append("line")
		.attr("stroke", "#fff")
		.attr("x1", x.range()[0])
		.attr("y1", y.range()[0])
		.attr("x2", x.range()[0])
		.attr("y2", d => y(d.values[0].value));

	group
		.append("line")
		.attr("stroke", "#fff")
		.attr("x1", x.range()[1])
		.attr("y1", y.range()[0])
		.attr("x2", x.range()[1])
		.attr("y2", d => y(d.values[d.values.length - 1].value));

	////////////////////////////////////////////////////////////
	//// Interaction ///////////////////////////////////////////
	////////////////////////////////////////////////////////////
	function mouseenter(d, i) {
		const t = d3.transition().duration(500);
		group.transition(t).style("opacity", e => (e === d ? 1 : 0.1));
		gAxis
			.transition(t)
			.attr("transform", `translate(0,${i * step + yRangeMax})`)
			.select(".y")
			.style("opacity", 1);
	}

	function mouseleave() {
		const t = d3.transition().duration(500);
		group.transition(t).style("opacity", 1);
		gAxis
			.transition(t)
			.attr("transform", `translate(0,${height})`)
			.select(".y")
			.style("opacity", 0);
	}
});
