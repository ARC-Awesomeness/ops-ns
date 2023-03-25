/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(["N/ui/serverWidget", "N/log", "N/redirect", "N/file", "N/runtime", "N/task", 'N/query', 'N/search'], function (ui, log, redirect, file, runtime, task, query, search) {

    function onRequest(context) {
        try {
            // var folder_id = runtime.getCurrentScript().getParameter('custscript_stock_folder_id');
            //var folder_name = runtime.getCurrentScript().getParameter('custscript_stock_folder_name');
            if (context.request.method == "GET") {
                let form = ui.createForm({
                    title: 'Financial Statements'
                });
                log.debug({ title: '', details: context.request.parameters });
                var payload = {};
                payload = context.request.parameters.custparam_import;
                if (payload) {
                    payload = JSON.parse(payload);
                    var seconds = 0
                    var time = new Date()
                    do {
                        taskStatus = task.checkStatus(payload.taskId);
                        seconds = (new Date() - time.getTime()) / 1000;

                    } while ((taskStatus.status !== task.TaskStatus.COMPLETE && taskStatus.status !== task.TaskStatus.FAILED) && seconds < 100);
                    if (seconds >= 99) {
                        redirect.redirect({
                            url: "https://6825580.app.netsuite.com/app/site/hosting/scriptlet.nl?script=713&deploy=1",
                            parameters: {
                                'custparam_import': JSON.stringify(payload)
                            }
                        });
                    } else {

                        var year = payload.year

                        let balanceString = "SELECT * FROM FILE WHERE NAME = 'BalanceSheet_" + payload.month + "/" + daysInMonth(payload.month, year) + "/" + year + "'"
                        if (payload.month < 10) {
                            payload.month = "0" + payload.month
                        }
                        var date = daysInMonth(payload.month, year) + "/" + payload.month + "/" + year
                        log.debug({ title: 'Date', details: date });


                        let sqlString = "SELECT * FROM customrecord_income_statements_reports where customrecord_income_statements_reports.custrecord_income_statements_month = '" + date + "' order by customrecord_income_statements_reports.id DESC"

                        var queryResults = query.runSuiteQL({
                            query: sqlString
                        });
                        var records = queryResults.asMappedResults();
                        log.debug({ title: 'queryResults', details: records });
                        log.debug({ title: 'queryResults', details: records.length });
                        ids = records[0].custrecord_income_statements_ids.split(',')
                        log.debug({ title: 'ids', details: ids });
                        var files = []
                        var allFile
                        var balanceFile
                        ids.forEach((fileid) => {
                            let fileQuery = "SELECT * FROM FILE WHERE ID =" + fileid
                            var fileResults = query.runSuiteQL({
                                query: fileQuery
                            });
                            var fileRec = fileResults.asMappedResults();
                            if (fileRec[0].name.indexOf("All_Locations_Departments") != -1) {
                                allFile = { filename: fileRec[0].name, fileurl: fileRec[0].url }
                            } else {


                                files.push({ filename: fileRec[0].name, fileurl: fileRec[0].url })
                            }
                        })
                        //files.sort((a, b) => a.filename - b.filename);
                        files.sort(function (a, b) {
                            var textA = a.filename.toUpperCase();
                            var textB = b.filename.toUpperCase();

                            return textA.localeCompare(textB);
                        });

                      
                        log.debug({ title: 'Files', details: files });
                          var queryResults = query.runSuiteQL({
                            query: balanceString
                        });
                        log.debug({ title: 'balanceString', details: balanceString });
                        var records = queryResults.asMappedResults();
                        log.debug({ title: 'queryResults', details: records });
                        log.debug({ title: 'queryResults', details: records.length });
                        if (records.length > 0) {
                            balanceFile = { filename: records[0].name, fileurl: records[0].url }
                        }
                        log.debug({ title: 'allFile', details: allFile });
                        var table = form.addField({
                            id: 'custpage_injectcode_table',
                            type: 'INLINEHTML',
                            label: 'Inject Code',
                            container: "Results"

                        });
                        table.defaultValue = tableString("resultTable", files, allFile,balanceFile)
                        context.response.writePage(form);
                    }


                } else {
                    var usergroup = form.addFieldGroup({
                        id: 'availablefilters',
                        label: 'Available Filters'
                    });

                    var periods = form.addField({
                        id: 'custpage_month',
                        type: ui.FieldType.SELECT,
                        label: 'Month',
                        container: "availablefilters"
                    });

                    addValuesToSelect(periods);
                    var periods = form.addField({
                        id: 'custpage_year',
                        type: ui.FieldType.TEXT,
                        label: 'Year',
                        container: "availablefilters"
                    });

                    form.addSubmitButton({ label: "Generate Report(s)" });
                    // form.clientScriptModulePath = './statement_reports_cs.js'
                    context.response.writePage(form);
                }
            } else if (context.request.method == "POST") {
                let payload = {}
                //log.debug({ title: '', details: context.request.parameters });

                //if (context.request.parameters["custpage_datelimit"]) {

                month = context.request.parameters["custpage_month"]
                log.debug({ title: 'month', details: month });

                year = context.request.parameters["custpage_year"]
                log.debug({ title: 'year', details: year });



                var executed = true
                var deployIndex = 1
                var mrTaskId
                while (executed) {
                    mrTaskId = createTask(month, year)
                    log.debug({ title: executed, details: executed });
                    deployIndex += 1
                    if (mrTaskId) {
                        executed = false;
                    }
                    if (deployIndex > 2) {
                        executed = false
                        log.debug({ title: 'MR: error', details: 'NOT available deploy' });
                    }
                }
                payload.month = month
                payload.year = year
                payload.taskId = mrTaskId
                redirect.redirect({
                    url: "https://6825580.app.netsuite.com/app/site/hosting/scriptlet.nl?script=713&deploy=1",
                    parameters: {
                        'custparam_import': JSON.stringify(payload)
                    }
                });

                //}
            }
        } catch (ex) {
            log.debug({ title: 'ERROR', details: ex });
        }
    }

    function createTask(month, year) {
        try {
            //let stringDeploy = 'customdeploy_statement_report_gen_mr' + deploy
            var mrexecuteTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_statement_report_gen_mr',
                deploymentId: 'customdeploy_statement_report_gen_mr',
                params: {
                    custscript_month: month,
                    custscript_year: year
                },
            });
            var schTaskId = mrexecuteTask.submit();
            if (schTaskId) {
                log.debug({ title: 'schTaskId', details: schTaskId });
                return schTaskId
            }
        } catch (error) {
            log.debug({ title: 'MR: error', details: error });
            return undefined
        }

    }

    function addValuesToSelect(control) {
        try {
            control.addSelectOption({ value: "0", text: "" });
            control.addSelectOption({ value: "1", text: "January" });
            control.addSelectOption({ value: "2", text: "February" });
            control.addSelectOption({ value: "3", text: "March" });
            control.addSelectOption({ value: "4", text: "April" });
            control.addSelectOption({ value: "5", text: "May" });
            control.addSelectOption({ value: "6", text: "June" });
            control.addSelectOption({ value: "7", text: "July" });
            control.addSelectOption({ value: "8", text: "August" });
            control.addSelectOption({ value: "9", text: "September" });
            control.addSelectOption({ value: "10", text: "October" });
            control.addSelectOption({ value: "11", text: "November" });
            control.addSelectOption({ value: "12", text: "December" });
        } catch (error) {
            log.debug("Error", error)
        }
    }

    function getQuarterPeriods() {
        try {
            var qrtPeriod = [];
            var accountingperiodSearchObj = search.create({
                type: "accountingperiod",
                filters:
                    [
                        ["isquarter", "is", "F"],
                        "AND",
                        ["isyear", "is", "F"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "periodname",
                            sort: search.Sort.ASC,
                            label: "Name"
                        })
                    ]
            });
            accountingperiodSearchObj.run().each(function (result) {
                qrtPeriod.push({ id: result.id, name: result.getValue("periodname") })
                return true;
            });
            return qrtPeriod;
        } catch (error) {
            log.debug("Error Get Quarters Periods", error);
        }
    }
    function daysInMonth(month, year) {
        return new Date(year, month, 0).getDate();
    }
    function tableString(tableName, items, allFile,balanceFile) {
        var style = styleString(tableName)
        var tableLabel = ""
        // var tableLabel = " <a target='_blank' href=" + "https://8015667-sb1.app.netsuite.com/core/media/media.nl?id=2454&c=8015667_SB1&h=eU1SI8KjaNIzMsEP6J6wPqjwJxqFjzK6c2vkmQqcWzIgX9F1&_xt=.pdf" + ">Download ALL</a>"
        tableLabel += "<table id=" + tableName + "  style= width:100%> <tr> <th>PDF</th><th>URL </th></tr>";
        tableLabel += "<tr>";
        tableLabel += "<td>" + balanceFile.filename + " </td>";
        tableLabel += "<td> <a target='_blank' href='" + balanceFile.fileurl + "'>Download</a> </td>";
        tableLabel += "</tr>";
        tableLabel += "<tr>";
        tableLabel += "<td>" + allFile.filename + " </td>";
        tableLabel += "<td> <a target='_blank' href='" + allFile.fileurl + "'>Download</a> </td>";
        tableLabel += "</tr>";
        items.forEach(element => { tableLabel += addTrOnTable(element) });
        tableLabel += "</table></br></br></br>";
        return functionString() + style + tableLabel
    }

    function addTrOnTable(item) {
        trLabel = "<tr>";
        trLabel += "<td>" + item.filename + " </td>";
        trLabel += "<td> <a target='_blank' href='" + item.fileurl + "'>Download</a> </td>";
        trLabel += "</tr>";
        return trLabel
    }
    function styleString(tableName) {
        var style = ""
        var stylebutton = "<link rel=stylesheet href=https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css><style> button {margin-left:80px;float: left;width: 20%;padding: 5px; background: #2196F3;color: white;font-size: 17px;border: 1px solid grey;border-left: none;ursor: pointer;}button:hover {background: #0b7dda;}form.example::after {clear: both; display: table;}"
        var styleTable = "<style>  .center {margin: auto;width: 60%;padding: 10px; font-family:Arial, Helvetica, sans-serif;font-size:40px;font-weight:bold;} #" + tableName + " {font-family: Arial, Helvetica, sans-serif; font-size:20px; border-collapse: collapse;width: 100%;font-size:20px;padding: 15px 32px; }#" + tableName + " td,#" + tableName + " th {border: 1px solid #ddd;padding: 8px;} #" + tableName + " tr:nth-child(even){background-color: #f2f2f2;} #" + tableName + " tr:hover {background-color: #ddd;} #" + tableName + " th {padding-top: 12px;padding-bottom: 12px;text-align: left;background-color: #ffb43d;color: white;}</style> ";
        style += stylebutton + styleTable
        return style
    }
    function functionString() {
        var stringFunction = "<script> var search = require(['N/search']);var query = require(['N/query']);"
        stringFunction += addTrOnTable.toString()
        stringFunction += "</script>"
        return stringFunction
    }

    function getMonth(period) {
        try {
            month = search.lookupFields({
                type: 'accountingperiod',
                id: period,
                columns: ['periodname']
            })
            periodname = month.periodname.split("")
            log.debug("status", month);
            switch (month[0].toLowerCase()) {
                case "jan":
                    return 1;
                case "feb":
                    return 2;
                case "mar":
                    return 3;
                case "apr":
                    return 4;
                case "may":
                    return 5;
                case "jun":
                    return 6;
                case "jul":
                    return 7;
                case "aug":
                    return 8;
                case "sep":
                    return 9;
                case "oct":
                    return 10;
                case "nov":
                    return 11;
                case "dec":
                    return 12;
            }
        } catch (error) {
            log.debug("Error get month", error);
        }
    }

    return {
        onRequest: onRequest
    }
});
