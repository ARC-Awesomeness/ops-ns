/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(["N/ui/serverWidget", "N/log", "N/redirect", "N/file", "N/runtime", "N/task", 'N/query'], function (ui, log, redirect, file, runtime, task, query) {

    function onRequest(context) {
        try {
            var folder_id = runtime.getCurrentScript().getParameter('custscript_stock_folder_id');
            var folder_name = runtime.getCurrentScript().getParameter('custscript_stock_folder_name');
            if (context.request.method == "GET") {
                let form = ui.createForm({
                    title: 'Stock Ledger Report'
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
                            url: "https://6825580.app.netsuite.com/app/site/hosting/scriptlet.nl?script=506&deploy=1",
                            parameters: {
                                'custparam_import': JSON.stringify(payload)
                            }
                        });
                    } else {
                        let sqlString = "SELECT * FROM file where file.name LIKE '%StockReport%' "

                        var queryResults = query.runSuiteQL({
                            query: sqlString
                        });
                        var records = queryResults.asMappedResults();
                        log.debug({ title: 'queryResults', details: records });
                        log.debug({ title: 'queryResults', details: records.length });
                        var reportPDF = file.load({ id: records[0].id });
                        context.response.writeFile(reportPDF, true);
                    }


                } else {
                    let field = form.addField({
                        id: 'custpage_datestart',
                        name: 'custpage_datestart',
                        type: 'DATE',
                        label: 'Start Date',
                        source: 'T'
                    });
                    field = form.addField({
                        id: 'custpage_datelimit',
                        name: 'custpage_datelimit',
                        type: 'DATE',
                        label: 'End Date',
                        source: 'T'
                    });
                    form.addSubmitButton({
                        label: "Create Report"
                    });
                    context.response.writePage(form);
                }
            } else if (context.request.method == "POST") {
                let payload = {}
                log.debug({ title: '', details: context.request.parameters });
                if (context.request.parameters["custpage_datelimit"]) {
                    dateLimit = context.request.parameters["custpage_datelimit"]
                    dateStart = context.request.parameters["custpage_datestart"]
                    var executed = true
                    var deployIndex = 1
                    var mrTaskId
                    while (executed) {
                        mrTaskId = createTask(deployIndex, dateStart, dateLimit)
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
                    log.debug('mrTaskId', mrTaskId);
                    payload.taskId = mrTaskId
                    redirect.redirect({
                        url: "https://6825580.app.netsuite.com/app/site/hosting/scriptlet.nl?script=506&deploy=1",
                        parameters: {
                            'custparam_import': JSON.stringify(payload)
                        }
                    });

                }

            }
        } catch (ex) {
            log.debug({ title: 'ERROR', details: ex });
        }
    }

    function createTask(deploy, dateStart, dateLimit) {
        try {
            let stringDeploy = 'customdeploy_stock_ledger_get_items_dp_'+deploy
            var schTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: "customscript_stock_ledger_get_items_his",
                deploymentId: stringDeploy,
                params: {
                    'custscript1': dateLimit,
                    "custscript2": dateStart
                }
            });

            var schTaskId = schTask.submit();
            if (schTaskId) {
                log.debug({ title: 'schTaskId', details: schTaskId });
                return schTaskId
            }
        } catch (error) {
            log.debug({ title: 'MR: error', details: error });
            return undefined
        }

    }



    return {
        onRequest: onRequest
    }
});
