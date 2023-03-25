/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
 define(['N/ui/serverWidget', 'N/search', 'N/url', 'N/record'],

 function(serverWidget, search, url, record) {
 
     /**
      * Definition of the Suitelet script trigger point.
      *
      * @param {Object} context
      * @param {ServerRequest} context.request - Encapsulation of the incoming request
      * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
      * @Since 2021.2
      */
     function onRequest(context) {
         var form = serverWidget.createForm({
             title : 'Delete Transactions'
         });
         if(context.request.method == 'GET'){
             var mySearch = search.load({
                 type: search.Type.TRANSACTION,
                 id: 'customsearch_ops_mass_delete'
             });
             var mySearchRS = mySearch.run();
             var results = mySearchRS.getRange({
                 start: 0,
                 end: 1000
             });
             var sublist = form.addSublist({
                 id : 'custpage_transaction_list',
                 type : serverWidget.SublistType.LIST,
                 label : 'Inline Editor Sublist'
             });
 
             var transactionArray = new Array();
             if (results != null) {
                 sublist.addField({
                     id: 'delete',
                     type: serverWidget.FieldType.CHECKBOX,
                     label: 'Delete'
                 });
 
                 // Add hidden columns for the Internal ID and for the Record type.
                 // These fields are necessary for the nlapiDeleteRecord function.
                 sublist.addField({
                     id: 'internalid',
                     type: serverWidget.FieldType.TEXT,
                     label: 'InternalID'
                 }).updateDisplayType({
                         displayType : serverWidget.FieldDisplayType.HIDDEN
                     });
                 sublist.addField({
                     id: 'recordtype',
                     type: serverWidget.FieldType.TEXT,
                     label: 'Record Type'
                 }).updateDisplayType({
                         displayType : serverWidget.FieldDisplayType.HIDDEN
                     });
                 // Add a column for the Internal ID link
                 sublist.addField({
                     id: 'internalidlink',
                     type: serverWidget.FieldType.TEXT,
                     label: 'Internal ID'
                 });
                 // Get the the search result columns
                 var columns = results[0].columns;
 
                 // Add the search columns to the sublist
                 for (var i = 0; i < columns.length; i++) {
                     sublist.addField({
                         id: columns[i].name,
                         type: serverWidget.FieldType.TEXT,
                         label: columns[i].label
                     });
                 }
 
                 for (var i = 0; i < results.length; i++) {
                     var transaction = new Object();
                     // Set the Delete column to False
                     sublist.setSublistValue({
                         id: 'delete',
                         line: i,
                         value: 'F'
                     });
                     // Set the hidden internal ID field
                     sublist.setSublistValue({
                         id: 'internalid',
                         line: i,
                         value: results[i].id
                     });
                     // Set the hidden record type field
                     sublist.setSublistValue({
                         id: 'recordtype',
                         line: i,
                         value: results[i].recordType
                     });
                     // Create a link so users can navigate from the list of transactions to a specific transaction
                     var recUrl = url.resolveRecord({
                         recordType: results[i].recordType,
                         recordId: results[i].id,
                         isEditMode: false
                     });
                     internalIdLink = " " + results[i].id + " ";
                     // Set the link
                     sublist.setSublistValue({
                         id: 'internalidlink',
                         line: i,
                         value: internalIdLink
                     });
                     // set the row values to the transaction object
                     try{
                     for (var j = 0; j < columns.length; j++) {
                         sublist.setSublistValue({
                             id: columns[j].name,
                             line: i,
                             value: results[i].getValue(columns[j].name)
                         });
                     }}catch(ex){
                         log.audit('error', ex);
                     }
                 }
 
             }
             sublist.addMarkAllButtons();
             form.addSubmitButton({
                 label: 'Submit'
             });
             context.response.writePage({
                 pageObject: form
             });
         }else{
             // Check how many lines in the sublist
             /*
             var count = context.request.getLineCount({
                 group: 'custpage_transaction_list'
             });*/
             var count = 1000;
             log.debug('count',count);
             // This variable will keep track of how many records are deleted.
             var num = 0;//for each line in the sublist
             log.debug('num',num);
             for (var i = 0; i < count; i++) {
                 //get the value of the Delete checkbox
                 var deleteTransaction = context.request.getSublistValue({
                     group: 'custpage_transaction_list',
                     name: 'delete',
                     line: i
                 });
                 log.debug('deleteTransaction',deleteTransaction);
                 // If it's checked, delete the transaction
                 if (deleteTransaction == 'T') {
                     // Get the transaction internal ID
                     var internalId = context.request.getSublistValue({
                         group: 'custpage_transaction_list',
                         name: 'internalid',
                         line: i
                     });
                     log.debug('internalId',internalId);
                     // Get the transaction type
                     var recordType = context.request.getSublistValue({
                         group: 'custpage_transaction_list',
                         name: 'recordtype',
                         line: i
                     });
                     log.debug('recordType',recordType);
                     try {
                         // Delete the transaction
                         var inventoryAdjustment = record.delete({
                            type: recordType,
                            id: internalId,
                         });
                         log.debug('inventoryAdjustment',inventoryAdjustment);
                         num++;
                     }
                     // Errors will be logged in the Execution Log
                     catch (ex) {
                         log.audit('Error', 'Transaction ID ' + internalId + ': ' + ex);
                     }
                 }
             }
             // Show how many records were deleted.
             form.addField({
                 id : 'custpage_transaction_total',
                 type : serverWidget.FieldType.TEXT,
                 label : 'transactions deleted'
             }).updateDisplayType({
                         displayType : serverWidget.FieldDisplayType.INLINE
                     }).defaultValue = num + " ";
             context.response.writePage(form);
         }
     }
 
     return {
         onRequest: onRequest
     };
 
 });
