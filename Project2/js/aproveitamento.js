function nesting_taxa(d) {
    var nesting = d3.nest()
      .key(function(d) { return d.Curso; }).sortKeys(d3.ascending)
      .rollup(function (leaves) {
          var ECTS_Inscritos = d3.mean(leaves, function (d) {
              return Number(d["ECTS_InscritosAnoAtual"]);
          });
          var ECTS_Feitos = d3.mean(leaves, function (d) {
              return Number(d["ECTS_FeitosAnoAtual"]);
          });
          var Max_ECTS = d3.max(leaves, function (d) {
              return Number(d["ECTS_InscritosAnoAtual"]);
          });
          return {
              "Taxa_ECTS_Feitos": +(ECTS_Feitos/ECTS_Inscritos) * 100,
              "Media_ECTS_Feitos": +ECTS_Feitos,
              "Max_ECTS_Inscritos": +Max_ECTS
          };
      })
      .entries(conc_files);

    var nested = nesting.filter(function(d) {
       return selected_circles_name.includes(d.key);
    });

    // get the ects-course pairs
    var medias = []
    for(var i = 0; i < nested.length; i++) {
        var dict = {};
        var pair = nested[i];
        var course = pair.key;
        var ects = pair.value["Taxa_ECTS_Feitos"];
        var avg = pair.value["Media_ECTS_Feitos"];
        var max = pair.value["Max_ECTS_Inscritos"]
        if(isNaN(ects))
            ects = 0;

        dict["course"] = course;
        dict["ects"] = ects.toFixed(1);
        dict["avg"] = avg.toFixed(1);
        dict["max"] = max;
        medias.push(dict)
    }

    return medias;
}

