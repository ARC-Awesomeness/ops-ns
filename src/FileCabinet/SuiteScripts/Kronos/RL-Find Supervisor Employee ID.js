/**
 * @NApiVersion 2.1
 * @NScriptType restlet
 */

 define
 (
     ['N/record', 'N/error', 'N/search'], 
     function(record, error, search) 
    {

     /**
      * Definition of the Suitelet script trigger point.
      *
      * @param {Object} context
      * @param {ServerRequest} context.request - Encapsulation of the incoming request
      * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
      * @Since 2021.2
      */

     function findSupervisorEmployeeID(context)//args, argNames, methodName) 
        {            
            
            try 
            {

                // var firstName = String(context.first);
                // var lastName = String(context.last);
                var internalID = String(context.id);

                var supervisorSearch = search.create
                ({
                    type: search.Type.EMPLOYEE,
                    columns: ['internalid', 'firstname', 'lastname', 'accountnumber'],
                    filters: [
                        {
                            name: 'internalid', 
                            operator: 'is', 
                            values: internalID
                        }
                        // {
                        //     name: 'firstname', 
                        //     operator: 'is', 
                        //     values: firstName
                        // },
                        // {
                        //     name: 'lastname', 
                        //     operator: 'is', 
                        //     values: lastName
                        // }
                    ]
                });
                var supervisorSearchRS = supervisorSearch.run();
                var supervisorResults = supervisorSearchRS.getRange({
                    start: 0,
                    end: 1000
                });
    
                log.debug('results', supervisorResults);
                log.debug('results - 1', supervisorResults[0]);
                log.debug('supervisor', supervisorResults[0].getValue({name:'accountnumber'}));

                return supervisorResults[0].getValue({name:'accountnumber'});

            } 
            catch(err) 
            {

                return '0';

            }


        }
        
        return {

            get : findSupervisorEmployeeID

        }

    }
);
    
