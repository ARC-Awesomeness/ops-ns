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


		if (context.request.method === 'GET') 
        {

            build_form(infomessage);

        }
		else
		{

			var createStatus = getKronosEmployees();
			//context.response.write(createStatus);

			infomessage = 'Import Complete: ' + createStatus + ' records exported';
			build_form(infomessage);

		}

		function getKronosEmployees() 
		{

			try 
			{

				var HTTP_METHOD = 'GET';

				var RESTLET = 
					'https://' +
					_account.toLowerCase() +
					'.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=492&deploy=1';
	
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

				log.debug('response', restResponse.body);

				return restResponse.body;
				
				context.response.write(restResponse.body);

			} catch (error) 
			{
				log.debug({ title: 'Catch - Error', details: error });
			}
	
		}

        function build_form(infomessage)
        {
            
            var form = serverWidget.createForm({
                title: 'Kronos Export File Creation'
            });
            
            form.addSubmitButton({
                label : 'Create',
            });

            var fieldgroup1 = form.addFieldGroup({
                id : 'instructions',
                label : 'Instructions:'
            });

            var fieldmessage = form.addField({
                id: 'instruction',
                type: 'LABEL',
                label: ' The file will be saved in the Document Library. Go to Documents>>Files and click on File Cabinet. Select the KRONOS folder. Click the Download link next to your file. ',
                container: 'instructions'
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
            scr += "document.getElementById('submitter').addEventListener('click', function() {document.getElementById('message_fs_lbl').innerHTML = 'Exporting Records.  Please wait...';}, false);";
            scr += "document.getElementById('tdbody_resetter').addEventListener('click', function() {document.getElementById('message_fs_lbl').innerHTML = '';}, false);";
            hideFld.defaultValue = "<script>" + scr + "</script>";

            context.response.writePage(form);

        }

	}

	return {
		onRequest: oAuthFunc
	};
});
