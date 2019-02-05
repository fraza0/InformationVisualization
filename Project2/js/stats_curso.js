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

function nestData(data){

  var nested = d3.nest()
    .key(function(d) {
      if (d.curso == curso){
        return d.curso;
      }
    })
    .rollup(function (leaves){
      var cod_curso = leaves.map(function(d){
        return d.curso;
      });

      var nome_curso = leaves.map(function(d){
        return d.nomeCurso;
      });

      var nome_curso = leaves.map(function(d){
        return d.nomeCurso;
      });

      var ects_feitos = d3.mean(leaves, function (d) {
        return d.feitos;
      });

      var ects_inscritos = d3.mean(leaves, function (d) {
        return d.inscritos;
      });

      var feitos_inscritos = (ects_feitos/ects_inscritos*100).toFixed(2);

      var ativo = 0;
      var anulado = 0;
      var matricula = leaves.map(function (d) {
        if (d.matricula == "ACTIVO"){
          ativo+=1;
        } else if (d.matricula == "ANULADO") {
          anulado+=1;
        }

        return d.matricula;
      });

      var media = leaves.map(function (d) {
        return d.media.replace(",", ".");
      });

      return {
        "codigo_curso": d3.min(cod_curso),
        "nome_curso": d3.max(nome_curso),
        "media_ects": ects_feitos.toFixed(2),
        "taxa_ects": feitos_inscritos,
        "matricula_ativa": ativo,
        "matricula_anulada": anulado,
        "media_max": media[media.length-1],
        "media_avaliacao": d3.mean(media).toFixed(2),
        "media_min": media[0]
      };
    })
    .entries(data);

    return nested;
}

function writeStats(data){
  var d = nestData(data)[0].value;

  $(".no-info").show();
  $("#nome_curso").text(d.nome_curso);
  $("#cod_curso").text(d.codigo_curso);
  $("#taxa_ects").text(d.taxa_ects);
  $("#media_ects").text(d.media_ects);
  $("#media_max_avaliacao").text(d.media_max);
  $("#media_min_avaliacao").text(d.media_min);
  $("#media_avaliacao").text(d.media_avaliacao);
  $("#matriculas_ativas").text(d.matricula_ativa);
  $("#matriculas_anuladas").text(d.matricula_anulada);
}

var curso = null;
function showStats(c){
  curso = c;
  var file = cursoMatchPath(c);
  if (file != false){
    d3.csv(file, function(d){
      return {
        "curso": d.Curso,
        "nomeCurso": d.CursoNome,
        "habilitacao": d.Habilitacao,
        "feitos": d.ECTS_FeitosAnoAtual,
        "inscritos": d.ECTS_InscritosAnoAtual,
        "matricula": d.EstadoMatricula,
        "media": d.media
      }
    }, writeStats);
    getAllStudentsAchievement(c);
  } else {
    $("#nome_curso").text("C"+curso);
    $("#cod_curso").text(curso);
    $(".no-info").hide();
  }
}
