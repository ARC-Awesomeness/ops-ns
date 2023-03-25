/**
 * @NApiVersion 2.1
 * @NScriptType restlet
 */

 define
 (
     ['N/record', 'N/error', 'N/search', 'N/https', 'N/file', 'N/format'], 
     function(record, error, search, https, file, format) 
    {

     /**
      * Definition of the Suitelet script trigger point.
      *
      * @param {Object} context
      * @param {ServerRequest} context.request - Encapsulation of the incoming request
      * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
      * @Since 2021.2
      */

     function processTime(context)
        {            

            var _fileID = String(context.id);
            var _importDate = String(context.trxdate);
            var _workplace = String(context.workplace);

            /*

            _fileID = '6774';
            _importDate = '02272022'
            _workplace = 'VIRGINIA';

            */


            var _recCount = 0;
            
            try 
            {

                var line;
                var skip;
                var _supervisor;
                var _supervisorID;
                var _employeeInternalId;
                var _errorCount = 0;
                var _errorDetail = '';

                var _employeeSearch = search.load 
                ({
                    id: 'customsearch_employee_kronos_info'
                });
                var _employeeSearchRS = _employeeSearch.run();
                var _employeeResults = _employeeSearchRS.getRange({
                    start: 0,
                    end: 1000
                });


                if (_employeeResults.length > 0) 
                {

                    var _csvResultsString = getFileContents();
                    var _csvResults = JSON.parse(_csvResultsString);
                    var e;

                    for (t = 0; t < _csvResults.length; t++)
                    {

                        e = 0;
                        _employeeInternalId = 0;

                        do
                        {

                            if (_csvResults[t].employee_id.padStart(7, '0') === _employeeResults[e].getValue({name:'accountnumber'}))
                            {

                                _employeeInternalId = _employeeResults[e].getValue({name:'internalid'});

                                e = 10000;
                               
                            }

                            e++;

                        }
                        while (e < _employeeResults.length);

                        if (_employeeInternalId === "0" || _employeeInternalId === "")
                        {

                            _errorCount++;

                            if (_errorCount > 1)
                            {

                                _errorDetail += ' / ';

                            }

                            _errorDetail += _csvResults[t].employee_id;

                        }
                        else
                        {

                            try
                            {

                                var _trackTime = record.create({
                                    type : 'timebill',
                                    isDynamic : true

                                });


                                var _timeDate = format.parse({value: _csvResults[t].trx_date, type: format.Type.DATE });

                                _trackTime.setValue('subsidiary', "1");
                                _trackTime.setValue('trandate', _timeDate);
                                _trackTime.setValue('employee', _employeeInternalId);
                                _trackTime.setValue('hours', _csvResults[t].hours);
                                _trackTime.setValue('payrollitem', _csvResults[t].pay_type);

                                if (_workplace === 'VIRGINIA')
                                {

                                    _trackTime.setValue('location', '3');

                                }
                                else
                                {

                                    _trackTime.setValue('location', '2');

                                }

                                var id = _trackTime.save();
                                _recCount++;

                            }

                            catch(err)
                            {

                                _errorCount++;

                                if (_errorCount > 1)
                                {

                                    _errorDetail += ' / ';

                                }

                                _errorDetail += _csvResults[t].employee_id;

                            }

                        }

                    }

                }


                try
                {

                    var csv_id = csvObj.save();

                }
                catch(err)
                {

                }

                var _returnStats = 
                {

                    successful: _recCount.toString(),
                    failed: _errorCount.toString(),
                    importFailures: _errorDetail

                }

                return JSON.stringify(_returnStats);

            } 
            catch(err) 
            {

                return err.toString();

            }

            function getFileContents()
            {

                var _txtObj = file.load({ id: _fileID });

                var i = 0; 
                var _feedJSON;
                var _dataJSON = [];
                var _timeDateString = '';
                var _payType;

                _txtObj.lines.iterator().each(function (_line) 
                {
                    

                    var w = _line.value.split("\t");

                    _timeDateString = parseInt(_importDate.substring(0,2)).toString() + '/' + parseInt(_importDate.substring(2,4)).toString() + '/' + _importDate.substring(4);

                    if (w[2] === '1100')
                    {

                        _payType = '1';

                    }
                    else
                    {

                        _payType = '104';

                    }

                    _feedJSON = 
                    {
                        
                        employee_id: w[0],
                        trx_date: _timeDateString,
                        pay_type: _payType,
                        hours: w[3]

                    }

                    _dataJSON.push(_feedJSON);

                    i++;
                    return true;

                });

                return JSON.stringify(_dataJSON);

            }
            
        }
        
        return {

            get : processTime

        }

    }
);
    