function getAllCoursesAchievementByRate(year) {
    var array = getFilesFromYear(fica_files, year);

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

        for (var i=1; i<arguments.length; i++) {
            conc_files = conc_files.concat(arguments[i]);
        }

        // get info from all courses

        var medias = nesting_taxa(data);
        // console.log(medias);

        // set svg width according to number of courses to present
        // result = Math.floor(nested.length/20);
        // // console.log(result * 1000);
        // if (result == 0)
        //     width = 1000;
        // else
        //     width = result * 1000;

        // Define dimensions & etc.
        var margin = 80,
        width = 800 - 2 * margin,
        height = 600 - 2 * margin;

        var svg = d3.select("#line-grades")
            .append("svg")
            .attr("id", "svg_line")
            .attr("width", width + 100)
            .attr("height", 600);

        var chart = svg.append('g')
            .attr('transform', `translate(${margin}, ${margin})`);

        // x-axis
        var xScale = d3.scaleBand()
            .range([0, width])
            .domain(medias.map((d) => d.course))
            .padding(0.5);

        // y-axis
        var yScale = d3.scaleLinear()
            .range([height, 0])
            .domain([0, 100]);

        var makeYLines = () => d3.axisLeft()
            .scale(yScale);

        chart.append('g')
            .attr('class','eixos')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));

        chart.append('g')
            .attr('class','eixos')
            .call(d3.axisLeft(yScale));

        // draw bars
        var barGroups = chart.selectAll()
            .data(medias)
            .enter()
            .append('g');

        barGroups
            .append('rect')
            .attr('class', 'bar')
            .attr("x", function(d) {
                 return xScale(d.course);
             })
             .attr("y", function(d) {
                  return yScale(d.ects);
              })
              .attr("height", function(d) {
                   return height - yScale(d.ects);
               })
              .attr('width', xScale.bandwidth())
              .on('mouseenter', function (actual, i) {
                d3.selectAll('.ects')
                  .attr('opacity', 0)

                d3.select(this)
                  .transition()
                  .duration(300)
                  .attr('opacity', 0.7)
                  .attr('x', (a) => xScale(a.course) - 5)
                  .attr('width', xScale.bandwidth() + 10)

                const y = yScale(actual.ects)

                line = chart.append('line')
                  .attr('id', 'limit')
                  .attr('x1', 0)
                  .attr('y1', y)
                  .attr('x2', width)
                  .attr('y2', y)

                barGroups.append('text')
                  .attr('class', 'divergence')
                  .attr('x', (a) => xScale(a.course) + xScale.bandwidth() / 2)
                  .attr('y', (a) => yScale(a.ects) + 30)
                  //.attr('fill', 'white')
                  .attr('text-anchor', 'middle')
                  .text((a, idx) => {
                    const divergence = (a.ects - actual.ects).toFixed(1);

                    let text = ''
                    if (divergence > 0) text += '+'
                    text += `${divergence}%`

                    return idx !== i ? text : '';
                });
                svg.append('text')
                      .attr('class', 'value')
                      .attr('x', xScale(actual['course']) + 115)
                      .attr('y', yScale(actual['ects']) + 70)
                      .attr('text-anchor', 'middle')
                      //.text('2016: 57.1%');
                      .text(actual['ects'] + '%');

              })
              .on('mouseleave', function () {
                d3.selectAll('.ects')
                  .attr('opacity', 1);

                d3.select(this)
                  .transition()
                  .duration(300)
                  .attr('opacity', 1)
                  .attr('x', (a) => xScale(a.course))
                  .attr('width', xScale.bandwidth());

                chart.selectAll('#limit').remove();
                chart.selectAll('.divergence').remove();
                svg.selectAll('.value').remove();
              })
          barGroups
            .append('text')
            .attr('class', 'ects')
            .attr('x', (a) => xScale(a.course) + xScale.bandwidth() / 2)
            .attr('y', (a) => yScale(a.ects) + 30)
            .attr('text-anchor', 'middle')
            //.text((a) => `${a.ects}%`);
            .text((a, idx) => {
                var value = a.ects;
                let text = ''
                if (value > 0) text += value + '%'; // ignore ects = 0;
                return text;
            });

            svg.append('text')
                .attr('class', 'label')
                .attr('x', width / 2 + margin)
                .attr('y', height + margin * 1.7)
                .attr('text-anchor', 'middle')
                .text('Código do Curso');

            svg.append('text')
                .attr('class', 'label')
                .attr('x', -(height / 2) - margin)
                .attr('y', margin / 2.4)
                .attr('transform', 'rotate(-90)')
                .attr('text-anchor', 'middle')
                .text('Taxa de Aproveitamento (%)');

            svg.append('text')
                .attr('class', 'source')
                .attr('x', width - margin / 2)
                .attr('y', height + margin * 1.7)
                .attr('text-anchor', 'start')
                .text('Source: FICA, 2018');
    }
}

