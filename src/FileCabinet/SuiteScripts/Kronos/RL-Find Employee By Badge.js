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

     function findEmployeeByBadge(context)//args, argNames, methodName) 
        {            
            
            try 
            {

                var badgeID = String(context.id);

                var mySearch = search.create
                ({
                    type: search.Type.EMPLOYEE,
                    columns: ['internalid', 'firstname', 'lastname'],
                    filters: ['custentity_badge_id', 'is', badgeID]
                });
                var mySearchRS = mySearch.run();
                var results = mySearchRS.getRange({
                    start: 0,
                    end: 1000
                });
    
                return results[0].getValue({name:'internalid'});

            } 
            catch(err) 
            {

                return '0';

            }


        }
        
        return {

            get : findEmployeeByBadge

        }

    }
);
    
