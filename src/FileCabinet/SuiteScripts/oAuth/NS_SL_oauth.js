/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/https', './oauth1', './crypto-js'], /**
 * @param {record} record
 * @param {serverWidget} serverWidget
 */ function (https, oauth, crypto) {
	/**
	 * Definition of the Suitelet script trigger point.
	 *
	 * @param {Object} context
	 * @param {ServerRequest} context.request - Encapsulation of the incoming request
	 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
	 * @Since 2015.2
	 */
	function oAuthFunc(context) {
		try {
			var HTTP_METHOD = 'GET';
			var ACCOUNT = '6825580';
			var RESTLET = //'/app/site/hosting/restlet.nl?script=489&deploy=1';
				'https://' +
				ACCOUNT.toLowerCase() +
				'.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=490&deploy=1&first=aaron&last=D Angiolillo';

            log.debug("restlet", RESTLET);

			var token = {
				key: 'e57091b569372f973099d38b9e1ab3ebde7f2964c5d1786341835d4d25440c7b',
				secret: '3e5a224f32eb8809fe6d4d63420388a91c84220e26239873de151c716a9cfc7a'
			};

			var consumer = {
				key: '997c607457f3e4f96f40001e6dd4ec9d9a6dde39a987545cf752161f00a00f2d',
				secret: 'ee7b699f174d8b3f897d012df1082492a45e25cc092b5d2a72dcde0fc4a2234c'
			};

			const oauth = OAuth({
				consumer: { key: consumer.key, secret: consumer.secret },
				signature_method: 'HMAC-SHA256',
				hash_function: function (base_string, key) {
					return crypto.HmacSHA256(base_string, key).toString(crypto.enc.Base64);
				}
			});

            log.debug("OAuth", oauth);

			var request_data = {
				url: RESTLET,
				method: HTTP_METHOD,
				data: {}
			};

			var oauth_data = {
				oauth_consumer_key: oauth.consumer.key,
				oauth_nonce: oauth.getNonce(),
				oauth_signature_method: oauth.signature_method,
				oauth_timestamp: oauth.getTimeStamp(),
				oauth_version: '1.0',
				oauth_token: token.key
			};

            log.debug("oauth_data", oauth_data);

			//Generating the Header
			var headerWithRealm = oauth.toHeader(oauth.authorize(request_data, token));
			headerWithRealm.Authorization += ', realm="' + ACCOUNT + '"';

			var headers = {
				'User-Agent': 'Suitelet_using_TBA',
				Authorization: headerWithRealm.Authorization,
				'Content-Type': 'application/json'
			};

			var restResponse = https.get({ url: RESTLET, headers: headers });
			context.response.write(restResponse.body);
		} catch (error) {
			log.debug({ title: 'Catch - Error', details: error });
		}
	}

	return {
		onRequest: oAuthFunc
	};
});
