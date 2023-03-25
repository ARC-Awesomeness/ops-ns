/**
* @NApiVersion 2.x
* @NScriptType Suitelet
* Purpose:
* This view will be used to make sentence SQL Oracle
* Created by: Giovanni Arrazola
* Date created: 8/3/2021
* Updated on: 1/16/2021
* Added the code injected to use the TAB from the keyboard into textareas
* Added the message the error into the same textarea where appears the results
* Added a new way to show the results into the sublist of way dinamically
*/


define(['N/log', 'N/query', 'N/ui/serverWidget'],
    function (log, query, serverWidget) {
        function onRequest(context) {
            method = context.request.method;
            //============
            // CREATE FORM
            //============
            var form = serverWidget.createForm(
                {
                    title: 'SuiteQL Query Tool',
                    hideNavBar: false
                }
            );

            //==================
            // ADD SUBMIT BUTTON
            //==================
            form.addSubmitButton({ label: 'Run Query' });
            
            //================
            // ADD QUERY FIELD
            //================
            var queryField = form.addField(
                {
                    id: 'custpage_field_query',
                    type: serverWidget.FieldType.LONGTEXT,
                    label: 'Query'
                }
            );

            //===============================
            // MAKE THE QUERY FIELD REQUIRED.
            //===============================
            queryField.isMandatory = true;

            //===============================
            // IF THE FORM HAS BEEN SUBMITTED
            //===============================
            if (method == 'POST') {

                //============================================================================================
                // QUERY SEND BY THE FORM. THIS VALUE IS RECEIVED BY THE FIELD CUSTPAGE_FIELD_QUERY (FIELD ID)
                //============================================================================================
                queryField.defaultValue = context.request.parameters.custpage_field_query;

                //============================================================
                //THIS FIELD WILL BE USED TO SHOW THE RESULTS FROM QUERY (SQL)
                //============================================================
                var resultsField = form.addField(
                    {
                        id: 'custpage_field_results',
                        type: serverWidget.FieldType.LONGTEXT,
                        label: 'Results'
                    }
                );

                try {

                    //========================
                    //RUN OR EXECUTE THE QUERY
                    //========================
                    var queryResults = query.runSuiteQL(
                        {
                            query: context.request.parameters.custpage_field_query
                        }
                    );

                    //=======================
                    // GET THE MAPPED RESULTS
                    //=======================
                    var beginTime = new Date().getTime();
                    var records = queryResults.asMappedResults();
                    var endTime = new Date().getTime();
                    var elapsedTime = endTime - beginTime;

                    //===========================================================
                    // ADJUST THE LABEL SO THAT IT INCLUDES THE NUMBER OF RESULTS
                    //===========================================================
                    resultsField.label = queryResults.results.length + ' Results (JSON)';

                    //===================================================
                    // VALIDATION TO REVIEW IF RECORDS IS GREATHER THAN 0
                    //===================================================
                    if (records.length > 0) {

                        //=======================================
                        // CREATE THE SUBLIST TO SHOW THE RESULTS
                        //=======================================
                        var resultsSublist = form.addSublist(
                            {
                                id: 'results_sublist',
                                label: 'Results (' + records.length + ' records retrieved in ' + elapsedTime + 'ms)',
                                type: serverWidget.SublistType.LIST
                            }
                        );

                        //============
                        // GET COLUMNS
                        //============
                        var columnNames = Object.keys(records[0]);

                        for (i = 0; i < columnNames.length; i++) {

                            //===========================
                            // ADD FIELD INTO THE SUBLIST
                            //===========================
                            resultsSublist.addField(
                                {
                                    id: 'custpage_results_sublist_col_' + i,
                                    type: serverWidget.FieldType.TEXT,
                                    label: columnNames[i]
                                }
                            );

                        }

                        //=================================
                        // ADD THE RESULTS INTO THE SUBLIST
                        //=================================
                        for (r = 0; r < records.length; r++) {

                            var record = records[r];

                            for (c = 0; c < columnNames.length; c++) {

                                //================
                                // GET COLUMN NAME
                                //================
                                var column = columnNames[c];

                                //========================================
                                // GET THE VALUE FROM THE RESULTS (RECORD)
                                //========================================
                                var value = record[column];
                                if (value != null) {
                                    value = value.toString();
                                }

                                //===============================
                                // ADD THE VALUE INTO THE SUBLIST
                                //===============================	
                                resultsSublist.setSublistValue(
                                    {
                                        id: 'custpage_results_sublist_col_' + c,
                                        line: r,
                                        value: value
                                    }
                                );

                            }

                        }

                    }

                    // SET THE RESULTS FIELD TO A TEXT VERSION OF THE MAPPED RESULTS.
                    // THIS WILL FAIL IF THE TEXT IS > 100000 CHARACTERS.
                    // HOWEVER, THE RESULTS SUBLIST WILL STILL RENDER PROPERLY.
                    resultsField.defaultValue = JSON.stringify(records, null, 2);

                } catch (e) {

                    //==============================================
                    // UPDATE THE RESULTS FIELD TO REFLECT THE ERROR
                    //==============================================
                    resultsField.label = 'Error';
                    resultsField.defaultValue = e.message;

                }

            }

            //=======================================
            //THE FIELD WILL USE TO INSERT JAVASCRIPT
            //=======================================
            var jsField = form.addField(
                {
                    id: 'custpage_field_js',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'Javascript'
                }
            );

            //======================
            //ADDING JAVASCRIPT CODE
            //======================
            jsField.defaultValue = '<script>\r\n';

            //==================================
            // ADJUST THE SIZE OF THE TEXTAREAS.
            //===================================
            jsField.defaultValue += 'document.getElementById("custpage_field_query").rows=20;\r\n';
            if (method == 'POST') {
                jsField.defaultValue += 'document.getElementById("custpage_field_results").rows=20;\r\n';
            }

            //==================================================================================
            //USE JQUERY TO MODIFY THE TAB KEY'S BEHAVIOR WHEN IN THE QUERY TEXTAREA.
            //THIS ALLOWS THE USER TO USE THE TAB KEY WHEN EDITING A QUERY.
            // Source: https://stackoverflow.com/questions/6140632/how-to-handle-tab-in-textarea
            //==================================================================================		
            jsField.defaultValue += 'window.jQuery = window.$ = jQuery;\r\n';
            jsField.defaultValue += '$(\'textarea\').keydown(function(e) {\r\n';
            jsField.defaultValue += 'if(e.keyCode === 9) {\r\n';
            jsField.defaultValue += 'var start = this.selectionStart;\r\n';
            jsField.defaultValue += 'var end = this.selectionEnd;\r\n';
            jsField.defaultValue += 'var $this = $(this);\r\n';
            jsField.defaultValue += 'var value = $this.val();\r\n';
            jsField.defaultValue += '$this.val(value.substring(0, start)';
            jsField.defaultValue += '+ "	"';
            jsField.defaultValue += '+ value.substring(end));\r\n';
            jsField.defaultValue += 'this.selectionStart = this.selectionEnd = start + 1;\r\n';
            jsField.defaultValue += 'e.preventDefault();\r\n';
            jsField.defaultValue += '}\r\n';
            jsField.defaultValue += '});\r\n';

            jsField.defaultValue += '</script>';

            //=================
            //SHOW THE WEB PAGE
            //=================
            context.response.writePage(form);

        }
        return {
            onRequest: onRequest
        }
    })