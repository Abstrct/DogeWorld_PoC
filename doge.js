
const bip32 = require('bip32');
const bip39 = require('bip39');
const shajs = require('sha.js');


var Tx = require('ethereumjs-tx');
var Account = require('ethereumjs-wallet');
var Util = require('ethereumjs-util');

var deterministic_stringify = require('json-stringify-deterministic');

let connect   = require('lotion-connect');

let dogeworld_state = null;
let dogeworld_send =  null;

let last_fren_list = null;

var Store = require('store');

var combined_entropy = '';
var current_seed = '';


var dogger_location ='';

var me = null;

var pf = new petfinder.Client({apiKey: "w85cJpNV6zf2QAdzQGw3LVOEGFOq7sQUey1ZEQj6J6liMiLoTl", secret: "7maXe8zbO1ZBojzw5YBS1860W0VxCPrum6nZgHrH"});

var lotion_timer;

var nonce = 0;

$(document).ready(function() {

	lotion_refresh();
	lotion_timer = setInterval(lotion_refresh,100000);




	// Get current human
	 me = Store.get('me');

	// If the Human is empty then create a new one
	if (me === null || typeof(me) === 'undefined') {
		createAccount($('#name_field').val());
	} else {
		//Store.remove('me');
		console.log(me.name)

		$('#name_field').prop('value', me.name);


		$('#human_login_status').html('Human');
		$('#human_name').html('');
		$('#human_menu').prop('hidden', false);

	}



	$('#name_field').click(function(){
		updateAccount();
	})

	$('#button_pet').click(function(){

		console.log('petting');
		console.log(dogeworld_state.count);

		var data = {
			human: {
				id: me.id,
				name: me.name
			},
			fren: {
				id:$('#doggoviewer_id').html(),
				name:$('#doggoviewer_name').html()
			},
			action:'pet',
			nonce:nonce
		}

		nonce = nonce + 1;

		console.log('Does this work? ' + deterministic_stringify(data));

		new_tx = {
			data: data,
			signedMessage: signMessage(deterministic_stringify(data), Buffer.from(me.secrit))
		};


		console.log( shajs('sha256').update('cats').digest('hex'));
		console.log(new_tx);

		dogeworld_send(new_tx);

		lotion_refresh();
		
	});


	$('#button_next').click(function(){
		pf.animal.search({type: "Dog", location:dogger_location, status:"adoptable", limit:"1", sort:"random"})
		    .then(function (response) {
		        // Do something with `response.data.animals`
		        displayResults(response);
		    })
		    .catch(function (error) {
		        // Handle the error
		    });
	  });



	// Example message signing
	// var messageString = 'good boys and girls';
	// var signedMessage = signMessage(messageString, Buffer.from(me.secrit));


	// load the first doggo
	$.ajax({
	  url: "https://geolocation-db.com/jsonp",
	  jsonpCallback: "callback",
	  dataType: "jsonp",
	  success: function(location) {
	    console.log(location.city + ', ' + location.state);
  	    dogger_location = location.city + ', ' + location.state;

		pf.animal.search({type: "Dog", location:dogger_location, status:"adoptable", limit:"1", sort:"random"})
	    .then(function (response) {
	        // Do something with `response.data.animals`
	        displayResults(response);
	    })
	    .catch(function (error) {
	        // Handle the error
	    });
	  }
	});


});





function displayResults(response) {
	
	 	$('#doggoviewer_id').html(response.data.animals[0].id);

        $('#doggoviewer_name').html(response.data.animals[0].name);
		$('#doggoviewer_image').attr('src',response.data.animals[0].photos[0].full);


		$('#doggoviewer_class').html(response.data.animals[0].breeds.primary);
		
		$('#doggoviewer_location').html(response.data.animals[0].contact.address.city + ', '+ response.data.animals[0].contact.address.state);


		if (response.data.animals[0].age === 'Baby' || response.data.animals[0].age === 'Young') {
			$('#doggoviewer_age').html('Pupper');
		} else {
			$('#doggoviewer_age').html('Doggo');
		}
					

		if (response.data.animals[0].gender === 'Female') {
			$('#doggoviewer_gender').html("Good Girl");
		} else {
			$('#doggoviewer_gender').html("Good Boye");
		}

		$('#doggoviewer_description').html(response.data.animals[0].description);


		$('#doggoviewer_loyalty').html('No heckin frens :(');

        console.log(response.data.animals); 
	
}


