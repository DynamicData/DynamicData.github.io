//Set the parameters for the API call
function apiParameters() {
  var callerId = "hyperisland-mar17";
  var privateKey = "uOJe1BhZXOuUBAuCGRxX8t81SnACJVIcTY0OS7fq";
  var unixTimeStamp = Math.floor(Date.now() / 1000);
  var unique = makeRandom();
  var sha = sha1(callerId+unixTimeStamp+privateKey+unique);
  return {
    callerId : callerId,
    unixTimeStamp: unixTimeStamp,
    unique: unique,
    sha : sha
  };
}

//When submitting the form
$('#booliForm').submit(function(event) {

  //Form validation
  $('.error').hide();
  $('#visualisation').hide();
  var estateType = document.forms["booliForm"]["selectEstateType"];
  var area = document.forms["booliForm"]["selectArea"];
  var estateSize = document.forms["booliForm"]["selectEstateSize"];
  var yearFrom = document.forms["booliForm"]["selectYearFrom"];
  var yearTo = document.forms["booliForm"]["selectYearTo"];

  //validate fields
  if (estateType.value == "" || area.value == "" || yearFrom.value == "" || yearTo.value == "" || estateSize.value == "") {
  	if (estateType.value == "") {
      $("#selectEstateType_error").show();
    }
    if (area.value == "") {
      $("#selectArea_error").show();
    }
    if (yearFrom.value == "") {
      $("#selectYearFromTo_error").show();
    }
    if (yearTo.value == "") {
      $("#selectYearFromTo_error").show();
    }
    if (estateSize.value == "") {
      $("#selectEstateSize_error").show();
    }
    // prevent the form from submitting
    event.preventDefault();

  //If no error - proceed
  } else {
      $.ajax({
      data: $(this).serialize(),
      type: $(this).attr('method'),
      url: $(this).attr('action'),
      success: function(data) {

        $('#error-message').hide();
        var location = $("#location").val();
        var limit = $("#limit").val();
        var type = $("#selectEstateType").val();
        var area = $("#selectArea").val();
        var size = $("#selectEstateSize").val();
        var yearFrom = $("#selectYearFrom").val();
        var yearTo = $("#selectYearTo").val();
        var graphData = [];
        var counter = 0;

        for (i = yearFrom; i <= yearTo; i++) {
          counter++;
        }
        for (i = yearFrom; i <= yearTo; i++) {
          processAPICall(counter, limit, type, area, size, i);
        }

        function processAPICall(counter, limit, type, area, size, year) {
          var params = apiParameters();

          getdata("https://api.booli.se/sold?q="+area+"&offset=50&limit="+limit+"&minRooms="+size+"&maxRooms="+size+"&objectType="+type+"&minSoldDate="+year+"0101&maxSoldDate="+year+"1231&callerId="+params.callerId+"&time="+params.unixTimeStamp+"&unique="+params.unique+"&hash="+params.sha+"", function(data) {
            var count = data.count;
            var soldPriceTotal = 0;
            var livingAreaTotal = 0;
            var totalSquareMeterPrice = 0;

            if (isNaN(data) == "true") {
console.log("data: " + data);
              errorMessage();
              alert("error");
            }


            if (count < 1) {
              errorMessage();
            } else {
              for(i = 0; i < count; i++) {
                var location = data.sold[i].location.namedAreas;
                var soldPrice = data.sold[i].soldPrice;
                var livingArea = data.sold[i].livingArea;
                var soldPriceTotal = soldPriceTotal + soldPrice;
                var livingAreaTotal = livingAreaTotal + livingArea;
              }
              soldPriceTotal = soldPriceTotal/i;
              livingAreaTotal = livingAreaTotal/i;
              totalSquareMeterPrice = soldPriceTotal/livingAreaTotal;
              var refinedSquareMeterPrice = Math.trunc(totalSquareMeterPrice);
              var refinedYear = parseInt(year);
              var rightCounter = counter-1;

              graphData.push({x: refinedYear, y: refinedSquareMeterPrice});
              updateGraph(graphData, counter);
            }
          });
        }
        showResult(yearFrom, yearTo, type, size, area);
      }
    });
    return false;
    //event.preventDefault();
  }
});

