function getAchievementFromCourse(course) {
    var array = fica_files;

    // Define the div for the tooltip
    var div = d3.select("#bar-grades")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);


    // Read all csv's
    var data = [];
    var q = d3.queue();
    for( var i = 0; i < array.length; i++) {
        q = q.defer(d3.csv, array[i]);
    }
    var res = q.await(onDataLoaded);
    function onDataLoaded() {
        // Concat. all files:
        conc_files = [];

        // assign year according to the file
        for (var i=1; i<arguments.length; i++) {
            year = getFileYear(array[i-1]);

            actual = arguments[i];
            for (var j = 0; j < actual.length; j++) {
                actual[j]['Ano'] = year;
            }
            //console.log(actual);
            conc_files = conc_files.concat(actual);
        }

        // get all different courses
        var all_courses = d3.nest()
            .key(function(d) { return d.Curso; })
            .entries(conc_files);

        for(var i = 0; i < all_courses.length; i++) {
            var pair = all_courses[i];
            if(pair['key'] == course) {
                course_info = pair['values'];
                break;
            }
        }

        // get % of ects achieved in the course by years
        var all_years = d3.nest()
            .key(function(d) { return d.Ano; })
            .rollup(function (leaves) {
                var ECTS_Inscritos = d3.mean(leaves, function (d) {
                    return Number(d["ECTS_InscritosAnoAtual"]);
                });
                var ECTS_Feitos = d3.mean(leaves, function (d) {
                    return Number(d["ECTS_FeitosAnoAtual"]);
                });
                return {
                    "Taxa_ECTS_Feitos": +(ECTS_Feitos/ECTS_Inscritos) * 100
                };
            })
            .entries(course_info);

        // Define dimensions & etc.
        var margin = {top: 20, right: 20, bottom: 30, left: 40},
            width = 500,
            height = 500;

        var svg = d3.select("#bar-grades")
            .append("svg")
            .attr("id", "svg_line")
            .attr("width", width + 100)
            .attr("height", height + 100);

        // limite prescriçao
        var studentAtRisk = 50; // metade dos ects inscritos

        var x = d3.scaleLinear().range([0, width - (margin.left + margin.right)]);
        var y = d3.scaleLinear().range([height - (margin.top * 2), 0]);

        var line = d3.line()
            .x(function(d) { return x(d.pos); })
            .y(function(d) { return y(d.ects); });

        var g = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // get the year-ects pairs
        var medias = []
        for(var i = 0; i < all_years.length; i++) {
            var dict = {};
            var pair = all_years[i];
            var year = pair.key;
            var ects = pair.value["Taxa_ECTS_Feitos"];
            if(isNaN(ects))
                ects = 0;

            dict["pos"] = i;
            dict["year"] = year;
            dict["ects"] = Math.round( ects * 10) / 10;
            medias.push(dict)
        }
        // console.log(medias);

        data = medias;

        x.domain(d3.extent(medias, function(d) { return d.pos; }));
        y.domain([0,100
            // (d3.min(medias, function(d) { return d.ects; })),
            // (d3.max(medias, function(d) { return d.avg; }))
        ]);

        // add the Y gridlines
        g.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(y)
            	.tickSize(-width)
              .tickFormat("")
              .ticks(10)
            );

        // x-axis
        g.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(" + ((margin.left + margin.right) / 2) + "," + (height - margin.top) + ")")
            .call(d3.axisBottom(x)
             	.ticks(data.length - 1)
                .tickFormat(function(d) {
                    // console.log(medias[d]['year']);
                    return medias[d]['year'];
                    //return medias[d]['course'];
                })
            )
          	.selectAll('.axis--x .tick text')

        // y-axis
        g.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(y).ticks(6))
        	.append("text")
            .attr("class", "axis-title")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .text("ECTs");

            // line for student at risk
            var studentAtRiskLineAndText = g.append("g")
                .attr("class", "risk-situation-cut-off-line-and-text")

            studentAtRiskLineAndText.append("line")
                .attr("class", "at-risk-cut-off-line")
                .attr("x1", 0)
                .attr("y1", y(studentAtRisk))
                .attr("x2", width)
                .attr("y2", y(studentAtRisk));

        //     studentAtRiskLineAndText.append("text")
        //         .attr("class", "at-risk-cut-off-text")
        //         .attr("y", y(studentAtRisk))
        //         .attr("dy","20px")
        //         .text("Situação de Prescrição");

            // Data line and dots group
            var lineAndDots = g.append("g")
            		.attr("class", "line-and-dots")
                .attr("transform", "translate(" + ((margin.left + margin.right) / 2) + "," + 0 + ")")

            // Data line
            lineAndDots.append("path")
                 .datum(data)
                 .attr("class", "data-line")
                 .attr("d", line);

             // Data dots
             lineAndDots.selectAll("line-circle")
             		.data(data)
             	.enter().append("circle")
                 .attr("class", "data-circle")
                 .attr("r", 5)
                 .attr("cx", function(d) { return x(d.pos); })
                 .attr("cy", function(d) { return y(d.ects); })
                 .on("mouseover", function(d) {
                     div.transition()
                         .duration(200)
                         .style("opacity",9);
                     div.html(d.year + "<br/>" + d.ects + "%")
                     .style("left", (d3.event.pageX)-300 + "px")
                     .style("top", (d3.event.pageY)-20 + "px");
                 })
                 .on("mouseout", function(d) {
                     div.transition()
                         .duration(500)
                         .style("opacity", 0);
                 });
    }
}

$('#visualization').on("change", function() {
  if($('#visualization').val() == 2){
    getAchievementFromCourse(selected_circles_name[0]);
  }
  else
      $('#svg_line').remove();
      $('#svg_alunos').remove();
});
