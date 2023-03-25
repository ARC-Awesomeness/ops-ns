/**
 * @NApiVersion 2.1
 * @NScriptType restlet
 */

 define
 (
     ['N/record', 'N/error'], 
     function(record, error) 
    {

        function doValidation(args, argNames, methodName) 
        {            

            for (var i = 0; i < args.length; i++)                
            if (!args[i] && args[i] !== 0)                    
            throw error.create(
            {                        
                name: 'MISSING_REQ_ARG',                        
                message: 'Missing a required argument: [' + argNames[i] + '] for method: ' + methodName                    
            });        

        }
        
        function _put(context) 
        {            

            var _paycheckDate = context.args[0];
            var _tranid = context.args[1];
            var _amount = context.args[2];

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

        return {

            get : function() 
            {

                return "Hello World!"

            },

            put: _put

        }

    }
);
    
