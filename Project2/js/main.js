dataGlobalJuly16 = "./FICA/fica_3_desempenho/global/FICA_20160731.csv"
dataGlobalJuly17 = "./FICA/fica_3_desempenho/global/FICA_20170731.csv"
dataGlobalJuly18 = "./FICA/fica_3_desempenho/global/FICA_20180731.csv"
dataCourseMI = "./FICA/fica_3_desempenho/julho_mi/FICA_20180731_C68.csv"
dataCourseLicUni = "./FICA/fica_3_desempenho/julho_lic_u/FICA_20180731_C16.csv"
dataCourseLicPoli = "./FICA/fica_3_desempenho/julho_lic_p/FICA_20180731_C72.csv"
dataCourseCTESP = "./FICA/fica_3_desempenho/julho_ctesp/FICA_20180731_C1.csv"

fica_files = [dataGlobalJuly16, dataGlobalJuly17, dataGlobalJuly18, dataCourseMI, dataCourseLicUni, dataCourseLicPoli, dataCourseCTESP];
bubble_colors = ["#619fca", "#ffa555", "#96dd96"];

// Subconjunto	Numero	Nome	Email	PaisNacionalidade	ProgramaTutoria	TempoParcial
// SituacaoPrescricao	Habilitacao	Curso	CursoNome	PrimeiraVezCurso	AnoLetivoMatricula
// EstadoMatricula	TipoAcesso	Regime	AnoCurricular	ECTS_InscritosAnoAtual	IND2_1
// ECTS_InscritoAnoAtualSemestre1	ECTS_FeitosAnoAtual	IND2_2	Propina_TotalEmDivida	IND2_3
// BolsaSAS_DataCandidatura	BolsaSAS_EstadoBolsa	BolsaSAS_DataDespacho	BolsaSAS_ValorBolsa
// IND2_4	IngressoRG_nota	IngressoRG_fase	IngressoRG_pref	IND2_5	NumUCinscritas
// UC1_CodUC	UC1_Assiduidade	UC1_AvalParcial	UC2_CodUC	UC2_Assiduidade	UC2_AvalParcial
// UC3_CodUC	UC3_Assiduidade	UC3_AvalParcial	UC4_CodUC	UC4_Assiduidade	UC4_AvalParcial
// UC5_CodUC	UC5_Assiduidade	UC5_AvalParcial	UC6_CodUC	UC6_Assiduidade	UC6_AvalParcial
// UC7_CodUC	UC7_Assiduidade	UC7_AvalParcial	UC8_CodUC	UC8_Assiduidade	UC8_AvalParcial

function getFileYear(filename){
  date_size = 8;
  start = "FICA_";
  var date = filename.substring(filename.indexOf(start) + start.length);
  return date.substring(0, 4)
}

function assignFiles(fica_files) {
    var dict = {};
    for(var i = 0; i < fica_files.length; i++) {
        var year = getFileYear(fica_files[i]);
        if (dict[year] == undefined) {
            dict[year] = [fica_files[i]];
        }
        else {
            var tmp = dict[year];
            tmp.push(fica_files[i]);
            dict[year] = tmp;
        }
    }
    return dict;
}

function getFilesFromYear(files, year) {
    var dict = assignFiles(files);
    return dict[year];
}

$(document).ready(function() {
  loadGlobal();
  show_div('global');
  $('#visualization').val(1);
  $('#year_global').val(1);
  $('#cor1').css('background-color', bubble_colors[2]);
  $('#cor2').css('background-color', bubble_colors[0]);
  $('#cor3').css('background-color', bubble_colors[1]);
});

$('#visualization').on("change", function() {
  if ($('#visualization').val() == 1){
    show_div('global');
  } else if($('#visualization').val() == 2){
    d3.select('#svg_bar').remove();
    if (d3.selectAll('.selected_circle').size() == 1){
      show_div('bar');
    } else {
      alert("Por favor selecione apenas um curso para a análise individual.");
      $('#visualization').val(1);
    }
  } else if($('#visualization').val() == 3){
    d3.select('#svg_line').remove();
    if (d3.selectAll('.selected_circle').size() >= 2){
      show_div('line');
    } else {
      alert("Por favor selecione pelo menos dois cursos para a comparação entre eles.");
      $('#visualization').val(1);
    }
  }
});

$('#clear_selection').on("click", function() {
  d3.selectAll('circle').attr("class", null);
  // alert(selected_circles_name);
  selected_circles_name = [];
  // alert(selected_circles_name);
});

function show_div(div_name){
  if (div_name == 'line') {
    $("#visualization option[value=2]").hide();
    $('#clear_selection').hide();
    $('#legenda').hide();

    $('#global_year_div').css("display", "none");
    $('#line_year_div').css("display", "block");
    $('#container').css("display", "none");
    $('.bars').css("display", "none");
    $('#line-grades').css("display", "block");

  } else if (div_name == 'bar') {
    $("#visualization option[value=3]").hide();
    $('#clear_selection').hide();
    $('#legenda').hide();

    $('#global_year_div').css("display", "none");
    $('#container').css("display", "none");
    $('.bars').css("display", "block");
    $('#line-grades').css("display", "none");

    showStats(selected_circles_name[0])

  } else if (div_name == 'global') {
    $("#visualization option[value=2]").show();
    $("#visualization option[value=3]").show();
    $('#clear_selection').show();
    $('#legenda').show();

    $('#global_year_div').css("display", "block");
    $('#line_year_div').css("display", "none");
    $('#container').css("display", "block");
    $('#line-grades').css("display", "none");
    $('.bars').css("display", "none");
  }
}
