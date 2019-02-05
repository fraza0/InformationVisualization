function GetURLParameter(sParam){
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split('&');
  for (var i = 0; i < sURLVariables.length; i++){
    var sParameterName = sURLVariables[i].split('=');
    if (sParameterName[0] == sParam) {
        return sParameterName[1];
    }
  }
}

// var arg = GetURLParameter('rep');
// if (arg == null){
//   arg = 'point_cloud';
// }
threeInit('point_cloud');

function appendHTMLItems(){
  $('.grid-container').children().remove();
  var default_map = { 700:0xc1fca4, 1000:0x7ef742, 1500:0xffcc66, 2000:0xff6666 };
  for(var key in default_map){
    htmlItem = "<div class=\"grid-item\">"+
    "<span>Value: <input class=\"value\" name=\"value\" size=5 value="+key+"></span>&nbsp;&nbsp;&nbsp;"+
    //"<span>Color: <input class=\"jscolor color\" name=\"color\" size=6 value="+default_map[key].toString(16)+"></span>"+
    "<span>Color: <input class=\"picker\" name=\"color\" type=\"color\" id=\"colorpicker\" value=#"+default_map[key].toString(16)+"></input></span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
    "<button class=\"delete\" type=\"button\">-</button>"+
    "</div>";
    $('.grid-container').append(htmlItem);
  }
  $('#colors').css('display', 'block');
}

$('#rep').on('change', function(){
  var representation = $('#rep option:selected').val();
  if (representation == "colored_triangle_mesh" || representation == "colored_triangle_phongmesh") {
    $('#colors').css('display', 'block');
    appendHTMLItems();
  } else {
    $('#colors').css('display', 'none');
    $('.grid-container').children().remove();
  }
});

$(document).on('click', '#addField', function() {
  htmlItem = "<div class=\"grid-item\">"+
  "<span>Value: <input class=\"value\" name=\"value\" size=5></span>&nbsp;&nbsp;&nbsp;"+
  "<span>Color: <input class=\"picker\" name=\"color\" type=\"color\" id=\"colorpicker\"></span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"+
  "<button class=\"delete\" type=\"button\">-</button>"+
  "</div>";
    if ($('.grid-container > .grid-item').length < 10){
      $('.grid-container').append(htmlItem);
    }
});

$(document).on('click', '.delete', function() {
    $(this).parent().remove();
});

$('#submit').on('click', function() {
  var representation = $('#rep option:selected').val();
  var default_map = { 700:0xc1fca4, 1000:0x7ef742, 1500:0xffcc66, 2000:0xff6666 };
  var map = {};
  $(".grid-item").each(function() {
    map[$(this).find("input[name='value']").val()] = Number("0x"+$(this).find("input[name='color']").val().toLowerCase().substring(1));
  });
  if (Object.keys(map).length == 0){
    map = default_map;
  }
  threeInit(representation, map);
});
