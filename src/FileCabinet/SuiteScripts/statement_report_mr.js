/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/search', 'N/log', 'N/https', 'N/runtime', 'N/file', 'N/render', 'N/record', 'N/xml'], function (search, log, https, runtime, file, render, record, xml) {

    function getInputData() {
        try {

            var month = runtime.getCurrentScript().getParameter('custscript_month');
            log.debug("month", month);
            var year = runtime.getCurrentScript().getParameter('custscript_year');
            log.debug("year", year);
            days = daysInMonth(month, year)
            dates = []
            locations = [
                { location: 1, departments: [1] },
                { location: 2, departments: [1, 9, 20, 14, 7, 3, 8, 11, 4, 10, 5, 2] },
                { location: 3, departments: [1, 9, 7, 5, 4, 2] },
                { location: 5, departments: [1, 9, 14, 18, 7, 8, 13, 12] },
                { location: 6, departments: [6] }
            ]
            dates.push({ startDate: month + "/1/" + year, endDate: month + "/" + days + "/" + year })
            dates.push({ startDate: "1/1/" + year, endDate: month + "/" + days + "/" + year })
            var periodsToSearch = []
            locations.forEach((element) => {
                element.departments.forEach((department) => {
                    periodsToSearch.push({
                        location: element.location,
                        department: department,
                        dates: dates[0],
                        col: 0
                    }),
                        periodsToSearch.push({
                            location: element.location,
                            department: department,
                            dates: dates[1],
                            col: 1
                        })
                })
            })


            return periodsToSearch

        } catch (ex) {
            log.debug({ title: 'Error', details: ex });
        }
    }

    function map(context) {
        try {
            var item = JSON.parse(context.value);
            keyformat = item.location + "_" + item.department
            log.debug({ title: item.dates.startDate, details: item.dates.endDate });
            var transactionSearchObj = search.create({
                type: "transaction",
                filters:
                    [
                        ["accounttype", "anyof", "Income", "COGS", "Expense", "OthIncome", "OthExpense"],
                        "AND",
                        ["posting", "is", "T"],
                        "AND",
                        ["location", "anyof", item.location],
                        "AND",
                        ["department", "anyof", item.department],
                        "AND",
                        ["trandate", "within", item.dates.startDate, item.dates.endDate]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "ordertype",
                            summary: "MAX",
                            sort: search.Sort.ASC,
                            label: "Order Type"
                        }),
                        search.createColumn({
                            name: "trandate",
                            summary: "MAX",
                            label: "Date"
                        }),
                        search.createColumn({
                            name: "postingperiod",
                            summary: "MAX",
                            label: "Period"
                        }),
                        search.createColumn({
                            name: "type",
                            summary: "MAX",
                            label: "Type"
                        }),
                        search.createColumn({
                            name: "tranid",
                            summary: "MAX",
                            label: "Document Number"
                        }),
                        search.createColumn({
                            name: "account",
                            summary: "GROUP",
                            sort: search.Sort.ASC,
                            label: "Account"
                        }),
                        search.createColumn({
                            name: "amount",
                            summary: "SUM",
                            label: "Amount"
                        }),
                        search.createColumn({
                            name: "accounttype",
                            summary: "MAX",
                            label: "Account Type"
                        })
                    ]
            });
            var searchResultCount = transactionSearchObj.runPaged().count;
            log.debug("transactionSearchObj result count", searchResultCount);
            resultsSearch = []
            var results = transactionSearchObj.run().getRange({
                start: 0,
                end: 1000
            });
            resultsSearch = resultsSearch.concat(results);

            context.write({
                key: keyformat,
                value: JSON.stringify({
                    location: item.location,
                    department: item.department,
                    dates: item.dates,
                    col: item.col,
                    results: resultsSearch
                })
            });

        } catch (ex) {
            log.debug({ title: 'Error', details: ex });
        }

    }

    function reduce(context) {
        try {
            var resultsObj = [[], []]
            var accounts = [[], []]
            var accountsType = [[], []]
            for (var x = 0; x < context.values.length; x++) {
                results = JSON.parse(context.values[x])
                col = results.col
                results.results.forEach((element) => {
                    resultsObj[col].push({
                        account: element.values["GROUP(account)"][0].text,
                        amount: parseFloat(element.values["SUM(amount)"]),
                        accountType: element.values["MAX(accounttype)"]
                    })
                    accounts[col].push(element.values["GROUP(account)"][0].text)
                    accountsType[col].push(element.values["MAX(accounttype)"])
                })
            }
            accounts[0].forEach((account, index) => {
                if (accounts[1].indexOf(account) == -1) {
                    accounts[1].push(account)
                    accountsType[1].push(accountsType[0][index])
                    resultsObj[1].push({
                        account: account,
                        amount: 0.0,
                        accountType: accountsType[0][index]
                    })
                }
            })
            accounts[1].forEach((account, index) => {
                if (accounts[0].indexOf(account) == -1) {
                    accounts[0].push(account)
                    accountsType[0].push(accountsType[1][index])
                    resultsObj[0].push({
                        account: account,
                        amount: 0.0,
                        accountType: accountsType[1][index]
                    })
                }
            })
            var pdfFormat = {
                income: [],
                expense: [],
                cogs: []
            }
            var totalIncome = [0, 0]
            var totalCostSales = [0, 0]
            var totalExpense = [0, 0]
            for (var x = 0; x < accounts[0].length; x++) {
                var account = accounts[0][x]
                var arr1 = resultsObj[0].filter(function (el) { return el.account == account });
                var arr2 = resultsObj[1].filter(function (el) { return el.account == account });
                accountType = arr1[0].accountType
                if (accountType == "Income") {
                    pdfFormat.income.push({ accounts: account.replace("&", ""), col1: arr1[0].amount, col2: arr2[0].amount })
                    totalIncome[0] += parseFloat(arr1[0].amount)
                    totalIncome[1] += parseFloat(arr2[0].amount)
                }
                if (accountType == "Expense") {
                    pdfFormat.expense.push({ accounts: account.replace("&", ""), col1: arr1[0].amount, col2: arr2[0].amount })
                    totalExpense[0] += parseFloat(arr1[0].amount)
                    totalExpense[1] += parseFloat(arr2[0].amount)
                }
                if (accountType == "Cost of Goods Sold") {
                    pdfFormat.cogs.push({ accounts: account.replace("&", ""), col1: arr1[0].amount, col2: arr2[0].amount })
                    totalCostSales[0] += parseFloat(arr1[0].amount)
                    totalCostSales[1] += parseFloat(arr2[0].amount)
                }
            }

            pdfFormat.totalIncome = [{ label: "Total - Income", col1: totalIncome[0], col2: totalIncome[1] }]
            pdfFormat.totalCost = [{ label: "Total - Cost Of Sale", col1: totalCostSales[0], col2: totalCostSales[1] }]
            pdfFormat.grossProfit = [{ label: "Gross Profit", col1: totalIncome[0] - totalCostSales[0], col2: totalIncome[1] - totalCostSales[1] }]
            pdfFormat.totalExpense = [{ label: "Total - Expense", col1: totalExpense[0], col2: totalExpense[1] }]


            const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            pdfFormat.netOrdinary = [{ label: "Net Ordinary Income", col1: (totalIncome[0] - totalCostSales[0]) - totalExpense[0], col2: (totalIncome[1] - totalCostSales[1]) - totalExpense[1] }]
            pdfFormat.netIncome = [{ label: "Net Income", col1: (totalIncome[0] - totalCostSales[0]) - totalExpense[0], col2: (totalIncome[1] - totalCostSales[1]) - totalExpense[1] }]
            results = JSON.parse(context.values[0])
            pdfFormat.dates = results.dates
            pdfFormat.dateStart = monthNames[new Date(results.dates.startDate).getMonth()] + " " + runtime.getCurrentScript().getParameter('custscript_year');
            pdfFormat.endDate = monthNames[new Date(results.dates.endDate).getMonth()] + " " + runtime.getCurrentScript().getParameter('custscript_year');
            pdfFormat.location = results.location
            pdfFormat.department = results.department

            locationName = search.lookupFields({ type: "location", id: results.location, columns: ["name"] }).name;
            locationName = locationName.replace(":", "_")
            locationName = locationName.replace(" ", "_")
            departmentName = search.lookupFields({ type: "department", id: results.department, columns: ["name"] }).name;
            departmentName = departmentName.replace(":", "_")
            departmentName = departmentName.replace(" ", "_")
            pdfFormat.departmentName = departmentName.replace(/[_0-9]/g, '')
            pdfFormat.locationName = locationName.replace(/[_0-9]/g, '')
            log.debug({ title: 'departmentName', details: pdfFormat.departmentName });
            log.debug({ title: 'locationName', details: pdfFormat.locationName });
            //SB 14700
            //PROD 20739
            var reportTemplate = file.load({
                id: 20739
            });

            var json_results = JSON.stringify(pdfFormat);
            var renderer = render.create();

            renderer.addCustomDataSource({
                format: render.DataSource.JSON,
                alias: "JSON",
                data: json_results
            });
            renderer.templateContent = reportTemplate.getContents();
            var filePDF = renderer.renderAsPdf();
            //  log.debug({ title: 'templateContent', details: renderer.templateContent });
            filePDF.name = "IncomeStatement_" + results.dates.endDate + "_" + locationName + "_" + departmentName
            // log.debug({ title: 'object file pdf', details: filePDF })
            filePDF.folder = 1347;
            filePDF.isOnline = true
            var repPDFid = filePDF.save();
            log.debug({ title: 'repPDFid', details: repPDFid });
            log.debug({ title: 'netIncome', details: pdfFormat.netIncome });
            context.write({
                key: 1,
                value: JSON.stringify({ pdfId: repPDFid })
            });
            context.write({
                key: 2,
                value: JSON.stringify({ dates: results.dates })
            });
            context.write({
                key: 3,
                value: JSON.stringify({ netIncome: pdfFormat.netIncome })
            });


        } catch (ex) {
            log.debug({ title: 'ERROR context.key', details: context.key });
            log.debug({ title: 'Error', details: ex });
        }
    }
    function createBalanceReport(dates, netIncome) {
        log.debug({ title: 'dates', details: dates });
        var transactionSearchObj = search.create({
            type: "transaction",
            filters:
                [
                    [["accountingperiod.enddate", "onorbefore", dates.dates.endDate], "AND", ["account.internalidnumber", "isnotempty", ""], "AND", ["posting", "is", "T"], "AND", ["account", "noneof", "52"], "AND", ["accounttype", "anyof", "Bank", "AcctRec", "OthCurrAsset", "FixedAsset", "OthAsset", "AcctPay", "OthCurrLiab", "Equity"]],
                    "AND",
                    ["sum(amount)", "notequalto", "0.00"]
                ],
            columns:
                [
                    search.createColumn({
                        name: "accounttype",
                        summary: "GROUP",
                        sort: search.Sort.ASC,
                        label: "Account Type"
                    }),
                    search.createColumn({
                        name: "account",
                        summary: "GROUP",
                        sort: search.Sort.ASC,
                        label: "Account"
                    }),
                    search.createColumn({
                        name: "amount",
                        summary: "SUM",
                        label: "Amount"
                    }),
                    search.createColumn({
                        name: "creditamount",
                        summary: "SUM",
                        label: "Amount (Credit)"
                    }),
                    search.createColumn({
                        name: "debitamount",
                        summary: "SUM",
                        label: "Amount (Debit)"
                    })
                ]
        });
        var results = {}
        transactionSearchObj.run().each(function (result) {

            let type = result.getText({
                name: "accounttype",
                summary: "GROUP",
            }).replace(/ /g, '')
            if (results[type]) {
                var totalkey = "total" + type
                result[totalkey] += result.getValue({
                    name: "amount",
                    summary: "SUM",
                })
                results[type].push({
                    account: result.getText({
                        name: "account",
                        summary: "GROUP",
                    }),
                    amount: result.getValue({
                        name: "amount",
                        summary: "SUM",
                    })
                })
            } else {
                var totalkey = "total" + type
                result[totalkey] = result.getValue({
                    name: "amount",
                    summary: "SUM",
                })
                results[type] = [{
                    account: result.getText({
                        name: "account",
                        summary: "GROUP",
                    }),
                    amount: result.getValue({
                        name: "amount",
                        summary: "SUM",
                    })
                }]
            }
            return true;
        });
        results.retainedEarnings = calculateRetainedEarnings(calculateNetIncome(), dates)
        results.netIncome = calculateYearNetIncome(dates)
        results.endDate=dates.dates.endDate
        results.startDate=dates.dates.startDate
        log.debug({ title: 'results', details: results });
        //Report PDF 
        //SB 16581
        //PROD
        var reportTemplate = file.load({
            id: 20740
        });

        var json_results = JSON.stringify(results);
        var renderer = render.create();
       
        renderer.addCustomDataSource({
            format: render.DataSource.JSON,
            alias: "JSON",
            data: json_results
        });
        renderer.templateContent = reportTemplate.getContents();
        var filePDF = renderer.renderAsPdf();
        //  log.debug({ title: 'templateContent', details: renderer.templateContent });
        filePDF.name = "BalanceSheet_" + dates.dates.endDate;
        // log.debug({ title: 'object file pdf', details: filePDF })
        //SB 1265
        //PROD 1347
        filePDF.folder = 1347;
        filePDF.isOnline = true
        var repPDFid = filePDF.save();
        log.debug({ title: 'BalanceReport', details: repPDFid });



    }

    function summarize(context) {
        try {
            var pdfs = []
            var dates;
            var netIncome = 0
            context.output.iterator().each(function (key, value) {
                if (key == 1) {
                    pdf = JSON.parse(value)
                    log.debug({ title: 'PDF', details: pdf });
                    pdfs.push(pdf.pdfId)
                }
                if (key == 2) {
                    datesRange = JSON.parse(value)
                    dates = datesRange
                }
                if (key == 3) {
                    log.debug({ title: ' JSON.parse(value)', details: JSON.parse(value).netIncome[0].col1 });
                    netIncome += JSON.parse(value).netIncome[0].col2
                }
                return true
            })
            log.debug({ title: "Dates", details: dates });
            log.debug({ title: "netIncome", details: netIncome.toFixed(2) });
            createBalanceReport(dates, netIncome.toFixed(2))
            var recIn = record.create({
                type: 'customrecord_income_statements_reports'
            })

            today = new Date(dates.dates.endDate)
            const yyyy = today.getFullYear();
            let mm = today.getMonth() + 1; // Months start at 0!
            let dd = today.getDate();

            if (dd < 10) dd = '0' + dd;
            if (mm < 10) mm = '0' + mm;

            const formattedToday = dd + '/' + mm + '/' + yyyy;



            var tpl = ['<?xml version="1.0"?>', '<pdfset>'];
            for (var x = 0; x < pdfs.length; x++) {
                var partFile = file.load({ id: pdfs[x] });
                log.debug({ title: 'partFile', details: partFile });
                var pdf_fileURL = xml.escape({ xmlText: partFile.url });
                tpl.push("<pdf src='" + pdf_fileURL + "'/>");
            }

            tpl.push("</pdfset>");

            log.debug({ title: 'bound template', details: xml.escape({ xmlText: tpl.join('\n') }) });
            var pdfFile = render.xmlToPdf({

                xmlString: tpl.join('\n')

            });
            var month = runtime.getCurrentScript().getParameter('custscript_month');
            log.debug("month", month);
            var year = runtime.getCurrentScript().getParameter('custscript_year');
            pdfFile.name = "All_Locations_Departments_" + month + "_" + year
            //PROD 1347
            //1265
            pdfFile.folder = 1347;

            var fileId = pdfFile.save();

            log.debug("Saved PDF to file " + fileId);
            pdfs.push(fileId)
            recIn.setValue("custrecord_income_statements_ids", pdfs.join(','))
            recIn.setValue("custrecord_income_statements_month", formattedToday)
            recId = recIn.save()
            log.debug({ title: 'recId', details: recId });
            log.debug({ title: 'pdfs', details: pdfs });
            log.debug({ title: 'pdfs', details: pdfs.length });

        } catch (ex) {

            log.debug({ title: 'ERROR SUMMARIZE', details: ex });
        }
    }
    function calculateYearNetIncome(dates) {
        year = parseInt(runtime.getCurrentScript().getParameter('custscript_year'));
        log.debug({ title: 'YEAR', details: year });
        var transactionSearchObj = search.create({
            type: "transaction",
            filters:
                [
                    ["accounttype","anyof","OthExpense","OthIncome","Income","COGS","Expense"], 
                    "AND", 
                    ["posting","is","T"], 
                    "AND", 
                    ["trandate", "within", dates.dates.startDate, dates.dates.endDate]
                ],
            columns:
                [
                    search.createColumn({
                        name: "amount",
                        summary: "SUM",
                        label: "Amount"
                    }),
                    search.createColumn({
                        name: "accounttype",
                        summary: "GROUP",
                        label: "Account Type"
                    })
                ]
        });
        netIncome = 0
        transactionSearchObj.run().each(function (result) {
            let type = result.getText({
                name: "accounttype",
                summary: "GROUP",
            }).replace(/ /g, '')
            log.debug({ title: 'TYPE', details: type });
            log.debug({
                title: 'Amount', details: result.getValue({
                    name: "amount",
                    summary: "SUM",
                })
            });
            if (type == "Income") {

                netIncome += parseFloat(result.getValue({
                    name: "amount",
                    summary: "SUM",
                }))

            } else {
                netIncome -= parseFloat(result.getValue({
                    name: "amount",
                    summary: "SUM",
                }))
            }
            log.debug({ title: 'netIncome', details: netIncome });
            return true;
        });
        return netIncome
    }
    function calculateNetIncome() {
        year = parseInt(runtime.getCurrentScript().getParameter('custscript_year')) - 1;
        log.debug({ title: 'YEAR', details: year });
        var transactionSearchObj = search.create({
            type: "transaction",
            filters:
                [
                    ["accounttype", "anyof", "Income", "COGS", "Expense"],
                    "AND",
                    ["trandate", "within", "1/1/2016", "12/31/" + year]
                ],
            columns:
                [
                    search.createColumn({
                        name: "amount",
                        summary: "SUM",
                        label: "Amount"
                    }),
                    search.createColumn({
                        name: "accounttype",
                        summary: "GROUP",
                        label: "Account Type"
                    })
                ]
        });
        netIncome = 0
        transactionSearchObj.run().each(function (result) {
            let type = result.getText({
                name: "accounttype",
                summary: "GROUP",
            }).replace(/ /g, '')
            log.debug({ title: 'TYPE', details: type });
            log.debug({
                title: 'Amount', details: result.getValue({
                    name: "amount",
                    summary: "SUM",
                })
            });
            if (type == "Income") {

                netIncome += parseFloat(result.getValue({
                    name: "amount",
                    summary: "SUM",
                }))

            } else {
                netIncome -= parseFloat(result.getValue({
                    name: "amount",
                    summary: "SUM",
                }))
            }
            log.debug({ title: 'netIncome', details: netIncome });
            return true;
        });
        return netIncome
    }
    function calculateRetainedEarnings(netIncome, dates) {
        let retainedEarnings = 0
        var transactionSearchObj = search.create({
            type: "transaction",
            filters:
                [
                    ["account", "anyof", "52"],
                    "AND",
                    ["trandate", "within", '1/1/2016', dates.dates.endDate]
                ],
            columns:
                [
                    search.createColumn({
                        name: "amount",
                        summary: "SUM",
                        label: "Amount"
                    })
                ]
        });
        transactionSearchObj.run().each(function (result) {

            retainedEarnings = result.getValue({
                name: "amount",
                summary: "SUM",
            })
        });
        log.debug({ title: '', details: retainedEarnings });
        return retainedEarnings - netIncome * -1
    }

    function daysInMonth(month, year) {
        return new Date(year, month, 0).getDate();
    }
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