function displayFrens() {

	if (!(me === null || typeof(me) === 'undefined')) {
		//get human index
		var i = dogeworld_state.human_index.indexOf(me.id);
		// get human fren list
		if (!(dogeworld_state.humans[i] === null || typeof(dogeworld_state.humans[i]) === 'undefined')) {
			var fren_list = dogeworld_state.humans[i].fren_list;
			//check to see if it changed maybe?

			if (fren_list === last_fren_list) {
				console.log('no updated friends');	
			} else {

				last_fren_list = fren_list;
				$('#container_fren_list').html('');
				//clear list

				//for each of the frens
				for (var x = 0; x < fren_list.length; x++){

			  		pf.animal.show(fren_list[x]).then(resp => {
			  			//console.log(JSON.stringify(resp));
			  	    	$('#container_fren_list').append('<div class="row" id="fren-'+resp.data.animal.id+'" onclick="load_friend(' +resp.data.animal.id+ ')"><div class="col col-sm"><img id="frenlist_image_1" class="nes-avatar is-rounded is-large" src="'+ resp.data.animal.photos[0].full +'" style="image-rendering: pixelated; "/></div><div class="col  col" id="frenlist_loyalty_1">' + resp.data.animal.name + '</div><div class="col " id="frenlist_status_1">'+((resp.data.animal.gender === 'Female') ? 'Good Girl' : 'Good Boye')	+'</div><div class="col" id="frenlist_loyalty_1">100% loyal</div><div class="col" id="frenlist_other_status_1"><a href="'+resp.data.animal.url+'">'+ resp.data.animal.status +'</a></div></div>');
			  	  	}).catch(function (error) {
			        	console.log('Doggo not found');
			    	});
			    }

			}
		}
	}	
}



function zeroPad(num, places) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}

load_friend = function loadFren(id){
	pf.animal.show(id).then(resp => {
		var data = {
			data: {
				animals: [resp.data.animal]
				}
			}
			displayResults(data);
	});
}

function createAccount(name){
	var player_account = Account.generate();
    console.log(`Private key = , ${player_account.getPrivateKeyString()}`);
    console.log(`Address = , ${player_account.getAddressString()}`);

    console.log(typeof(player_account.getPrivateKey()));

    var human = { 
    		name:name,
    		secrit: Buffer.from(player_account.getPrivateKey().toString('hex')),
    		secrit_string: player_account.getPrivateKeyString(),
    		id: player_account.getAddressString()
    	};

    console.log(typeof(human.secrit));
	

    Store.set('me', human);

    return human;
}

function updateAccount(){
    var human = { 
		name:$('#name_field').val(),
		secrit: me.secrit,
		secrit_string: me.secrit_string,
		id: me.id
	};

    console.log(typeof(human.secrit));
	

    me = human;
    Store.set('me', human);
}


function signMessage(messageString, secrit){

	var messageBuffer = Buffer.from(messageString);
	console.log(messageString);


	console.log('Creating a Personal MessageHash of the message');
	var messageHashBuffer = Buffer.from(Util.hashPersonalMessage(messageBuffer));


	console.log('messah hash buffer string')
	console.log(messageHashBuffer.toString('hex'));


	console.log('Signing the messageBuffer');
	var messageSigned = Util.ecsign(messageHashBuffer, secrit);


	console.log('signed message object');
	console.log(messageSigned);


	console.log('Signed message string');
	console.log(messageSigned.toString('hex'));
	console.log(messageSigned.toString());


	console.log('m');
	console.log(messageSigned.m);
	console.log('v');
	console.log(messageSigned.v);
	console.log('r');
	console.log(messageSigned.r.toString('hex'));
	console.log(messageSigned.r);
	console.log('s');
	console.log(messageSigned.s.toString('hex'));
	console.log(messageSigned.s);

	console.log('proper format?');
	console.log(Util.toRpcSig(messageSigned.v,messageSigned.r,messageSigned.s));
	return Util.toRpcSig(messageSigned.v,messageSigned.r,messageSigned.s);

}

function verifySignature(id, originalMessage, signedMessage){
	var messageSigned = Util.fromRpcSig(signedMessage);

	console.log(originalMessage);

	var messageBuffer = Buffer.from(originalMessage);

	console.log('Creating a Personal MessageHash of the message');
	var messageHashBuffer = Buffer.from(Util.hashPersonalMessage(messageBuffer));

	
	console.log(Util.isValidSignature(messageSigned.v,messageSigned.r,messageSigned.s));

	
	console.log('Address from Signature');
	console.log('0x' + Util.pubToAddress(Util.ecrecover(messageHashBuffer, messageSigned.v, messageSigned.r, messageSigned.s)).toString('hex'));
	console.log(id);
}

function mnemonicToKey(mnemonic_key) {
	return bip39.mnemonicToEntropy(generateMnemonic(key.toString(16)));
}

function keyToMnemonic(secrit) {
	const mnemonic = bip39.entropyToMnemonic(secrit)

	return mnemonic;
}


/// deprecated?
function loadKey(the_key){
	console.log(the_key.length);
	var privateKeyString = the_key;
	while (privateKeyString.length < 64) {

	  console.log("Incorrect buffer size for key detected. Adding padded zero to the start");
	  privateKeyString = '0'.concat(privateKeyString);

	  console.log(privateKeyString.length);
	  //console.log(privateKeyString);

	}
	var privateKey = Buffer.from(privateKeyString, 'hex');

	return privateKey;
}

lotion_refresh = async function lotion_refresh(){
	let { state, send } = await connect(null, { 
  		genesis: require('./genesis.json'),
  		nodes: [ 'ws://localhost:62130' ]
	});

	console.log(await state.count); 
	//console.log(await send(JSON.parse('{ "action":"pet", "target":1, "nonce":3500000000999999909999 }')));

	setState(await state);
	setSend(await send);


}



function setState(new_state){
	console.log('setting state');
	console.log(new_state.count);
	dogeworld_state = new_state;
	console.log(dogeworld_state.count);

	displayFrens();
}

function setSend(new_send){
	dogeworld_send = new_send;
}
