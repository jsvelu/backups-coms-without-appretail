webpackJsonp([15],{0:function(t,a,e){t.exports=e(178)},119:function(t,a){"use strict";Object.defineProperty(a,"__esModule",{value:!0}),a.default=function(t){t.controller("AllUOMController",["$scope","$http","ApiService",function(t,a,e){t.post=function(t){return e.post("uom/",t)},t.table_object=null;var n=function(){return{type:"all",search:t.search.text}};t.ajax_config={url:"/api/uom/",data:n,dataSrc:"list",columns:[{data:"name",title:"Name"}]},t.table_config={oLanguage:{sLoadingRecords:'<img src="/static/newage/images/rolling.gif">'},bFilter:!1,bLengthChange:!1,columnDefs:[{targets:-1,data:null,defaultContent:"<button class='btn btn-default'>Manage</button>"}]},t.search=function(){t.table_object.ajax.reload()}}])},t.exports=a.default},178:function(t,a,e){"use strict";var n=e(10);e(119)(n),n.config(["$stateProvider",function(t){t.state("all_uom",{url:"",template:e(282),controller:"AllUOMController"})}])},282:function(t,a){t.exports='<top-bar>\r\n    <h2>All Units of Measure</h2>\r\n\r\n    <form class="form col-sm-6 searchbox" ng-submit="search()" autocomplete="off">\r\n        <lookup result="search.text" placeholder="Search by Name" on-select="search"\r\n                type="uom_lookup" autocomplete="off"></lookup>\r\n    </form>\r\n    <button class="btn btn-primary pull-right header-right-button"><i class="glyphicon glyphicon-plus"></i> Create a New\r\n        Unit of Measure\r\n    </button>\r\n</top-bar>\r\n\r\n<div class="container">\r\n    <div class="row">\r\n        <ajax-data-table data-table="table_object" data-config="ajax_config"\r\n                         data-options="table_config"></ajax-data-table>\r\n    </div>\r\n</div>'}});