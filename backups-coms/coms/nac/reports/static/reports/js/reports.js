$(document).ready(function() {
    if (!$('body').hasClass('reports-viewer')) return;

    function show_sales_breakup(data) {
        var options = {
            chart: {
                type: 'line'
            },
            title: {
                text: 'Sales Breakup by Sales Person'
            },
            xAxis: {
                categories: data.months,
                crosshair: true
            },
            yAxis: [{
                min: 0,
                title: {
                    text: 'No. of Caravans Sold'
                }
            },
            {
                linkedTo: 0,
                title: {
                    text: 'No. of Caravans Sold'
                },
                opposite: true
            }],
            tooltip: {
                headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                    '<td style="padding:0"><b>{point.y}</b></td></tr>',
                footerFormat: '</table>',
                shared: true,
                useHTML: true
            },
            plotOptions: {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0
                }
            },
            credits: {
                enabled: false
            },
            series: data.staff
        };

        $('#hcontainer0').highcharts(options);

        if (data.dealerships === null)
        {
            $('#hcontainer1').empty();
        }
        else
        {
            options.title.text = 'Sales Breakup by Dealership';
            options.series = data.dealerships;
            $('#hcontainer1').highcharts(options);
        }

        $('#hcontainer2').empty();
    } //end show_sales_breakup

    function show_warranty_response(data) {
        var options = {
            chart: {
                type: 'column'
            },
            title: {
                text: data.title
            },
            xAxis: {
                categories: data.series,
                crosshair: true
            },
            yAxis: [{
                min: 0,
                title: {
                    text: 'No. of Claims'
                }
            },
            {
                linkedTo: 0,
                title: {
                    text: 'No. of Claims'
                },
                opposite: true
            }],
            tooltip: {
                formatter: function () {
                    return '<span style="font-size:10px"> ' + this.y + ' claims took ' + this.x + ' days to process</span>';
                },
                shared: true,
                useHTML: true
            },
            plotOptions: {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0
                }
            },
            credits: {
                enabled: false
            },
            series: [data.yaxis]
        };

        $('#hcontainer0').highcharts(options);
        $('#hcontainer1').empty();
        $('#hcontainer2').empty();
    } //end show_warranty_response

    function show_lead_count_breakup(rd) {
        var options = {
            chart: {
                type: 'pie',
                options3d: {
                    enabled: true,
                    alpha: 45,
                    beta: 0
                }
            },
            title: {
                text: rd.awareness_title
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    depth: 35,
                    dataLabels: {
                        enabled: true,
                        format: '{point.name}'
                    }
                }
            },
            credits: {
                enabled: false
            },
            series: [{
                type: 'pie',
                name: 'Share',
                data: rd.awareness
            }]
        };

        $('#hcontainer0').highcharts(options);

        options.title.text = rd.model_title;
        options.series[0].data = rd.model;
        $('#hcontainer1').highcharts(options);

        options.title.text = rd.type_title;
        options.series[0].data = rd.type;
        $('#hcontainer2').highcharts(options);
    } //end lead_count_breakup

    if ($("#hdn_op").val() != '')
    {
        switch ($("#hdn_op").val())
        {
            case 'sales_break_up':
                show_sales_breakup(rdata);
                break;

            case 'warranty_response_time':
                show_warranty_response(rdata);
                break;

            case 'lead_count_breakup':
                show_lead_count_breakup(rdata);
                break;
        }
    }
});