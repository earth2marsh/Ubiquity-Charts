/* Graphs pie, bar, and line charts.
*  Updated to the new parser by Ammad http://github.com/ammad
*/
 
var colors = "&chco=94B6D2,D6AA20,759E00,D8773A,007777,B53A3A,713871,4A6E21,979000",
    //"&chco=7979B2,C6C6FF,E0E0FF,B2A567,FFF5C6";
    noun_type_chart = new CmdUtils.NounType( "chart",
      ["pie", "bar", "line", "tline"], "pie"
    );
 
function selectionToArray( string ) {
  // expects you to pass a well-formed table of data with labels is 1st column
 
  // convert tags to delimiters ("," for values, "|" for records), then split data into rows
 
  var tmpData = //string.replace(/([0-9]),([0-9])/g,"$1$2").replace(/\$([0-9])/g,"$1").replace(/([0-9])\%/g,"$1").replace(/, */g,"%2C").replace(/\|/g, "%7C").replace(/\r\n/g, "|").replace(/\n/g, "|").replace(/\t/g,",").replace(/\t\t/g,"\t0\t").split(/\|/);
  
      CmdUtils.getHtmlSelection(context).replace(/([0-9]),([0-9])/g,"$1$2").replace(/\$([0-9])/g,"$1").replace(/([0-9])\%/g,"$1").replace(/, */g,"%2C").replace(/\|/g, "%7C").replace(/\r\n|\n/g, "|").replace(/<\/{0,1}tr[^>]*>/g, "|").replace(/^\|/g, "").replace(/\|\|/g, "|").replace(/\|$/g, "").replace(/<\/td[^>]*>/g, ",").replace(/,\|/g, "|").replace(/,$/g, "").replace(/<[^>]*>/g, "").replace(/\|\|/g, "|").split(/\|/);
 
  var rows = tmpData.length;
  var tableData = new Array(rows);
 
  // parse rows into columns
  for(var i=0; i<rows; i++){
    tableData[i] = tmpData[i].split(/,/);
  }
  
  return tableData;
}
 
function graphObj(tableData){
  var rows = tableData.length;
  var columns = tableData[0].length;
 
  var data = {
    labels: new Array(rows),
    values: new Array(rows),
    min: Number.MAX_VALUE,
    max: Number.MIN_VALUE,
    string: tableData
  }
 
    // copy the first column into a array of labels, rest into 2 dimensional array of values
  for(i=0; i<rows; i++) {
    // build labels with the first element of each row
    data.labels[i] = tableData[i][0].replace(/%2C/g,", ").replace(/%7C/g, "|");
    data.values[i] = new Array(columns-1);
    for (var j=1;j<columns; j++){
      data.values[i][j-1] = tableData[i][j];
      if (tableData[i][j]<data.min) data.min = parseFloat(tableData[i][j]);
      if (tableData[i][j]>data.max) data.max = parseFloat(tableData[i][j]);
    }
  }
 
  return data;
}
 
 
function transposeArray(inArray){
  var rowsIn = inArray.length;
  var columnsIn = inArray[0].length;
  var outArray = new Array(columnsIn);
 
  for(i=0; i<columnsIn; i++) {
    outArray[i] = new Array(rowsIn);
    for (var j=0;j<rowsIn; j++){
      outArray[i][j] = inArray[j][i];
    }
  }
  return outArray;
}
 
function formatValues(valArray) {
  var rows = valArray.length;
  var columns = valArray[0].length;
  var values = "";
 
  //  traverse table by columns to build values: delimit columns with commas, rows with pipes
  for (var i=0; i<columns; i++){
    for (var j=0;j<rows; j++){
      values += (valArray[j][i]);
      if (j<rows-1) values += ",";
    }
    if (i<columns-1) values += "|";
  }
  return values;
}
 
function formatLabels(labArray){
  var rows = labArray.length;
  var labels = "";
  for(var i=0; i<rows; i++){
    // add element to label string
    labels += labArray[i];
    // if not last row, add a pipe delimiter
    if (i<rows-1) labels += "|";
  }
  return labels;
}
  
function scaleTo100(valArray, maxVal){
  var rows = valArray.length;
  var columns = valArray[0].length;
  var rescale = maxVal / 100;
 
  //  traverse table by columns to build values: delimit columns with commas, rows with pipes
  for (var i=0; i<columns; i++){
    for (var j=0;j<rows; j++){
      valArray[j][i] = valArray[j][i] / rescale;
    }
  }
  return valArray;
}
 
function  dataToChart( args ) {
  var data = graphObj(selectionToArray( args.object.html ));
 
  if( !data ) return null;
  
  data.labelquery = formatLabels(data.labels);
  // pie charts only handle values up to 100, so scale them!
  if( args.format.text == "pie" )
    data.values = scaleTo100(data.values, data.max);
  else if ( args.format.text == "tline" ) {
    data.values = transposeArray(data.values);
    args.format.text = "line";
  }
  data.valuequery = formatValues(data.values);
 
  var graphHeight = 200;
 
  //if (!isNaN(parseInt(args.height.text))) graphHeight = args.height.text;
  if (graphHeight > 387) graphHeight = 387;
 
  var graphWidth = graphHeight *2;
 
  //if (!isNaN(parseInt(args.width.text))) graphWidth = args.width.text;
  if (graphWidth > 774) graphWidth = 774;
 
  if ( args.format.text == "bar" ) {
    var ymin = (data.min * 0.75);
    if (ymin < 10) ymin = 0;
    if (data.max > 80 && data.max < 100) data.max = 100;
  }else if ( args.format.text == "line" )
    var ymin = (data.min - (data.max - data.min) * .1);
  
  var urlstart = ({ 
        pie:"pc",
        bar:"bvg&chxt=y&chbh=a",
        line:"lc&chxt=y"
      })[args.format.text],
 
      urlend = ({ 
        pie:"",
        bar:colors,
        line:colors
      })[args.format.text];
 
  img = "<img src='http://chart.apis.google.com/chart?cht="+urlstart+"&chs="+graphWidth+"x"+graphHeight+"&chl="+data.labelquery+"&chd=t:"+data.valuequery+"&chds="+ymin+","+data.max+"&chtxt=x,y&chxr=0,"+ymin+","+data.max+urlend+"'/>";
  return img;
 
}
 
CmdUtils.CreateCommand({
  names: ["chart"],
  arguments: [ {role: "object", nountype: noun_arb_text, label: "Column of labels and column(s) of values"},
               {role: "format", nountype: noun_type_chart},
               {role: "height", nountype: noun_type_number},
               {role: "width", nountype: noun_type_number} ],
  icon: "chrome://ubiquity/skin/icons/calculator.png",
  description: "Turn numeric data into charts using the Google Charts API.",
  help: "Select a table. Chart types supported: pie, bar, line and tline(transposed line graph)",
  homepage: "http://earth2marsh.com/ubiquity/",
  author: {name: "Marsh Gardiner", email: "ubiquity@earth2marsh.com"},
  license: "MPL",
 
  preview: function(pblock, args) {
 
    var img = dataToChart( args );
 
 
    if( !img )
      jQuery(pblock).text( "Requires numbers to graph." );
    else
      jQuery(pblock).empty().append( img ).height( "15px" );
  },
 
  execute: function( args ) {
    var img = dataToChart( args );
    if( img ) CmdUtils.setSelection( img );
  }
});