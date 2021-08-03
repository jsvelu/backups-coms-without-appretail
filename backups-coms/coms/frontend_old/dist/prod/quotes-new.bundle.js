webpackJsonp([12],{0:function(r,e,n){r.exports=n(174)},45:function(r,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default=function(r){r.controller("QuotesController",["$scope","$http","ApiService",function(r,e,s){n(63),r.post=function(r){return s.post("quotes/",r)},r.table_object=null,r.customer_type="Customer",r.choices={},r.customer_form={},r.order={physical_add:{owner:"",street:"",postcode:"",state:"",suburb:""},delivery_add:{name:"",street:"",postcode:"",state:"",suburb:""},invoice_add:{name:"",street:"",postcode:"",state:"",suburb:""},customer:{partner_name:""}},r.order.desired_dd_day=1,r.order.desired_dd_month=2,r.order.desired_dd_year=2016,r.days=[],r.months=[],r.years=[];for(var o=new Date,l=1;l<=31;l++)r.days.push(l);for(var a=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],t=0;t<12;t++)r.months.push([t,a[t]]);for(var d=0;d<=20;d++)r.years.push(o.getFullYear()+d);r.post({type:"get_new_pre_data"}).then(function(e){r.choices.dealerships=e.data.list.dealers,r.choices.states=e.data.list.states});var i=function(){return{type:"get_list",search:r.search_id}};r.ajax_config={url:"/api/quotes/",data:i,dataSrc:"list",columns:[{data:"created",title:"Date Created"},{data:"quote_type",title:"Type"},{data:"quoted_for",title:"Quoted For"},{data:"series",title:"Series"},{data:"sales_person",title:"Sales Person"},{data:"retail_price",title:"$ Retail Sale Price"},{data:"",title:""}]},r.table_config={oLanguage:{sLoadingRecords:'<img src="/static/newage/images/rolling.gif">'},bFilter:!1,bLengthChange:!1,columnDefs:[{targets:-1,data:"id",render:function(r,e,n,s){return'<a class="btn btn-default" href="edit_quote?id='+n.id+'">Manage</a>'}}]},r.search=function(e){r.search_id=e.id,r.table_object.ajax.reload()},r.select_physical_suburb=function(e){r.order.physical_add.suburb=e.suburb,r.order.physical_add.postcode=e.postcode,r.order.physical_add.state=e.state_id},r.select_delivery_suburb=function(e){r.order.delivery_add.suburb=e.suburb,r.order.delivery_add.postcode=e.postcode,r.order.delivery_add.state=e.state_id},r.select_invoice_suburb=function(e){r.order.invoice_add.suburb=e.suburb,r.order.invoice_add.postcode=e.postcode,r.order.invoice_add.state=e.state_id},r.add_customer_quote=function(e){e.$valid&&r.post({type:"add_customer_quote",data:r.order}).then(function(e){"fail"===e.data.result?(r.order.insert_successful_message="",r.order.insert_failed_message=e.data.message):(r.order.insert_failed_message="",r.order.insert_successful_message=e.data.message)})}}])},r.exports=e.default},63:function(r,e){},174:function(r,e,n){"use strict";var s=n(10);n(45)(s),s.config(["$stateProvider",function(r){r.state("new",{url:"",template:n(307),controller:"QuotesController"})}])},307:function(r,e){r.exports='<top-bar>\r\n    <h2>Create New Quote</h2>\r\n    <div class="row top-bar-info">\r\n        <div class="col-sm-2" ng-if="current_dealership()">\r\n            <h5>Dealership</h5>\r\n            <h4>{{ current_dealership().title }}</h4>\r\n        </div>\r\n        <div class="col-sm-2" ng-if="order.model && order.series">\r\n            <h5>Model</h5>\r\n            <h4>{{ info.model_detail.title }}</h4>\r\n            {{ info.series_detail.title }}\r\n        </div>\r\n        <div class="col-sm-2" ng-if="order.model && order.series">\r\n            <h5>Retail Sale price</h5>\r\n            <h4 ng-if="info.show_price">{{ info.series_detail.rrp | currency }}</h4>\r\n            <a href="" ng-click="info.show_price = !info.show_price">\r\n                <span ng-if="info.show_price">Hide </span>\r\n                <span ng-if="!info.show_price">Show </span>price\r\n            </a>\r\n        </div>\r\n    </div>\r\n</top-bar>\r\n\r\n<div class="container">\r\n    <div class="row">\r\n        <div class="col-sm-12">Create a new Quote for:</div>\r\n    </div>\r\n    <div class="row">\r\n        <div class="col-sm-12">\r\n            <div class="radio">\r\n              <label>\r\n                <input type="radio" ng-model="customer_type" value="Customer">\r\n                Customer\r\n              </label>\r\n            </div>\r\n            <div class="radio">\r\n              <label>\r\n                <input type="radio" ng-model="customer_type" value="Dealership">\r\n                Dealership\r\n              </label>\r\n            </div>\r\n        </div>\r\n    </div>\r\n    <div class="row" ng-if="customer_type==\'Dealership\'">\r\n        <div class="col-sm-12">\r\n\r\n            <form name="stock_form" class="form top-margin-30">\r\n                <div class="panel panel-primary" id="panels">\r\n                    <div class="panel-heading">Create a stock quote</div>\r\n                    <div class="panel-body">\r\n                            <div class="col-sm-6">\r\n                                <label class="form-label">DEALERSHIP</label>\r\n                                <select class="form-control"\r\n                                        ng-model="order.dealer_dealership"\r\n                                        ng-options="dealer.id as dealer.title for dealer in choices.dealerships"\r\n                                        required>\r\n                                    <option value="">Select a dealership</option>\r\n                                </select>\r\n                            </div>\r\n\r\n                            <div class="col-sm-6">\r\n                                <label class="form-label">DESIRED DELIVERY DATE</label>\r\n                                <date-dropdowns></date-dropdowns>\r\n                            </div>\r\n                    </div>\r\n                </div>\r\n                <div class="form-group col-sm-3">\r\n                    <button type="submit" class="btn btn-primary form-control" ng-click="proceed(stock_form)">Create and proceed</button>\r\n                </div>\r\n            </form>\r\n        </div>\r\n    </div>\r\n    <div class="row" ng-if="customer_type==\'Customer\'">\r\n        <div class="col-sm-12">\r\n            <form name="customer_form" novalidate class="form top-margin-30" autocomplete="off" form-autofill-fix ng-submit="add_customer_quote(customer_form)">\r\n                <div class="panel panel-primary" id="panels">\r\n                    <div class="panel-heading">Create a Customer quote</div>\r\n                    <div class="panel-body">\r\n                        <div class="row">\r\n                            <div class="form-group col-sm-6">\r\n                                <label class="form-label">DEALERSHIP</label>\r\n                                <select class="form-control"\r\n                                        ng-model="order.customer_dealership"\r\n                                        ng-options="dealer.id as dealer.title for dealer in choices.dealerships">\r\n                                    <option value="">Select a dealership (optional)</option>\r\n                                </select>\r\n                            </div>\r\n                        </div>\r\n\r\n                        <!-- Customer details -->\r\n\r\n                        <div class="row top-margin-40">\r\n                            <div class="col-sm-6"><h4>Customer Details</h4></div>\r\n                            <div class="col-sm-6">\r\n                                <button class="btn btn-default pull-right">Retrieve customer from leads</button>\r\n                            </div>\r\n                        </div>\r\n\r\n                        <div class="row top-margin-30">\r\n                            <div class="col-sm-6"><i>Fields marked with an asterisk are required</i></div>\r\n                        </div>\r\n\r\n                        <div class="row top-margin-20">\r\n                            <div class="form-group col-sm-6">\r\n                                <label class="form-label">\r\n                                    <red-star></red-star>\r\n                                    FIRST NAME</label>\r\n                                <input type="text" class="form-control" ng-model="order.customer.first_name" name="first_name" required/>\r\n                                <required-field form="customer_form" name="customer_form.first_name" label="First Name"></required-field>\r\n                            </div>\r\n                            <div class="form-group col-sm-6">\r\n                                <label class="form-label">\r\n                                    <red-star></red-star>\r\n                                    LAST NAME</label>\r\n                                <input type="text" class="form-control" ng-model="order.customer.last_name" name="last_name" required/>\r\n                                <required-field form="customer_form" name="customer_form.last_name" label="Last Name"></required-field>\r\n                            </div>\r\n                        </div>\r\n\r\n                        <div class="row top-margin-20">\r\n                            <div class="form-group col-sm-6">\r\n                                <label class="form-label">\r\n                                    <red-star></red-star>\r\n                                    EMAIL</label>\r\n                                <input type="text" class="form-control" ng-model="order.customer.email" name="email" required/>\r\n                                <required-field form="customer_form" name="customer_form.email" label="Email Address"></required-field>\r\n                            </div>\r\n                            <div class="form-group col-sm-6">\r\n                                <label class="form-label">PARTNER\'S NAME</label>\r\n                                <input type="text" class="form-control" ng-model="order.customer.partner_name" name="partner_name" />\r\n                            </div>\r\n                        </div>\r\n\r\n                        <div class="row top-margin-20">\r\n                            <div class="form-group col-sm-6">\r\n                                <label class="form-label">\r\n                                    <red-star></red-star>\r\n                                    PHONE NUMBER</label>\r\n                                <input type="text" class="form-control" ng-model="order.customer.phone_number" name="phone_number" required/>\r\n                                <required-field form="customer_form" name="customer_form.phone_number" label="Phone Number"></required-field>\r\n                            </div>\r\n                            <div class="form-group col-sm-6">\r\n                                <label class="form-label">DESIRED DELIVERY DATE</label>\r\n                                <div class="date-dropdowns">\r\n                                    <select class="form-control"\r\n                                            ng-model="order.desired_dd_day"\r\n                                            ng-options="day as day for day in days">\r\n                                        <option value="">dd</option>\r\n                                    </select>\r\n                                    <select class="form-control"\r\n                                            ng-model="order.desired_dd_month"\r\n                                            ng-options="month[0] as month[1] for month in months">\r\n                                        <option value="">mm</option>\r\n                                    </select>\r\n                                    <select class="form-control"\r\n                                            ng-model="order.desired_dd_year"\r\n                                            ng-options="year as year for year in years">\r\n                                        <option value="">yyyy</option>\r\n                                    </select>\r\n                                </div>\r\n                            </div>\r\n                        </div>\r\n\r\n\r\n                        <!-- Address -->\r\n\r\n\r\n                        <div class="row top-margin-40">\r\n                            <div class="col-sm-6"><h4>Address</h4></div>\r\n                        </div>\r\n\r\n                        <div class="row top-margin-20">\r\n                            <div class="form-group col-sm-6">\r\n                                <label class="form-label">\r\n                                    REGISTERED OWNER</label>\r\n                                <input type="text" ng-model="order.physical_add.owner" name="physical_add_owner" class="form-control"/>\r\n                            </div>\r\n                        </div>\r\n\r\n                        <div class="row top-margin-20">\r\n                            <div class="form-group col-sm-6">\r\n                                <label class="form-label">\r\n                                    STREET ADDRESS</label>\r\n                                <input type="text" ng-model="order.physical_add.street" name="physical_add_street" class="form-control"/>\r\n                            </div>\r\n                            <div class="form-group col-sm-6">\r\n                                <label class="form-label">\r\n                                    LOOKUP CITY OR SUBURB</label>\r\n                                <lookup result="search.physical_suburb"\r\n                                        on-select="select_physical_suburb" type="suburb_lookup" name="physical_add_suburb" autocomplete="off"></lookup>\r\n                            </div>\r\n                        </div>\r\n\r\n                        <div class="row top-margin-20">\r\n                            <div class="form-group col-sm-6">\r\n                                <label class="form-label">\r\n                                    CITY / SUBURB</label>\r\n                                <input type="text"  ng-model="order.physical_add.suburb" name="physical_add_suburb" class="form-control"/>\r\n                            </div>\r\n                            <div class="form-group col-sm-4">\r\n                                <label class="form-label">\r\n                                    POSTCODE</label>\r\n                                <input type="text" ng-model="order.physical_add.postcode" name="physical_add_postcode" class="form-control"/>\r\n                            </div>\r\n                            <div class="form-group col-sm-2">\r\n                            </div>\r\n                        </div>\r\n\r\n                        <div class="row top-margin-20">\r\n                            <div class="form-group col-sm-6">\r\n                                <label class="form-label">\r\n                                    STATE</label>\r\n                                <select  class="form-control"\r\n                                        ng-model="order.physical_add.state" name="physical_add_state"\r\n                                        ng-options="state.id as state.title for state in choices.states">\r\n                                    <option value="">Select a state</option>\r\n                                </select>\r\n                            </div>\r\n\r\n                        </div>\r\n\r\n                        <div class="row top-margin-40">\r\n\r\n                            <accordion class="red" close-others="false">\r\n\r\n                                <!-- Delivery -->\r\n\r\n                                <accordion-group>\r\n                                    <accordion-heading>\r\n                                        <div>Add Delivery details (if different)</div>\r\n                                    </accordion-heading>\r\n\r\n                                    <div class="row top-margin-20">\r\n                                        <div class="form-group col-sm-6">\r\n                                            <label class="form-label">NAME</label>\r\n                                            <input type="text" ng-model="order.delivery_add.name" class="form-control"/>\r\n                                        </div>\r\n                                    </div>\r\n\r\n                                    <div class="row top-margin-20">\r\n                                        <div class="form-group col-sm-6">\r\n                                            <label class="form-label">STREET ADDRESS</label>\r\n                                            <input type="text" ng-model="order.delivery_add.street" class="form-control"/>\r\n                                        </div>\r\n                                        <div class="form-group col-sm-6">\r\n                                            <label class="form-label">LOOKUP CITY OR SUBURB</label>\r\n                                            <lookup result="search.delivery_suburb"\r\n                                                on-select="select_delivery_suburb" type="suburb_lookup" autocomplete="off"></lookup>\r\n                                        </div>\r\n                                    </div>\r\n\r\n                                    <div class="row top-margin-20">\r\n                                        <div class="form-group col-sm-6">\r\n                                            <label class="form-label">\r\n                                                CITY / SUBURB</label>\r\n                                            <input type="text"  ng-model="order.delivery_add.suburb" name="delivery_add_suburb" class="form-control"/>\r\n                                        </div>\r\n                                        <div class="form-group col-sm-4">\r\n                                            <label class="form-label">POSTCODE</label>\r\n                                            <input type="text" ng-model="order.delivery_add.postcode" class="form-control"/>\r\n                                        </div>\r\n                                        <div class="form-group col-sm-2">\r\n                                        </div>\r\n                                    </div>\r\n\r\n                                    <div class="row top-margin-20">\r\n                                        <div class="form-group col-sm-6">\r\n                                            <label class="form-label">STATE</label>\r\n                                            <select  class="form-control"\r\n                                                    ng-model="order.delivery_add.state"\r\n                                                    ng-options="state.id as state.title for state in choices.states">\r\n                                                <option value="">Select a state</option>\r\n                                            </select>\r\n                                        </div>\r\n                                    </div>\r\n\r\n                                </accordion-group>\r\n\r\n\r\n                                <!-- Invoice -->\r\n\r\n                                <accordion-group>\r\n                                    <accordion-heading>\r\n                                        <div>Add Invoice details (if different)</div>\r\n                                    </accordion-heading>\r\n\r\n                                    <div class="row top-margin-20">\r\n                                        <div class="form-group col-sm-6">\r\n                                            <label class="form-label">NAME</label>\r\n                                            <input type="text" ng-model="order.invoice_add.name" class="form-control"/>\r\n                                        </div>\r\n                                    </div>\r\n\r\n                                    <div class="row top-margin-20">\r\n                                        <div class="form-group col-sm-6">\r\n                                            <label class="form-label">STREET ADDRESS</label>\r\n                                            <input type="text" ng-model="order.invoice_add.street" class="form-control"/>\r\n                                        </div>\r\n                                        <div class="form-group col-sm-6">\r\n                                            <label class="form-label">LOOKUP CITY OR SUBURB</label>\r\n                                            <lookup result="search.invoice_suburb"\r\n                                                on-select="select_invoice_suburb" type="suburb_lookup" autocomplete="off"></lookup>\r\n                                        </div>\r\n                                    </div>\r\n\r\n                                    <div class="row top-margin-20">\r\n                                        <div class="form-group col-sm-6">\r\n                                            <label class="form-label">\r\n                                                CITY / SUBURB</label>\r\n                                            <input type="text"  ng-model="order.invoice_add.suburb" name="invoice_add_suburb" class="form-control"/>\r\n                                        </div>\r\n                                        <div class="form-group col-sm-4">\r\n                                            <label class="form-label">POSTCODE</label>\r\n                                            <input type="text" ng-model="order.invoice_add.postcode" class="form-control"/>\r\n                                        </div>\r\n                                        <div class="form-group col-sm-2"></div>\r\n                                    </div>\r\n\r\n                                    <div class="row top-margin-20">\r\n                                        <div class="form-group col-sm-6">\r\n                                            <label class="form-label">STATE</label>\r\n                                            <select  class="form-control"\r\n                                                    ng-model="order.invoice_add.state"\r\n                                                    ng-options="state.id as state.title for state in choices.states">\r\n                                                <option value="">Select a state</option>\r\n                                            </select>\r\n                                        </div>\r\n                                    </div>\r\n\r\n                                </accordion-group>\r\n                            </accordion>\r\n\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row">\r\n                    <div class="form-group col-sm-3">\r\n                        <button type="submit" class="btn btn-primary form-control" data-ng-disabled="progress.active()">Create and proceed</button>\r\n                    </div>\r\n                </div>\r\n                <div class="row">\r\n                    <div class="alert alert-success" ng-if="order.insert_successful_message">{{ order.insert_successful_message }}</div>\r\n                    <div class="alert alert-danger" ng-if="order.insert_failed_message">{{ order.insert_failed_message }}</div>\r\n                </div>\r\n\r\n            </form>\r\n        </div>\r\n    </div>\r\n</div>'}});