//Propagate the form with data from the API
function getAllparametersForLocation(location, limit) {
  var params = apiParameters();

  $.getJSON("https://api.booli.se/sold?q=" + location + "&limit=" + limit + "&callerId="+params.callerId+"&time="+params.unixTimeStamp+"&unique="+params.unique+"&hash="+params.sha+"", function (data) {

    var count = data.count;
    //var allAreas = ["Östermalm", "Södermalm", "Nacka", "Hägersten", "Enskede", "Norrmalm", "Bromma", "Hässelby", "Kungsholmen", "Farsta", "Rinkeby", "Kista", "Skarpnäck", "Tensta", "Spånga", "Skärholmen", "Älvsjö"];
    var allAreas = [];
    var uniqueAreas = [];
    var allEstateTypes = [];
    var uniqueEstateTypes = [];
    var allEstateSizes = [];
    var uniqueEstateSizes = [];
    var allYears = []
    var uniqueYears = [];

    /* get all */
    for(i = 0; i < count; i++) {
      /* areas */
      var jsonAreas = JSON.stringify(data.sold[i].location.namedAreas, null, 2);
      var jsonAreasParsed = JSON.parse(jsonAreas).toString();
      allAreas.push(jsonAreasParsed);

      /* estate types */
      var jsonEstate = JSON.stringify(data.sold[i].objectType, null, 2);
      var jsonEstateParsed = JSON.parse(jsonEstate).toString();
      allEstateTypes.push(jsonEstateParsed);

      /* years */
      var jsonYears = JSON.stringify(data.sold[i].soldDate, null, 2);
      var jsonYearsParsed = JSON.parse(jsonYears).toString();
      var jsonYearsSubstring = jsonYearsParsed.substr(0, 4);
      allYears.push(jsonYearsSubstring);

      /* estate size */
      var jsonAllEstateSizes = JSON.stringify(data.sold[i].rooms, null, 2);
      allEstateSizes.push(jsonAllEstateSizes);
    }

    /* get unique */
    /* areas */
    $.each(allAreas, function(i, e) {
        if ($.inArray(e, uniqueAreas) == -1) {
          uniqueAreas.push(e);
        }
        uniqueAreas.sort();
    });
    /* estate types */
    $.each(allEstateTypes, function(i, e) {
        if ($.inArray(e, uniqueEstateTypes) == -1) {
          uniqueEstateTypes.push(e);
        }
        uniqueEstateTypes.sort();
    });
    /* estate years */
    $.each(allYears, function(i, e) {
        if ($.inArray(e, uniqueYears) == -1) {
          uniqueYears.push(e);
        }
        uniqueYears.sort();
    });
    //$("#response").text(uniqueYears+"<br/>");
    /* estate size */
    $.each(allEstateSizes, function(i, e) {
        if ($.inArray(e, uniqueEstateSizes) == -1) {
          uniqueEstateSizes.push(e);
        }
        uniqueEstateSizes.sort();
    });

    /* propagate options */
    /* areas */
    var selectArea = document.getElementById("selectArea");
    var options = uniqueAreas;
    for (var i = 0; i < uniqueAreas.length; i++){
      var opt = options[i];
      var el = document.createElement("option");
      el.textContent = opt;
      el.value = opt;
      selectArea.appendChild(el);
    }

    /* estate types */
    var selectEstateType = document.getElementById("selectEstateType");
    var options = uniqueEstateTypes;
    for (var i = 0; i < uniqueEstateTypes.length; i++){
      //$("#test3").append(uniqueAreas[i] +"<br/>");
      var opt = options[i];
      var el = document.createElement("option");
      el.textContent = opt;
      el.value = opt;
      selectEstateType.appendChild(el);
    }

    /* estate sizes */
    var selectEstateSize = document.getElementById("selectEstateSize");
    var options = uniqueEstateSizes;
    for (var i = 0; i < uniqueEstateSizes.length; i++){
      //$("#test3").append(uniqueAreas[i] +"<br/>");
      var opt = options[i];
      var el = document.createElement("option");
      el.textContent = opt;
      el.value = opt;
      if (el.value != 'undefined') {
        selectEstateSize.appendChild(el);
      }
    }
  });
}

//Creates and returns a random number
function makeRandom(){
  var text = "";
  var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
  for(var i = 0; i < 16; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

//Porpagate the from-to-year-lists
function propagateYears(id, from, to) {
  var list = document.getElementById(id);
  for (i = from; i <= to; i++) {
    var option = document.createElement("option");
    option.text = i;
    option.value = i;
    list.appendChild(option);
  }
}

function errorMessage() {
  $('#error-message').show();
  $('#result').hide();
  $('#visualisation').hide();
  return false;
}

//When set/change the value in the 'from-year' list - then populate the 'to-year' list
$(document).on('change', '#selectYearFrom', function() {
  $("#selectYearTo").find("option:not(:first)").remove();
  $("#selectYearTo").val($("#selectYearTo option:first").val());
  var from = $(this).val();
  from = parseInt(from)+1;
  propagateYears("selectYearTo", from, 2017);
});

/*
//Firebase code - not in use
var firebaseRef = firebase.database().ref();
firebaseRef.child("test").set("walla");
*/
/*
function writeToFB(price, area) {
  firebase.database().ref().set({
    price: price,
    area: area
  });
}
*/

//ajax function for the API call
function getdata(url, callback){
  var data = $.ajax({
  type: 'GET',
  url: url
  })
  .done(callback)
  .error(function(){
    errorMessage();
  });
  return data;
};

//Show and populate text fields with values
function showResult(yearFrom, yearTo, type, size, area) {
  $('#visualisation').show();
  $(".display-years-from").text(yearFrom);
  $(".display-years-to").text(yearTo);
  $(".display-type").text(type);
  $(".display-size").text(size);
  $(".display-area").text(area);
}

//Compare the element x of objects in the array
function compare(a,b) {
  if (a.x < b.x)
    return -1;
  if (a.x > b.x)
    return 1;
  return 0;
}

//Create graph when all the api calls are done
function updateGraph(data, counter) {

  var count = data.length;
  if (count == counter) {
    var max = Math.max.apply(Math,data.map(function(o){return o.y;}));
    var min = Math.min.apply(Math,data.map(function(o){return o.y;}));
    var precent = Math.trunc((max-min)/min*100);

    if (isNaN(precent) == true) {
      errorMessage();
    }
    else {
      $(".display-percent").text(precent + "%");

      //Sort objects in array from year
      data.sort(compare);

      //Populate the D3 graph
      $('#result').show();
      InitChart(data);
    }
  }
}