function getAllCoursesAchievementByAvg(year) {
    var array = getFilesFromYear(fica_files, year);

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

        for (var i=1; i<arguments.length; i++) {
            conc_files = conc_files.concat(arguments[i]);
        }


        // get info from all courses
        var medias = nesting_taxa(data);
        // console.log(medias);

        var margin = 80,
        width = 800 - 2 * margin,
        height = 600 - 2 * margin;

        var svg = d3.select("#line-grades")
            .append("svg")
            .attr("id", "svg_line")
            .attr("width", width + 100)
            .attr("height", 600);

        var chart = svg.append('g')
            .attr('transform', `translate(${margin}, ${margin})`);

        // x-axis
        var xScale = d3.scaleBand()
            .range([0, width])
            .domain(medias.map((d) => d.course))
            .padding(0.5);

        // y-axis
        var yScale = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(medias, function(d) { return d.max; })]);

        var makeYLines = () => d3.axisLeft()
            .scale(yScale);

        chart.append('g')
            .attr('class','eixos')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));

        chart.append('g')
            .attr('class','eixos')
            .call(d3.axisLeft(yScale));

        // draw bars
        var barGroups = chart.selectAll()
            .data(medias)
            .enter()
            .append('g');

        barGroups
            .append('rect')
            .attr('class', 'bar')
            .attr("x", function(d) {
                 return xScale(d.course);
             })
             .attr("y", function(d) {
                  return yScale(d.avg);
              })
              .attr("height", function(d) {
                   return height - yScale(d.avg);
               })
              .attr('width', xScale.bandwidth())
              .on('mouseenter', function (actual, i) {
                d3.selectAll('.avg')
                  .attr('opacity', 0)

                d3.select(this)
                  .transition()
                  .duration(300)
                  .attr('opacity', 0.7)
                  .attr('x', (a) => xScale(a.course) - 5)
                  .attr('width', xScale.bandwidth() + 10)

                const y = yScale(actual.avg)

                line = chart.append('line')
                  .attr('id', 'limit')
                  .attr('x1', 0)
                  .attr('y1', y)
                  .attr('x2', width)
                  .attr('y2', y)

                barGroups.append('text')
                  .attr('class', 'divergence')
                  .attr('x', (a) => xScale(a.course) + xScale.bandwidth() / 2)
                  .attr('y', (a) => yScale(a.avg) + 30)
                  //.attr('fill', 'white')
                  .attr('text-anchor', 'middle')
                  .text((a, idx) => {
                    const divergence = (a.avg - actual.avg).toFixed(1);

                    let text = ''
                    if (divergence > 0) text += '+'
                    text += `${divergence}`

                    return idx !== i ? text : '';
                });
                svg.append('text')
                      .attr('class', 'value')
                      .attr('x', xScale(actual['course']) + 115)
                      .attr('y', yScale(actual['avg']) + 70)
                      .attr('text-anchor', 'middle')
                      .text(actual['avg']);

              })
              .on('mouseleave', function () {
                d3.selectAll('.avg')
                  .attr('opacity', 1);

                d3.select(this)
                  .transition()
                  .duration(300)
                  .attr('opacity', 1)
                  .attr('x', (a) => xScale(a.course))
                  .attr('width', xScale.bandwidth());

                chart.selectAll('#limit').remove();
                chart.selectAll('.divergence').remove();
                svg.selectAll('.value').remove();
              })
          barGroups
            .append('text')
            .attr('class', 'avg')
            .attr('x', (a) => xScale(a.course) + xScale.bandwidth() / 2)
            .attr('y', (a) => yScale(a.avg) + 30)
            .attr('text-anchor', 'middle')
            .text((a, idx) => {
                var value = a.avg;
                let text = ''
                if (value > 0) text += value; // ignore ects = 0;
                return text;
            });

            svg.append('text')
                .attr('class', 'label')
                .attr('x', width / 2 + margin)
                .attr('y', height + margin * 1.7)
                .attr('text-anchor', 'middle')
                .text('Código do Curso');

            svg.append('text')
                .attr('class', 'label')
                .attr('x', -(height / 2) - margin)
                .attr('y', margin / 2.4)
                .attr('transform', 'rotate(-90)')
                .attr('text-anchor', 'middle')
                .text('Média de ECTS realizados');

            svg.append('text')
                .attr('class', 'source')
                .attr('x', width - margin / 2)
                .attr('y', height + margin * 1.7)
                .attr('text-anchor', 'start')
                .text('Source: FICA, 2018');
    }
}

$('#visualization').on("change", function() {
  var actual_year = $('#year_global').val();
  if (actual_year == 1)
      actual_year = 2018;

  $('#year_line').val(actual_year);
  if($('#visualization').val() == 3){
      getAllCoursesAchievementByRate(actual_year);
  }
});

$('#year_line').on('change', function(){
    $('#svg_line').remove();
    var actual_year = this.value;
    var type = $('#ects_type').val();
    if (type == 'media')
        getAllCoursesAchievementByAvg(actual_year);
    else
        getAllCoursesAchievementByRate(actual_year);
});

$('#ects_type').on('change', function(){
    var actual_year = $('#year_global').val();
    if (actual_year == 1)
        actual_year = 2018;
    $('#svg_line').remove();
    var type = $('#ects_type').val();
    if (type == 'media')
        getAllCoursesAchievementByAvg(actual_year);
    else
        getAllCoursesAchievementByRate(actual_year);
});
