dataCourseCTESP = "./FICA/fica_3_desempenho/cursos/FICA_20180731_C1.csv"
dataCourseLicUni = "./FICA/fica_3_desempenho/cursos/FICA_20180731_C16.csv"
dataCourseMI = "./FICA/fica_3_desempenho/cursos/FICA_20180731_C68.csv"
dataCourseLicPoli = "./FICA/fica_3_desempenho/cursos/FICA_20180731_C72.csv"

var fica_cursos = [dataCourseCTESP, dataCourseLicUni, dataCourseMI, dataCourseLicPoli];


function cursoMatchPath(curso){
  for (i=0; i<fica_cursos.length; i++){
    if (fica_cursos[i].indexOf('C'+curso+".csv") != -1){
      return fica_cursos[i];
    }
  }
  return false;
}


// console.log(cursoMatchPath(1));

function getAllStudentsAchievement(course) {
    d3.csv(cursoMatchPath(course), function(data) {

        // get info from all courses
        var nested = d3.nest()
        .key(function(d) { return d.Numero; }).sortKeys(d3.ascending)
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
          .entries(data);

        // null: 0% | low: ]0,50[ | medium: [50,100[ | high: 100%
        var range = {'null':0, 'low':0, 'medium':0, 'high':0};

        // get the ects-student pairs
        var medias = []
        for(var i = 0; i < nested.length; i++) {
            var pair = nested[i];
            var ects = Math.round(pair.value["Taxa_ECTS_Feitos"] * 10) / 10;
            if(isNaN(ects))
                ects = 0;

            if(ects == 0)
                range['null'] += 1;
            else if(ects > 0 && ects < 50)
                range['low'] += 1;
            else if(ects > 50 && ects < 100)
                range['medium'] += 1;
            else
                range['high'] += 1;
        }

        // get classes
        var keys = Object.keys(range);
        // get values
        var values = Object.values(range);

        var data = [];
        for(var i = 0; i < keys.length; i++) {
            var pair = {};
            pair['class'] = keys[i];
            pair['number'] = values[i];
            data.push(pair);
        }

        // Define dimensions & etc.
        var margin = 20,
        width = 500,
        height = 150;

        var svg = d3.select("#info_curso")
            .append("svg")
            .attr("id", "svg_alunos")
            .attr("class", "no-info")
            .attr("width", 500)
            .attr("height", 200);

        var chart = svg.append('g')
            .attr('transform', `translate(${margin}, ${margin})`);

        // x-axis
        var xScale = d3.scaleBand()
            .range([0, width])
            .domain(data.map((d) => d.class))
            .padding(0.4);

        // y-axis
        var yScale = d3.scaleLinear()
            .range([height, 0])
            .domain([0, Math.max(...values) + 1]);

        var makeYLines = () => d3.axisLeft()
            .scale(yScale);

        var ranges = {'null':'0', 'low':']0,50[ ', 'medium':'[50,100[ ', 'high':'100'}

        chart.append('g')
            .attr('class','eixos_students')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d => ranges[d] + " %"))


        chart.append('g')
            .attr('class','eixos_students')
            .call(d3.axisLeft(yScale).ticks(10));

        // draw bars
        var barGroups = chart.selectAll()
            .data(data)
            .enter()
            .append('g');

        // colors
        color = {'null':'#fc9288', 'low':'#fcd188', 'medium':'#fcfc88', 'high':'#9dfc88'};

        barGroups
            .append('rect')
            .attr('class', 'bar_students')
            .attr("x", function(d) {
                 return xScale(d.class);
             })
             .attr("y", function(d) {
                  return yScale(d.number);
             })
             .attr("height", function(d) {
                  return height - yScale(d.number);
             })
             .attr('width', xScale.bandwidth())
             .attr("fill", function(d) {
                 return(color[d.class]);
              })
             .on('mouseenter', function (actual, i) {
                d3.selectAll('.number')
                  .attr('opacity', 0)

                d3.select(this)
                  .transition()
                  .duration(300)
                  .attr('opacity', 0.7)
                  .attr('x', (a) => xScale(a.class) - 5)
                  .attr('width', xScale.bandwidth() + 10)

                const y = yScale(actual.number)

                line = chart.append('line')
                  .attr('id', 'limit_students')
                  .attr('x1', 0)
                  .attr('y1', y)
                  .attr('x2', width)
                  .attr('y2', y)

                barGroups.append('text')
                  .attr('class', 'student_divergence')
                  .attr('x', (a) => xScale(a.class) + xScale.bandwidth() / 2)
                  .attr('y', (a) => yScale(a.number) + 15)
                  //.attr('fill', 'white')
                  .attr('text-anchor', 'middle')
                  .text((a, idx) => {
                    const divergence = (a.number - actual.number);

                    let text = ''
                    if (divergence > 0) text += '+'
                    text += `${divergence}`

                    return idx !== i ? text : '';
                });
                svg.append('text')
                      .attr('class', 'value_students')
                      .attr('x', xScale(actual['class']) + 37)
                      .attr('y', yScale(actual['number']) + 15)
                      .attr('text-anchor', 'middle')
                      //.text('2016: 57.1%');
                      .text(actual['number']);

              })
              .on('mouseleave', function () {
                d3.selectAll('.number')
                  .attr('opacity', 1);

                d3.select(this)
                  .transition()
                  .duration(300)
                  .attr('opacity', 1)
                  .attr('x', (a) => xScale(a.class))
                  .attr('width', xScale.bandwidth());

                chart.selectAll('#limit_students').remove();
                chart.selectAll('.student_divergence').remove();
                svg.selectAll('.value_students').remove();
              })
          barGroups
            .append('text')
            .attr('class', 'number')
            .attr('x', (a) => xScale(a.class) + xScale.bandwidth() / 2)
            .attr('y', (a) => yScale(a.number) + 16)
            .attr('text-anchor', 'middle')
            //.text((a) => `${a.number}%`);
            .text((a, idx) => {
                var value = a.number;
                let text = ''
                if (value > 0) text += value; // ignore number = 0;
                return idx !== i ? text : '';
            });

    });
}
