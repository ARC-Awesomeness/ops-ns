/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/search', 'N/log', 'N/https', 'N/runtime', 'N/file', 'N/render', 'N/query'], function (search, log, https, runtime, file, render, query) {

    function getInputData() {
        try {
            var itemSearchObj = search.create({
                type: "item",
                filters:
                    [
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "location",
                            summary: "GROUP",
                            sort: search.Sort.ASC,
                            label: "Location"
                        }),
                        search.createColumn({
                            name: "department",
                            summary: "GROUP",
                            sort: search.Sort.ASC,
                            label: "Department"
                        }),
                        search.createColumn({
                            name: "itemid",
                            summary: "GROUP",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "internalid",
                            summary: "GROUP",
                            label: "Internal ID"
                        })
                    ]
            });
            var moreResults = true;
            var start = 0; var end = 1000; var index = 0;
            var itemsResults = [];
            var count = itemSearchObj.runPaged({ pageSize: 2 }).count;
            log.debug({ title: 'Saved Search COUNT Items', details: count });
            while (moreResults) {
                var results = itemSearchObj.run().getRange({
                    start: start,
                    end: end
                });
                if (itemsResults.length >= count) {
                    moreResults = false;
                    break;
                } else {
                    start = end;
                    end += 1000;
                }
                itemsResults = itemsResults.concat(results);
            }
            return itemsResults
        } catch (ex) {
            log.debug({ title: 'Error', details: ex });
        }
    }

    function map(context) {
        try {

            var item = JSON.parse(context.value);
            // var date = new Date(runtime.getCurrentScript().getParameter("custscript1"));
            // var dateFormated = (((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '/' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + '/' + date.getFullYear());
            dateFormated = runtime.getCurrentScript().getParameter("custscript1")

            //dateFormated = runtime.getCurrentScript().getParameter("custscript1")

            var transactionSearchObj = search.create({
                type: "transaction",
                filters:
                    [
                        ["item", "anyof", item.values["GROUP(internalid)"][0].value],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["type", "anyof", "CustInvc", "CashRfnd", "ItemRcpt", "TrnfrOrd", "Transfer", "WorkOrd", "InvWksht", "InvTrnfr", "InvAdjst", "CustCred"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["shipping", "is", "F"],
                        "AND",
                        ["cogs", "is", "F"],
                        "AND",
                        ["trandate", "onorbefore", dateFormated],
                        "AND",
                        ["item.type", "anyof", "InvtPart"]

                    ],
                columns:
                    [
                        search.createColumn({
                            name: "datecreated",
                            sort: search.Sort.ASC,
                            label: "Date Created"
                        }),
                        search.createColumn({ name: "item", label: "Item" }),
                        search.createColumn({ name: "recordtype", label: "Record Type" }),
                        search.createColumn({ name: "quantity", label: "Quantity" }),
                        search.createColumn({ name: "location", label: "Location" }),
                        search.createColumn({ name: "department", label: "Department" }),
                        search.createColumn({
                            name: "preferredlocation",
                            join: "item",
                            label: "Preferred Location"
                        }),
                        search.createColumn({
                            name: "weight",
                            join: "item",
                            label: "Weight"
                        }),
                        search.createColumn({
                            name: "averagecost",
                            join: "item",
                            label: "Average Cost"
                        }),
                        search.createColumn({ name: "amount", label: "Amount" }),
                        search.createColumn({ name: "cogsamount", label: "COGS Amount" })
                    ]
            });
            var endingQty = 0.0
            var weight = 0.0
            var avgCost = 0.0
            var amount = 0.0
            var cogsAmount = 0.0
            var location, preferredlocation, depLoc
            var locationsIds = []
            var locationsCount = []
            var locationName
            var locationDeparment

            var moreResults = true;
            var start = 0; var end = 1000; var index = 0;
            var itemsResults = [];
            var count = transactionSearchObj.runPaged({ pageSize: 2 }).count;

            log.debug({ title: 'Saved Search COUNT transactionSearchObj', details: count });

            while (moreResults) {
                var results = transactionSearchObj.run().getRange({
                    start: start,
                    end: end
                });
                if (itemsResults.length >= count) {
                    moreResults = false;
                    break;
                } else {
                    start = end;
                    end += 1000;
                }
                itemsResults = itemsResults.concat(results);
            }

            for (var i = 0; i < itemsResults.length; i++) {
                result = itemsResults[i];

                if (result.getValue({ name: 'preferredlocation', join: 'item' })) {
                    preferredlocation = result.getValue({ name: 'preferredlocation', join: 'item' })
                }
                location = result.getValue("location")
                locationName = result.getText("location")
                if (locationsIds.indexOf(location) != -1) {
                    locationsCount[locationsIds.indexOf(location)] += 1
                } else {
                    locationsIds.push(location)
                    locationsCount.push(1)
                }
                if (result.getValue({ name: 'weight', join: 'item' })) {
                    weight = result.getValue({ name: 'weight', join: 'item' })
                }
                if (result.getValue({ name: 'averagecost', join: 'item' })) {
                    avgCost = Number(parseFloat(result.getValue({ name: 'averagecost', join: 'item' })).toFixed(10))
                }


                if (result.getValue("cogsamount")) {
                    cogsAmount += Number(parseFloat(result.getValue("cogsamount")).toFixed(2))
                }
                depLoc = result.getValue("department")
                locationDeparment = result.getText("department")
                if (result.getValue("recordtype") == "invoice" || result.getValue("recordtype") == "creditmemo" || result.getValue("recordtype") == "cashrefund") {
                    endingQty -= parseFloat(result.getValue("quantity"))
                } else {
                    endingQty += parseFloat(result.getValue("quantity"))
                    if (result.getValue("amount")) {
                        amount += Number(parseFloat(result.getValue("amount")).toFixed(2))
                    }
                }
            }



            if (parseFloat(endingQty) != 0) {

                if (!preferredlocation) {

                    let sqlString = `Select inventoryitemlocations.location, inventoryitemlocations .quantityonhand from inventoryitemlocations JOIN item on inventoryitemlocations.item = item.id WHERE item.id = ${item.values["GROUP(internalid)"][0].value} AND inventoryitemlocations.quantityonhand != 0`
                    var queryResults = query.runSuiteQL({
                        query: sqlString
                    });

                    var records = queryResults.asMappedResults();

                    if (records.length > 0) {
                        preferredlocation = records[0].location

                    }
                }

                locMax = 0
                for (var x = 0; x < locationsCount.length; x++) {
                    if (locationsCount[x] > locMax) {
                        locMax = locationsCount[x]
                    }
                }

                location = locationsIds[locationsCount.indexOf(locMax)]

                if (preferredlocation) {
                    location = preferredlocation
                    let sqlString = `Select name from location Where id = ${location}`

                    var queryResults = query.runSuiteQL({
                        query: sqlString
                    });
                    var records = queryResults.asMappedResults();
                    locationName = records[0].name
                }
                keyformat = location + "_" + depLoc
                amount = amount - cogsAmount
                if (item.values["GROUP(internalid)"][0].value == "5517") {
                    log.debug({ title: 'preferredlocation', details: preferredlocation });
                    log.debug({ title: 'keyformat', details: keyformat });
                }
                context.write({
                    key: keyformat,
                    value: JSON.stringify({
                        location: locationName,
                        department: locationDeparment,
                        item: item.values["GROUP(internalid)"][0].value,
                        name: item.values["GROUP(itemid)"],
                        avgCost: avgCost,
                        endingQty: endingQty.toFixed(2),
                        weight: weight,
                        tons: ((endingQty * weight) / 2000).toFixed(2),
                        amount: amount
                    })
                });
            }
        } catch (ex) {
            log.debug({ title: 'ERROR MAP', details: context.value });
            log.debug({ title: 'Error', details: ex });
        }

    }

    function reduce(context) {
        try {

            var totalQuantity = 0
            var totalTons = 0
            var totalAmount = 0;
            let objArray = [];
            for (var x = 0; x < context.values.length; x++) {
                value = JSON.parse(context.values[x])
                totalQuantity += parseFloat(value.endingQty)
                totalTons += parseFloat(value.tons)
                totalAmount += parseFloat(value.amount)
                objArray.push(value);
            }

            log.debug({ title: 'TOTALS ' + context.key, details: totalQuantity + " " + totalTons + " " + totalAmount });
            log.debug({ title: 'ITEMS ' + context.key, details: context.values });
            let objArraySorted = sortArray(objArray);
            context.write({
                key: 1,
                value: JSON.stringify({ totalQuantity: totalQuantity, totalTons: totalTons, totalAmount: totalAmount, count: context.values.length, values: context.values, items: objArraySorted })
            });
        } catch (ex) {
            log.debug({ title: 'Error', details: ex });
        }
    }

    function summarize(context) {

        try {
            var totalQuantity = 0
            var totalTons = 0
            var totalAmount = 0
            var totalCount = 0
            var results = []
            context.output.iterator().each(function (key, value) {
                if (key == 1) {
                    totalCount += parseFloat(JSON.parse(value).count);
                    totalAmount += parseFloat(JSON.parse(value).totalAmount);
                    totalTons += parseFloat(JSON.parse(value).totalTons);
                    totalQuantity += parseFloat(JSON.parse(value).totalQuantity);
                    values = (JSON.parse(value).values)
                    let items = (JSON.parse(value).items);
                    log.debug('items.length', items.length);
                    log.debug('values.length', values.length);
                    for (var x = 0; x < items.length; x++) {
                        //var obj = JSON.parse(values[x])
                        let obj = items[x];

                        if (obj.endingQty != 0) {
                            if (obj.endingQty < 0) {
                                results.push(
                                    {

                                        "location": obj.location,
                                        "department": obj.department,
                                        "name": obj.name,
                                        "avgCost": obj.avgCost,
                                        "endingQty": obj.endingQty * -1,
                                        "weight": obj.weight,
                                        "tons": obj.tons,
                                        "negative": "yes",
                                        "amount": obj.amount
                                    }
                                )
                            } else {
                                results.push(
                                    {

                                        "location": obj.location,
                                        "department": obj.department,
                                        "name": obj.name,
                                        "avgCost": obj.avgCost,
                                        "endingQty": obj.endingQty,
                                        "weight": obj.weight,
                                        "tons": obj.tons,
                                        "amount": obj.amount
                                    }
                                )
                            }
                        }
                    }
                }

                return true
            })
            results.sort(function (a, b) {
                var textA = a.department.toUpperCase();
                var textB = b.department.toUpperCase();

                return textA.localeCompare(textB);
            });
            log.debug({ title: 'SUMMARY', details: context });
            log.debug({ title: 'TOTALS ', details: totalQuantity.toFixed(2) + " " + totalTons.toFixed(2) + " " + totalAmount.toFixed(4) });
            log.debug({ title: 'totalCount', details: totalCount });
            log.debug({ title: 'results', details: results });
            var reportTemplate = file.load({
                id: 16625
            });
            var results = {
                dateLimit: runtime.getCurrentScript().getParameter("custscript1"),
                dateStart: runtime.getCurrentScript().getParameter("custscript2"),
                items: results
            };
            var json_results = JSON.stringify(results);
            var renderer = render.create();
            log.debug({ title: 'RESULTS', details: json_results });
            renderer.addCustomDataSource({
                format: render.DataSource.JSON,
                alias: "JSON",
                data: json_results
            });
            renderer.templateContent = reportTemplate.getContents();
            var filePDF = renderer.renderAsPdf();
            log.debug({ title: 'templateContent', details: renderer.templateContent });
            filePDF.name = "StockReport"
            log.debug({ title: 'object file pdf', details: filePDF })
            filePDF.folder = 1168;
            filePDF.isOnline = true
            var binPDFid = filePDF.save();

        } catch (ex) {

            log.debug({ title: 'ERROR SUMMARIZE', details: ex });
        }
    }

    function sortArray(array) {
        try {
            let arraySorted;
            arraySorted = array.sort(function (a, b) {
                if (a.name > b.name) {
                    return 1;
                } else if (b.name > a.name) {
                    return -1;
                } else {
                    return 0;
                }
            });
            return arraySorted;
        } catch (err) {
            log.debug('sortArray error', err);
            return array;
        }
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
