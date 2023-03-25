define(["N/ui/serverWidget", "N/record", "N/log", "N/error", "N/format", "N/search", "N/ui/message"], function (serverWidget, record, log, error, format, search, message) {
    /**
     * @export suitelet-journal-entry 
     * @requires N/log
     * @requires N/ui/serverWidget
     * @requires N/ui/dialog  
     * @requires N/search
     * @NApiVersion 2.1
     * @NModuleScope SameAccount
     * @NScriptType Suitelet
     * @governance 0 
     * @param context {Object}
     * @param context.request {ServerRequest}
     * @param context.response{ServerResponse}
     * @return {void}
     * @static
     * @function onRequest
     */

        
    var exports = {};
    var infomessage = '';
    var rec_arr = [];
    var record_count = 0;
    var error_count = 0;

        
    function onRequest(context) 
    {

        if (context.request.method === 'GET') 
        {

            build_form(infomessage);

        }
        else
        {

            //log.debug('parameters', context.request.parameters);

            var custType1 = context.request.parameters.custpage_importnumber;
            var custType2 = context.request.parameters.custType2;
            var custType3 = context.request.parameters.custType3;
            var custType4 = context.request.parameters.custType4;
            var custType5 = context.request.parameters.custType5;
            var custType6 = context.request.parameters.custType6;
            var custType7 = context.request.parameters.custType7;
            var custType8 = context.request.parameters.custType8;
            var custType9 = context.request.parameters.custType9;
            var custType10 = context.request.parameters.custType10;

            var _paycheckDate = context.request.parameters.custpage_paycheckdate;
            
            if (_paycheckDate !== '')
            {

                var paycheckSearch = search.create(
                {            
                    type: 'transaction',            
                    columns: ['account', 'amount', 'trandate', 'department', 'entity', 'tranid'],
                    filters: [['recordType', 'is', ''], 'and', ['account', 'is', '220'], 'and', ['amount', 'greaterthan', '0'], 'and', ['trandate', 'on', _paycheckDate]],
                    sort: ['tranid']
                });

                var _results = paycheckSearch.run();

                var _start = 0;
                var _end = 0;

                var _info = '';

                if (custType1 === '1to25')
                {
                    _start = 0;
                    _end = 25;
                    _info = '1 to 25';
                }
                else if (custType1 === '26to50')
                {
                    _start = 25;
                    _end = 50;
                    _info = '26 to 50';
                }
                else if (custType1 === '51to75')
                {
                    _start = 50;
                    _end = 75;
                    _info = '51 to 75';
                }
                else if (custType1 === '76to100')
                {
                    _start = 75;
                    _end = 100;
                    _info = '76 to 100';
                }
                else if (custType1 === '101to125')
                {
                    _start = 100;
                    _end = 125;
                    _info = '101 to 125';
                }
                else if (custType1 === '126to150')
                {
                    _start = 125;
                    _end = 150;
                    _info = '126 to 150';
                }
                else if (custType1 === '151to175')
                {
                    _start = 150;
                    _end = 175;
                    _info = '151 to 175';
                }
                else if (custType1 === '176to200')
                {
                    _start = 175;
                    _end = 200;
                    _info = '176 to 200';
                }
                else if (custType1 === '201to225')
                {
                    _start = 200;
                    _end = 225;
                    _info = '201 to 225';
                }
                else if (custType1 === '226to250')
                {
                    _start = 225;
                    _end = 250;
                    _info = '226 to 250';
                }


                


                var _resultRange = _results.getRange({
                    start: _start,
                    end: _end
                });



                for (var i = 0; i < _resultRange.length; i++)
                {
                    //log.debug('', _resultRange[i]);

                    var _tranid = _resultRange[i].getValue(
                    {
                        name: 'tranid'
                    });

                    var _amount = _resultRange[i].getValue(
                    {
                        name: 'amount'
                    });


                    var journal = record.create(
                    {
                        type : record.Type.JOURNAL_ENTRY,
                        isDynamic : true
                    
                    });
        
                    var _balance = 0;
                    var _debit = 0;
                    var _credit = 0;
        
                    journal.setValue('subsidiary', "1");
                
                    var _journalDate = _paycheckDate;
                    _journalDate = format.parse({value:_journalDate, type: format.Type.DATE});
        
                    journal.setValue('trandate', _journalDate);
                    journal.setValue('memo', 'Move Paychecks to Arvest');
    
                    journal.selectNewLine('line');
    
                    journal.setCurrentSublistValue('line', 'location', '2');
                    journal.setCurrentSublistValue('line', 'department', '1');
                    journal.setCurrentSublistValue('line', 'account', '220');
    
                    if (_amount < 0)
                    {
                        journal.setCurrentSublistValue('line', 'debit', _amount * -1);
                    }
                    else
                    {
                        journal.setCurrentSublistValue('line', 'credit', _amount * -1);
                    }
    
                    journal.setCurrentSublistValue('line', 'memo', _tranid);
    
                    journal.commitLine('line');
    
    
    
                    journal.selectNewLine('line');
        
                    journal.setCurrentSublistValue('line', 'location', '2');
                    journal.setCurrentSublistValue('line', 'department', '1');
                    journal.setCurrentSublistValue('line', 'account', '236');
    
                    if (_amount < 0)
                    {
                        journal.setCurrentSublistValue('line', 'credit', _amount * -1);
                    }
                    else
                    {
                        journal.setCurrentSublistValue('line', 'debit', _amount * -1);
                    }
    
                    journal.setCurrentSublistValue('line', 'memo', _tranid);
    
                    journal.commitLine('line');
    
                    var id = journal.save();
    
                    log.debug("JE", id);
                            

                }



                infomessage = _info + ': Import Complete : ' + _resultRange.length + ' Journal Entries Created.';

            }
            else {

                infomessage = 'no date chosen';

            }

            build_form(infomessage);
                    
        }


        
        function build_form(infomessage)
        {
            
            var form = serverWidget.createForm({
                title: 'G/L Paycheck Reclassify Import'
            });
            
            form.addResetButton({
                id : 'reset',
                label : 'Reset',
            });

            form.addSubmitButton({
                label : 'Create',
            });

            var fieldgroup = form.addFieldGroup({
                id : 'importgroup',
                label : 'Create Records:'
            });

            var custType1 = form.addField({
                id: 'custpage_importnumber',
                name: '1to25',
                type: serverWidget.FieldType.RADIO,
                label: '1-25',
                source: '1to25',
                container: 'importgroup'
             });
             var custType2 = form.addField({
                 id: 'custpage_importnumber',
                 name: '26to50',
                 type: serverWidget.FieldType.RADIO,
                 label: '26-50',
                 source: '26to50',
                 container: 'importgroup'
             });
             var custType3 = form.addField({
                 id: 'custpage_importnumber',
                 name: '51to75',
                 type: serverWidget.FieldType.RADIO,
                 label: '51-75',
                 source: '51to75',
                 container: 'importgroup'
             });   
             var custType4 = form.addField({
                id: 'custpage_importnumber',
                name: '76to100',
                type: serverWidget.FieldType.RADIO,
                label: '76-100',
                source: '76to100',
                container: 'importgroup'
            });   
            var custType5 = form.addField({
                id: 'custpage_importnumber',
                name: '101to125',
                type: serverWidget.FieldType.RADIO,
                label: '101-125',
                source: '101to125',
                container: 'importgroup'
            });   
            var custType6 = form.addField({
                id: 'custpage_importnumber',
                name: '126to150',
                type: serverWidget.FieldType.RADIO,
                label: '126-150',
                source: '126to150',
                container: 'importgroup'
            });   
            var custType7 = form.addField({
                id: 'custpage_importnumber',
                name: '151to175',
                type: serverWidget.FieldType.RADIO,
                label: '151-175',
                source: '151to175',
                container: 'importgroup'
            });   
            var custType8 = form.addField({
                id: 'custpage_importnumber',
                name: '176to200',
                type: serverWidget.FieldType.RADIO,
                label: '176-200',
                source: '176to200',
                container: 'importgroup'
            });   
            var custType9 = form.addField({
                id: 'custpage_importnumber',
                name: '201to225',
                type: serverWidget.FieldType.RADIO,
                label: '201-225',
                source: '201to225',
                container: 'importgroup'
            });   
            var custType10 = form.addField({
                id: 'custpage_importnumber',
                name: '226to250',
                type: serverWidget.FieldType.RADIO,
                label: '226-250',
                source: '226to250',
                container: 'importgroup'
            });   

            var fldDate = form.addField({
                type: serverWidget.FieldType.DATE,
                id: 'custpage_paycheckdate',
                label: 'Paycheck Date'
            });
            fldDate.updateLayoutType({
                layoutType: serverWidget.FieldLayoutType.OUTSIDE
            });
            fldDate.updateBreakType({
                breakType: serverWidget.FieldBreakType.STARTCOL
            });

            var fieldgroup2 = form.addFieldGroup({
                id : 'importgroup2',
                label : 'Results:'
            });

            if (infomessage === '')
            {
                infomessage = 'Not Started';
            }

            var fieldmessage = form.addField({
                id: 'message',
                type: 'LABEL',
                label: ' ** NOT STARTED ** ',
                container: 'importgroup2'
            });
            fieldmessage.label = infomessage;

            var hideFld = form.addField({
                id:'custpage_hide_buttons',
                label:'not shown - hidden',
                type: 'INLINEHTML'
            });

          
            var scr = '';
            scr += "document.getElementById('submitter').addEventListener('click', function() {document.getElementById('message_fs_lbl').innerHTML = 'Importing Records.  Please wait...';}, false);";
            scr += "document.getElementById('tdbody_resetter').addEventListener('click', function() {document.getElementById('message_fs_lbl').innerHTML = '';}, false);";
            hideFld.defaultValue = "<script>" + scr + "</script>";

            context.response.writePage(form);


        }

    }
   
    exports.onRequest = onRequest;


    return exports;

});
