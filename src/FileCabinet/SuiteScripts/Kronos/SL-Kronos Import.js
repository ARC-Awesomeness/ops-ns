/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/https', './oauth1', './crypto-js'], /**
 * @param {record} record
 * @param {serverWidget} serverWidget
 */ function (serverWidget, https, oauth, crypto) {
	/**
	 * Definition of the Suitelet script trigger point.
	 *
	 * @param {Object} context
	 * @param {ServerRequest} context.request - Encapsulation of the incoming request
	 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
	 * @Since 2015.2
	 */
	function oAuthFunc(context) {

		var infomessage = '';

		/**  <<PRODUCTION>>  **/

		var _tokenKey = 'e57091b569372f973099d38b9e1ab3ebde7f2964c5d1786341835d4d25440c7b';
		var _tokenSecret = '3e5a224f32eb8809fe6d4d63420388a91c84220e26239873de151c716a9cfc7a';
		var _consumerKey = '997c607457f3e4f96f40001e6dd4ec9d9a6dde39a987545cf752161f00a00f2d';
		var _consumerSecret = 'ee7b699f174d8b3f897d012df1082492a45e25cc092b5d2a72dcde0fc4a2234c';

		var _account = '6825580';

		/**  <<TEST>>

		var _tokenKey = '66bc1c7114bbee456addad0a73f8e5e5519ab418bfc29531b6bbd561d37ba71d';
		var _tokenSecret = '453a08438a84df604c8aa1a28b0feba93b17d85477d2c89d8ebd923231c7665b';
		var _consumerKey = '833688521121169cf1310f1f5e771db7fbad557eb9dec8dd55769ed9365124c6';
		var _consumerSecret = 'dfea84975fcfc931cf9d275ba81493b9e225beebe388a8e1dfab6863ca481a71';

		var _account = '6825580-SB1';

		 **/

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


		if (context.request.method === 'GET') 
        {

            build_form(infomessage);

        }
		else
		{

			var _createStatus = createKronosTime();

			var _createStatusRS = JSON.parse(_createStatus);
			var _successful = _createStatusRS.successful;
			var _failed = _createStatusRS.failed;
			var _importFailures = _createStatusRS.importFailures;

			log.debug('_successful', _successful);

			try
			{

				if (_successful >= '0')
				{
	
					infomessage = 'Import Complete: ' + _successful + ' records imported; ' + _failed + ' records failed <br/><br/>Import Failures: ' + _importFailures;
	
				}
				else
				{
	
					infomessage = 'Error Occurred. No Records Imported. Please check your date and make sure you select a workplace.'
	
				}

			}
			catch(err)
			{

				infomessage = _createStatus;

			}

			build_form(infomessage);

		}

		function createKronosTime() 
		{

			try 
			{

				var fileObj = context.request.files.custpage_file;
				if (fileObj != null)
				{ 

					fileObj.folder = 1158;
					var _id = fileObj.save();

					var _trxDate = context.request.parameters.custpage_trxdate;
					var _month;
					var _day;
					var _year;
					var _trxDateFormatted;

					if (_trxDate.substring(1,2) === '/')
					{

						_month = _trxDate.substring(0,1);

					}
					else
					{

						_month = _trxDate.substring(0,2);

					}

					log.debug('month', _month);

					if (_trxDate.substring(3,4) === '/')
					{

						_day = _trxDate.substring(2,3);

					}
					else if (_trxDate.substring(1,2) === '/' && _trxDate.substring(4,5) === '/')
					{

						_day = _trxDate.substring(2,4);

					}
					else if (_trxDate.substring(2,3) === '/' && _trxDate.substring(4,5) === '/')
					{

						_day = _trxDate.substring(3,4);

					}
					else
					{

						_day = _trxDate.substring(3,5);

					}

					log.debug('day', _day);

					if (_trxDate.substring(3, 4) === '/')
					{

						_year = _trxDate.substring(4);

					}
					else if (_trxDate.substring(4, 5) === '/')
					{

						_year = _trxDate.substring(5);

					}
					else if (_trxDate.substring(5, 6) === '/')
					{

						_year = _trxDate.substring(6);

					}
					else if (_trxDate.substring(6, 7) === '/')
					{

						_year = _trxDate.substring(7);

					}
					else if (_trxDate.substring(7, 8) === '/')
					{

						_year = _trxDate.substring(8);

					}

					log.debug('year', _year);

					if (_month.length === 1)
					{

						_month = '0' + _month;

					}

					if (_day.length === 1)
					{

						_day = '0' + _day;

					}

					_trxDateFormatted = _month + _day + _year;

					log.debug('date', _trxDateFormatted);

					var _workplace = context.request.parameters.custpage_workplace;

					var HTTP_METHOD = 'GET';

					var RESTLET = 
						'https://' +
						_account.toLowerCase() +
						'.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=493&deploy=1&id=' + _id + '&trxdate=' + _trxDateFormatted + '&workplace=' + _workplace;

				
					log.debug("restlet", RESTLET);

					var request_data = {
						url: RESTLET,
						method: HTTP_METHOD,
						data: {}
					};
						
					var headerWithRealm = oauth.toHeader(oauth.authorize(request_data, token));
					headerWithRealm.Authorization += ', realm="' + _account.replace('-', '_') + '"';
		
					var headers = {
						'User-Agent': 'Suitelet_using_TBA',
						Authorization: headerWithRealm.Authorization,
						'Content-Type': 'application/json'
					};

					var restResponse = https.get({ url: RESTLET, headers: headers });

					log.debug('response', restResponse.body);
	
					return restResponse.body;
					context.response.write(restResponse.body);

				}
				else
				{

					infomessage = 'Please select a file.';

				}
	
			} catch (error) 
			{
				log.debug({ title: 'Catch - Error', details: error });
			}
	
		}

        function build_form(infomessage)
        {
            
            var form = serverWidget.createForm({
                title: 'Kronos Import Time File'
            });
            
            form.addSubmitButton({
                label : 'Import',
            });

            var field = form.addField({
                id: 'custpage_file',
                type: 'file',
                label: 'KRONOS FILE:'
            });
            field.updateLayoutType({
                layoutType: serverWidget.FieldLayoutType.OUTSIDE
            });

            var fldDate = form.addField({
                type: serverWidget.FieldType.DATE,
                id: 'custpage_trxdate',
                label: 'DATE:'
            });
            fldDate.updateLayoutType({
                layoutType: serverWidget.FieldLayoutType.OUTSIDE
            });
            fldDate.updateBreakType({
                 breakType: serverWidget.FieldBreakType.STARTROW
            });

            var fieldgroup1 = form.addFieldGroup({
                id : 'workplace',
                label : 'Workplace:'
            });
            var custType1 = form.addField({
                id: 'custpage_workplace',
                name: 'OKLAHOMA',
                type: serverWidget.FieldType.RADIO,
                label: 'DEWEY',
                source: 'OKLAHOMA',
				container: 'workplace'
             });
             var custType2 = form.addField({
                 id: 'custpage_workplace',
                 name: 'VIRGINIA',
                 type: serverWidget.FieldType.RADIO,
                 label: 'GLEN ALLEN',
                 source: 'VIRGINIA',
				 container: 'workplace'
				});

			var fieldgroup2 = form.addFieldGroup({
                id : 'importgroup',
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
                container: 'importgroup'
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

	return {
		onRequest: oAuthFunc
	};
});
