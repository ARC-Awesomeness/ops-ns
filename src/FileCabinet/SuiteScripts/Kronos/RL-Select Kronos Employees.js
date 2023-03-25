/**
 * @NApiVersion 2.1
 * @NScriptType restlet
 */

 define
 (
     ['N/record', 'N/error', 'N/search', 'N/https', './oauth1', './crypto-js', 'N/file'], 
     function(record, error, search, https, oauth, crypto, file) 
    {

     /**
      * Definition of the Suitelet script trigger point.
      *
      * @param {Object} context
      * @param {ServerRequest} context.request - Encapsulation of the incoming request
      * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
      * @Since 2021.2
      */

     function selectEmployeeList(context)
        {            
            
            var recCount = 0;
            
            var HTTP_METHOD = 'GET';

            var _tokenKey = 'e57091b569372f973099d38b9e1ab3ebde7f2964c5d1786341835d4d25440c7b';
            var _tokenSecret = '3e5a224f32eb8809fe6d4d63420388a91c84220e26239873de151c716a9cfc7a';
            var _consumerKey = '997c607457f3e4f96f40001e6dd4ec9d9a6dde39a987545cf752161f00a00f2d';
            var _consumerSecret = 'ee7b699f174d8b3f897d012df1082492a45e25cc092b5d2a72dcde0fc4a2234c';
    
            var _account = '6825580';
    
            var token = {
                key: _tokenKey,
                secret: _tokenSecret
            };
    
            var consumer = {
                key: _consumerKey,
                secret: _consumerSecret
            };
    
            const oauth = OAuth({
                consumer: { key: consumer.key, secret: consumer.secret },
                signature_method: 'HMAC-SHA256',
                hash_function: function (base_string, key) {
                    return crypto.HmacSHA256(base_string, key).toString(crypto.enc.Base64);
                }
            });
    
    
            var oauth_data = {
                oauth_consumer_key: oauth.consumer.key,
                oauth_nonce: oauth.getNonce(),
                oauth_signature_method: oauth.signature_method,
                oauth_timestamp: oauth.getTimeStamp(),
                oauth_version: '1.0',
                oauth_token: token.key
            };
    
                
            try 
            {

                var line;
                var skip;
                var _supervisor;
                var _supervisorID;

                var employeeSearch = search.load 
                ({
                    id: 'customsearch_employee_kronos_info'
                });
                var employeeSearchRS = employeeSearch.run();
                var employeeResults = employeeSearchRS.getRange({
                    start: 0,
                    end: 1000
                });

                if (employeeResults.length > 0) 
                {

                    var csvObj = file.create({ 
                        name: 'KRONOS ' + Date().replace(/:/g,'_') + '.csv',
                        fileType: 'PLAINTEXT',
                        folder: 1157
                    });

                    line = 'Username' + ', ';
                    line += 'Employee  Id' + ', ';
                    line += 'Badge Id' + ', ';
                    line += 'First Name' + ', ';
                    line += 'Last Name' + ', ';
                    line += 'Hired' + ', ';
                    line += 'Started' + ', ';
                    line += 'Terminated' + ', ';
                    line += 'Default Cost Center 1' + ', ';
                    line += 'Pay Calculations' + ', ';
                    line += 'Pay Period' + ', ';
                    line += 'Pay Prep' + ', ';
                    line += 'Security' + ', ';
                    line += 'Timesheet' + ', ';
                    line += 'Manager 1' + ', ';
                    line += 'Status';

                    log.debug('admin', employeeResults[0].getValue({name:'custentity_kronos_admin'}).toString());
                    log.debug('header', line);
                    log.debug('line', employeeResults[0]);

                    csvObj.appendLine({value: line});

                }

                for (e = 0; e < employeeResults.length; e++)
                {

                    skip = 0;

                    if (employeeResults[e].getValue({name:'accountnumber'}) === '0205015')
                    {

                        skip = 1;

                    }
                    else if (employeeResults[e].getValue({name:'accountnumber'}) === '1109530')
                    {

                        skip = 1;
                        
                    }
                    else if (employeeResults[e].getValue({name:'accountnumber'}) === '0701665')
                    {

                        skip = 1;
                        
                    }
                    else if (employeeResults[e].getValue({name:'accountnumber'}) === '1109505')
                    {

                        skip = 1;
                        
                    }
                    else if (employeeResults[e].getValue({name:'accountnumber'}) === '1109515')
                    {

                        skip = 1;
                        
                    }
                    else if (employeeResults[e].getValue({name:'accountnumber'}) === '1305750')
                    {

                        skip = 1;
                        
                    }
                    else if (employeeResults[e].getValue({name:'accountnumber'}) === '1109540')
                    {

                        skip = 1;
                        
                    }
                    else if (employeeResults[e].getValue({name:'accountnumber'}) === '0')
                    {

                        skip = 1;
                        
                    }

                    line = '';

                    if (skip === 0) 
                    {

                        line += employeeResults[e].getValue({name:'accountnumber'}) + ', ';
                        line += employeeResults[e].getValue({name:'accountnumber'}) + ', ';
                        line += employeeResults[e].getValue({name:'custentity_badge_id'}) + ', ';
                        line += employeeResults[e].getValue({name:'firstname'}) + ', ';
                        line += employeeResults[e].getValue({name:'lastname'}) + ', ';
                        line += employeeResults[e].getValue({name:'hiredate'}) + ', ';
                        line += employeeResults[e].getValue({name:'hiredate'}) + ', ';
                        line += employeeResults[e].getValue({name:'releasedate'}) + ', ';
                        line += employeeResults[e].getText({name:'custentity_kronos_department'}) + ', ';
                        line += employeeResults[e].getText({name:'custentity_lunch_schedule'}) + ', ';
                        line += 'Bi-Weekly' + ', ';
                        line += 'Default' + ', ';

                        if (employeeResults[e].getValue({name:'custentity_kronos_admin'}).toString() == 'false' && employeeResults[e].getValue({name:'custentity_kronos_dept_mgr'}).toString() == 'false') 
                        {

                            line += 'Employee' + ', ';

                        }
                        else if (employeeResults[e].getValue({name:'custentity_kronos_admin'}).toString() != 'false') 
                        {

                            line += 'Company Administrator' + ', ';

                        }
                        else if (employeeResults[e].getValue({name:'custentity_kronos_dept_mgr'}).toString() != 'false') 
                        {

                            line += 'Department Manager' + ', ';

                        }

                        line += 'Start/End (All Days)' + ', ';

                        _supervisor = employeeResults[e].getText({name:'supervisor'});

                        if (_supervisor === '')
                        {

                            _supervisorID = '';

                        }
                        else if (_supervisor === 'D Angiolillo, Aaron')
                        {

                            _supervisorID = '0400150';
                            
                        }
                        else if (_supervisor === 'Dilldine, Stacey')
                        {

                            _supervisorID = '0409530';
                            
                        }
                        else if (_supervisor === 'Kocher, Anthony')
                        {

                            _supervisorID = '1115200';
                            
                        }
                        else if (_supervisor === 'Nading, Timothy')
                        {

                            _supervisorID = '1401200';
                            
                        }
                        else if (_supervisor === 'Parham, Layne')
                        {

                            _supervisorID = '1601700';
                            
                        }
                        else if (_supervisor === 'Sanders, Jay')
                        {

                            _supervisorID = '1901540';
                            
                        }
                        else if (_supervisor === 'Sanders, Steven')
                        {

                            _supervisorID = '1901500';
                            
                        }
                        else if (_supervisor === 'Scott, Linda S')
                        {

                            _supervisorID = '1903760';
                            
                        }
                        else if (_supervisor === 'Taton, Sam')
                        {

                            _supervisorID = '2001500';
                            
                        }
                        else if (_supervisor === 'Wood, Thomas')
                        {

                            _supervisorID = '2315650';
                            
                        }
                        else
                        {

                            _supervisorID = getSupervisorEmployeeID(employeeResults[e].getValue({name:'supervisor'}));
                            
                        }

                        line += _supervisorID + ', ';

                        if (employeeResults[e].getValue({name:'releasedate'}) != '')
                        {

                            line += 'terminated';

                        }
                        else
                        {

                            line += '';

                        }

                        log.debug(e, line);

                        csvObj.appendLine({value: line});
                        recCount++;

                    }

                }




                try
                {

                    var csv_id = csvObj.save();

                }
                catch(err)
                {

                }

    
                // log.debug('results', employeeResults);
                // log.debug('results - 1', employeeResults[0]);
                // log.debug('results - count', employeeResults.length);
                // log.debug('acct', employeeResults[0].getValue({name:'accountnumber'}));
                // log.debug('supervisor', employeeResults[0].getValue({name:'supervisor'}));
                // log.debug('badge', employeeResults[0].getValue({name:'custentity_badge_id'}));
                // log.debug('lunch', employeeResults[0].getText({name:'custentity_lunch_schedule'}));
                // log.debug('dept', employeeResults[0].getText({name:'custentity_kronos_department'}));
                // log.debug('admin', employeeResults[0].getValue({name:'custentity_kronos_admin'}));
                // log.debug('mgr', employeeResults[0].getValue({name:'custentity_kronos_dept_mgr'}));

                return recCount.toString();

            } 
            catch(err) 
            {

                return err.toString();

            }

            function delayLoop(aFunction, milliseconds)
            {

                var date = new Date();
                date.setMilliseconds(date.getMilliseconds() + milliseconds);
                while(new Date() < date){
                }
                
                return aFunction();

            }

            function getSupervisorEmployeeID(_supervisor) 
            {
    
                try 
                {
    
                    var HTTP_METHOD = 'GET';
    
                    var RESTLET = 
                        'https://' +
                        _account.toLowerCase() +
                        '.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=490&deploy=1&id=' + _supervisor;
        
                    log.debug("restlet", RESTLET);
        
                    var request_data = {
                        url: RESTLET,
                        method: HTTP_METHOD,
                        data: {}
                    };
        
                    var headerWithRealm = oauth.toHeader(oauth.authorize(request_data, token));
                    headerWithRealm.Authorization += ', realm="' + _account + '"';
        
                    var headers = {
                        'User-Agent': 'Suitelet_using_TBA',
                        Authorization: headerWithRealm.Authorization,
                        'Content-Type': 'application/json'
                    };
        
                    var restResponse = https.get({ url: RESTLET, headers: headers });
    
                    if (restResponse.body != '0') 
                    {

                        return restResponse.body;

                    }
                    else 
                    {

                        return '';

                    }
   
                } catch (error) 
                {

                    log.debug({ title: 'Catch - Error', details: error });
                    return '';

                }
        
            }
    
        }
        
        return {

            get : selectEmployeeList

        }

    }
);
    
