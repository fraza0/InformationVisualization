// dataGlobalJuly16 = "./FICA/fica_3_desempenho/global/FICA_20160731.csv"
// dataGlobalJuly17 = "./FICA/fica_3_desempenho/global/FICA_20170731.csv"
// dataGlobalJuly18 = "./FICA/fica_3_desempenho/global/FICA_20180731.csv"

function nesting(d) {

  var nested = d3.nest()
    .key(function(d) {
      return d.curso;
    })
    .rollup(function (leaves){
      var curso = leaves.map(function (d) {
        return d.curso;
      });

      var cursoNome = leaves.map(function (d) {
        return d.nomeCurso;
      });

      var ects_feitos = d3.mean(leaves, function (d) {
        return d.feitos;
      });

      var ects_inscritos = d3.mean(leaves, function (d) {
        return d.inscritos;
      });


      var group_habilitacao = leaves.map(function (d) {
        return d.habilitacao;
      });

      return {
        "name": curso[0],
        "title": cursoNome[0],
        "group": group_habilitacao[0],
        "value": ects_feitos/ects_inscritos*100
      };
    })
    .entries(d)
    .map(function(d){
      return {
        "name": d.value.name,
        "title": d.value.title,
        "group": d.value.group,
        "value": d.value.value
      }
    })
    .sort(function(a, b) {
        return -(a.value - b.value);
    });

    return nested;
}

function display_chart(data){
  width = 900;
  height = 900;

  data = nesting(data);

  pack = data => d3.pack()
      .size([width - 2, height - 2])
      .padding(3)
    (d3.hierarchy({children: data})
      .sum(d => d.value))

  format = d3.format(",d")
  color = d3.scaleOrdinal().range(d3.schemeCategory10)

  color = function(group){
    group = group.toLowerCase();
    if (group.includes("licenciatura")){
      // c = "#619fca";
      c = bubble_colors[0];
    } else if (group.includes("mestrado")) {
      // c = "#ffa555";
      c = bubble_colors[1];
    } else if (group.includes("técnico")) {
      // c = "#6abc6a";
      c = bubble_colors[2];
    }
    return c;
  }

  const root = pack(data);

  const svg = d3.select("#container").append("svg")
      .style("width", "100%")
      .style("height", "100%")
      .attr("font-size", 10)
      .attr("font-family", "sans-serif")
      .attr("text-anchor", "middle");

  const leaf = svg.selectAll("g")
    .data(root.leaves())
    .enter().append("g")
      .attr("transform", d => `translate(${d.x + 1},${d.y + 1})`);

  var circle = leaf.append("circle")
      .attr("class", d => {
        if(selected_circles_name.includes(d.data.name)){
          return "selected_circle";
        }
        d.leafUid = Math.random();
        return d.leafUid.id;
      })
      .attr("r", d => d.r)
      .attr("fill-opacity", 0.7)
      .attr("fill", d => color(d.data.group));

  leaf.append("clipPath")
      .attr("id", d => (d.clipUid = Math.random()).id);

  leaf.append("text")
    .attr("clip-path", d => d.clipUid)
    .selectAll("tspan")
    .data(d => {
      return d.data.name.split(/(?=[A-Z][^A-Z])/g)
    })
    .enter().append("tspan")
      .attr("x", 0)
      .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
      .text(d => d);

  leaf.append("title")
      .text(d => `Código Curso: ${d.data.title}\nTaxa Aprovação: ${format(d.value)} %\nHabilitação: ${d.data.group}`);

  circle.on("click", function(){
    if (d3.select(this).attr("class") == "selected_circle"){
      d3.select(this).attr("class", null);

      var index = selected_circles_name.indexOf(this.__data__.data.name);
      if (index > -1) {
        selected_circles_name.splice(index, 1);
      }
      return;
    }

    d3.select(this)
      .attr("class", "selected_circle");

    selected_circles_name.push(this.__data__.data.name);
  });

  return svg.node();

}

function deSelectCircles(){
  d3.selectAll(".selected_circle")
  .attr("class", null);
}

function processData(data1, data2, data3) {
    return data1.concat(data2).concat(data3);
}

var selected_circles_name = [];

$('#year_global').on('change', function(){
  d3.select("svg").remove();
  if (this.value==1){
    loadGlobal();
  } else if (this.value==2016) {
    d3.csv(dataGlobalJuly16, function(d){
      return {
        "curso": d.Curso,
        "nomeCurso": d.CursoNome,
        "habilitacao": d.Habilitacao,
        "feitos": d.ECTS_FeitosAnoAtual,
        "inscritos": d.ECTS_InscritosAnoAtual
      }
    }, display_chart);
  } else if (this.value==2017) {
    d3.csv(dataGlobalJuly17, function(d){
      return {
        "curso": d.Curso,
        "nomeCurso": d.CursoNome,
        "habilitacao": d.Habilitacao,
        "feitos": d.ECTS_FeitosAnoAtual,
        "inscritos": d.ECTS_InscritosAnoAtual
      }
    }, display_chart);
  } else if (this.value==2018) {
    d3.csv(dataGlobalJuly18, function(d){
      return {
        "curso": d.Curso,
        "nomeCurso": d.CursoNome,
        "habilitacao": d.Habilitacao,
        "feitos": d.ECTS_FeitosAnoAtual,
        "inscritos": d.ECTS_InscritosAnoAtual
      }
    }, display_chart);
  }
});

function loadGlobal(){
    d3.queue()
    .defer(d3.csv, dataGlobalJuly16, function(d){
      return {
        "curso": d.Curso,
        "nomeCurso": d.CursoNome,
        "habilitacao": d.Habilitacao,
        "feitos": d.ECTS_FeitosAnoAtual,
        "inscritos": d.ECTS_InscritosAnoAtual
      }
    })
    .defer(d3.csv, dataGlobalJuly17, function(d){
      return {
        "curso": d.Curso,
        "nomeCurso": d.CursoNome,
        "habilitacao": d.Habilitacao,
        "feitos": d.ECTS_FeitosAnoAtual,
        "inscritos": d.ECTS_InscritosAnoAtual
      }
    })
    .defer(d3.csv, dataGlobalJuly18, function(d){
      return {
        "curso": d.Curso,
        "nomeCurso": d.CursoNome,
        "habilitacao": d.Habilitacao,
        "feitos": d.ECTS_FeitosAnoAtual,
        "inscritos": d.ECTS_InscritosAnoAtual
      }
    })
    .await(function(error, file1, file2, file3) {
      if (error) {
        console.error('Something went wrong: ' + error);
      } else {
        d = processData(file1, file2, file3);
        display_chart(d);
      }
    });
}
