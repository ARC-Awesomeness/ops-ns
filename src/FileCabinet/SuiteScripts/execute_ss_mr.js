/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/search', 'N/https', 'N/record', 'N/query', 'N/runtime', 'N/https'], function (search, https, record, query, runtime, https) {

    function getInputData() {
        try {

            let script = record.load({ type: "script", id: 504, isDynamic: true })
            paramtersCount = script.getLineCount({ sublistId: "parameters" });
            let ssParams = []
            for (var x = 0; x < paramtersCount; x++) {
                script.selectLine({ sublistId: 'parameters', line: x });
                paramid = script.getCurrentSublistValue({
                    sublistId: 'parameters',
                    fieldId: 'internalid',
                });
                if (runtime.getCurrentScript().getParameter(paramid)) {
                    
                        ssParams.push(runtime.getCurrentScript().getParameter(paramid))
                    

                } else {
                    log.debug({ title: 'NO VALUE IN PARAM', details: paramid });
                }
            }
            //return [594,565,533,523]
           return ssParams
        } catch (ex) {
            log.debug({ title: 'ERROR GETDATA', details: ex });
        }
    }

    function map(context) {
        try {
            var ssId = JSON.parse(context.value);
            var nsopSavedSearch = search.load({
                id: ssId

            });
            nsopSavedSearch.columns.push(search.createColumn({ name: "weight", label: "Weight" }));
            nsopSavedSearch.columns.push(search.createColumn({ name: "cost", label: "Purchase Price" }));
            nsopSavedSearch.columns.push(search.createColumn({ name: "custitem_alternate_item", label: "Alternate Item" }));
            nsopSavedSearch.columns.push(search.createColumn({ name: "custitem_alt_item_multiplier_qty", label: "Alt. Item Multiplier Qty" }));
            nsopSavedSearch.columns.push(search.createColumn({ name: "custitem_item_special_instruction", label: "Item Special Instruction" }));
            nsopSavedSearch.columns.push(search.createColumn({ name: "liabilityaccount", label: "Liability Account" }));
            var moreResults = true;
            var start = 0; var end = 1000; var index = 0;
            var savedSearchNoFiltersResults = [];
            var count = nsopSavedSearch.runPaged({ pageSize: 2 }).count;
            log.debug({ title: 'Saved Search COUNT with duplicates NO PRICES' + ssId, details: count });
            while (moreResults) {
                var results = nsopSavedSearch.run().getRange({
                    start: start,
                    end: end
                });
                if (savedSearchNoFiltersResults.length >= count) {
                    moreResults = false;
                    break;
                } else {
                    start = end;
                    end += 1000;
                }
                savedSearchNoFiltersResults = savedSearchNoFiltersResults.concat(results);
            }

           
            nsopSavedSearch.columns.push(search.createColumn({ name: "pricelevel", join: "pricing", label: "Price Level" }));
            nsopSavedSearch.columns.push(search.createColumn({ name: "unitprice", join: "pricing", label: "Unit Price" }));
            
            var moreResults = true;
            var start = 0; var end = 1000; var index = 0;
            var savedSearchResults = [];
            var count = nsopSavedSearch.runPaged({ pageSize: 2 }).count;
            log.debug({ title: 'Saved Search COUNT with duplicates WITH PRICES' + ssId, details: count });
            while (moreResults) {
                var results = nsopSavedSearch.run().getRange({
                    start: start,
                    end: end
                });
                if (savedSearchResults.length >= count) {
                    moreResults = false;
                    break;
                } else {
                    start = end;
                    end += 1000;
                }
                savedSearchResults = savedSearchResults.concat(results);
            }

            allResults = savedSearchNoFiltersResults.concat(savedSearchResults);

            context.write({ key: ssId, value: JSON.stringify(allResults) });
            return
        } catch (ex) {
            log.debug({ title: 'ERROR MAP', details: ex });
        }
    }

    function reduce(context) {
        try {
            let values = JSON.parse(context.values)
            parsedResults = []
            itemsResults = []
            ids = []

            values.forEach(element => {
                if (ids.indexOf(element.values.internalid[0].value) == -1) {
                    ids.push(element.values.internalid[0].value)
                    itemsResults.push({ id: element.values.internalid[0].value, iteminfo: [element] })
                } else {
                    itemsResults[ids.indexOf(element.values.internalid[0].value)].iteminfo.push(element)
                }
            });

            var count = 0
            itemsResults.forEach(element => {
                var itemObj = {}
                count += element.iteminfo.length

                priceLevel = 1
                element.iteminfo.forEach(item => {

                    for (const key in item) {


                        if (key == "values") {
                            if (!itemObj[key]) {
                                itemObj[key] = {}
                            }
                            for (const keyInValue in item[key]) {
                                var keyValue = keyInValue
                                if (keyValue == "pricing.pricelevel" || keyValue == "pricing.unitprice") {

                                    keyValue = keyValue + "_" + priceLevel

                                }
                                itemObj[key][keyValue] = item[key][keyInValue]

                            }
                            priceLevel++
                        } else {
                            itemObj[key] = item[key]
                        }
                    }
                })

                parsedResults.push(parseValue(context.key, itemObj))
            })



            let bodyToAPI = { saveSearchId: context.key, data: parsedResults }
            log.debug({ title: context.key, details: parsedResults.length});
            if (parsedResults.length > 0) {

                https.post({
                    url: "https://prd-c01-opssalesapi.azurewebsites.net/insertitem",
                    body: JSON.stringify(bodyToAPI),
                    headers: {
                        "content-type": "application/json"
                    }
                })
                context.write({
                    key: 1,
                    value: JSON.stringify({ ssid: context.key, count: parsedResults.length })
                });

            }
            else {
                return
            }
        } catch (ex) {
            log.debug({ title: context.key, details: context.values });
            log.debug({ title: 'ERROR REDUCE', details: ex });
        }
    }
    function parseValue(ssId, ssResult) {

        if (ssResult.values.custitem_work_order_display_options) {
            workOrder = ssResult.values.custitem_work_order_display_options[0] ? ssResult.values.custitem_work_order_display_options[0].value : ''
        }
        if (ssResult.values.custitem_alternate_item) {
            altItemNumber = ssResult.values.custitem_alternate_item[0] ? allReplace(allReplace(ssResult.values.custitem_alternate_item[0].value, "'", ''), '"', '') : ''
        }
        if (ssResult.values.custitem_item_special_instruction) {
            specialInstruction = ssResult.values.custitem_item_special_instruction[0] ? allReplace(allReplace(ssResult.values.custitem_item_special_instruction[0].value, "'", ''), '"', '') : ''
        }
        let prices = []
        let obj = {
            "savedSearchID": ssId,
            "internalid": ssResult.values.internalid[0].value,
            "itemName": allReplace(ssResult.values.itemid, '"', '""'),
            "displayName": allReplace(ssResult.values.displayname, '"', '""'),
            "description": allReplace(ssResult.values.salesdescription, '"', '""'),
            "itemType": allReplace(ssResult.values.type[0].value, '"', '""'),
            "price": ssResult.values.baseprice,
            "onHand": ssResult.values.locationquantityonhand?ssResult.values.locationquantityonhand:0,
            "workOrderDisplayOption": workOrder,
            "itemNumber": ssResult.values.internalid[0].value,
            "shipWeight": ssResult.values.weight ? ssResult.values.weight : 0.0,
            "unitCost": ssResult.values.cost ? ssResult.values.cost : 0.0,
            "qtyOnHand": ssResult.values.locationquantityonhand?ssResult.values.locationquantityonhand:0,
            "listType": allReplace(ssResult.values.type[0].value, '"', '""'),
            "altItemNumber": altItemNumber,
            "altItemMultiplier": ssResult.values.custitem_alt_item_multiplier_qty ? ssResult.values.custitem_alt_item_multiplier_qty : "0",
            "specialInstruction": specialInstruction
        }
        let existingPrices = []
        for (const key in ssResult.values) {
            if (key.indexOf("pricing.pricelevel_") != -1) {

                priceName = ssResult.values[key][0].text
                keyPrice = "pricing.unitprice_" + key.split("pricing.pricelevel_")[1]
                priceunitPrice = ssResult.values[keyPrice]
                if (["Each", "Ton", "Pound", "Piece", "Gross Ton", "Net Ton", "Foot"].indexOf(priceName) != -1) { //This are the not special prices

                    obj[priceName] = priceunitPrice
                } else {
                    if (existingPrices.indexOf(priceName) == -1) {
                        existingPrices.push(priceName)
                        prices.push({ priceName: priceName, price: priceunitPrice })
                    }
                }

            }
        }
        if (prices.length > 0) {
            obj["specialPrices"] = prices

        }
        
        return obj
    }
    function summarize(summary) {
        try {
            let savedSearchsId = []
            let total = 0
            summary.output.iterator().each(function (key, value) {
                let objParsed = JSON.parse(value)
                savedSearchsId.push(objParsed.ssid)
                total += objParsed.count
                return true
            })

            log.debug({ title: 'SAVED SEARCH COUNT  ', details: savedSearchsId.length });
            log.debug({ title: 'ITEMS COUNT WITH NO DUPLICATES', details: total });
            log.debug({ title: 'SUMMARY', details: summary });
        } catch (ex) {
            log.debug({ title: 'ERROR SUMMARIZE', details: ex });
        }
    }
    function allReplace(nValue, validate, replace) {
        if (!isEmpty(nValue)) {
            var regexp = new RegExp(validate, 'gi');
            var result = "";
            result = nValue.replace(regexp, replace);
            return result;
        } else {
            return nValue;
        }
    }
    function isEmpty(nValue) {
        return (
            nValue === "" ||
            nValue == null ||
            nValue == undefined ||
            nValue == "undefined" ||
            nValue == "null" ||
            (nValue.constructor === Array && nValue.length == 0) ||
            (nValue.constructor === Object &&
                (function (v) {
                    for (var k in v) return false;
                    return true;
                })(nValue))
        );
    }
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
