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
        
        function put(context) 
        {            

            doValidation([context.recordtype, context.id], ['recordtype', 'id'], 'PUT');            
            
            var rec = record.load(
            {                
                type: context.recordtype,                
                id: context.id            
            });            
            
            for (var fldName in context)                
            if (context.hasOwnProperty(fldName))                    
            if (fldName !== 'recordtype' && fldName !== 'id')                        
            rec.setValue(fldName, context[fldName]);
            rec.save();            
            return JSON.stringify(rec);        

        } 

        return {

            get : function() 
            {

                return "Hello World!"

            },

            put: put

        }

    }
);
    
