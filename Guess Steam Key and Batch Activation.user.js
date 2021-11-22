// ==UserScript==
// @name         Guess Steam Key and Batch Activation
// @version      1.0
// @description  Will attempt to redeem an incomplete Steam product code or batch activate full ones
// @author       marvinscham
// @icon         https://marvinscham.de/assets/favicon-32x32.png
// @include      http://store.steampowered.com/account/registerkey*
// @include      https://store.steampowered.com/account/registerkey*
// @namespace    https://marvinscham.de
// @grant        none
// ==/UserScript==

// Modified version of https://greasyfork.org/de/scripts/33052-batch-register-steam-keys
// Supports guessing Product Keys that have a number replaced with a "?"

// You must run this code at https://store.steampowered.com/account/registerkey

/* jshint esversion: 6 */

(() => {
	let keys, succKeys, errKeys, index, multi, nonstrict;

	const init = () => {
		let input = document.getElementById('product_key').value.trim();
		if (!input) {
			input = prompt('Input your key, split them with comma (,)', '').trim();
			if (!input) {
				alert('You must input at least one product key!');
				throw Error('You must input at least one product key!');
			}
		}
		log('log', `Inputs: <code>${input}</code>`);

		keys = getKeys(input);
		log('log', `Key length: ${keys.length}`);
		succKeys = [];
		errKeys = [];
		index = 0;
	};

	const filterKeys = (input, nonstrict = false) => {
		// most of steam keys are looks like `AAAAA-BBBBB-CCCCC`,
		// and Steam also shows `AAAAA-BBBBB-CCCCC-DDDDD-EEEEE` as an example.
		// this function only filters these two types without non-strict mode, 
		// but in fact Steam has greater latitude for the inputs,
		// if you insert keys without hyphens, with hyphens or spaces anywhere,
		// like `AAA AABBB-BBCC CCC`, Steam will accept it and give you the right product.
		// also some articles shows Steam supports more than these two types,
		// like (*) shows his key is 26 digits, but it's a valid key,
		// maybe that's why Steam gives a strange example `237ABCDGHJLPRST 23`.
		// if enabled non-strict mode, it'll include the tokens that have more than 15 chars,
		// and only have uppercase letters and hyphens.
		//
		// (*) https://www.reddit.com/r/Steam/comments/64xhlt/26_digit_steam_key_is_possible/
		return Array.from(
			input.match(
				nonstrict ?
					/[0-9A-Z\-]{15,}/g
					:
					/(?:(?:[0-9A-Z]{5}-){2}){1,2}[0-9A-Z]{5}/g
			) || []
		);
	}

	const getKeys = (input) => {
		return input.trim().split(/\s*(?:,|，|\n)\s*/).map(e => e.trim()).filter(e => e);
	};

	const regKey = async (key) => {
		log('log', `Registering <code>${key}</code> (${index}/${keys.length})...`);
		const body = new FormData();
		body.append('product_key', key);
		body.append('sessionid', window.g_sessionID);

		try {
			const res = await fetch('https://store.steampowered.com/account/ajaxregisterkey/', {
				method: 'POST',
				credentials: 'same-origin',
				cache: 'no-cache',
				body: body
			});
			const res_1 = await res.json();
			const receipt = res_1.purchase_receipt_info;
			let productName = null;
			if (receipt && receipt.line_items && receipt.line_items[0]) {
				productName = receipt.line_items.map(e => e.line_item_description).join(', ');
				log('log', 'Product: <u>' + productName + '</u>');
			}

			if (res_1.success === 1) {
				log('info', `Key <code>${key}</code> was redeemed success!`);
				return true;
			}
			else {
				log('warn', `Key <code>${key}</code> was redeemed fail!`);
				log('warn', getErrorMsg(res_1.purchase_result_details, productName));
				return false;
			}
		} catch (err) {
			log('warn', `Key <code>${key}</code> was redeemed fail!`);
			log('warn', getErrorMsg(-1));
			log('error', err);
			return false;
		}
	};

	const shiftKey = () => {
		return keys[index++];
	};

	const getErrorMsg = (code, productName) => {
		// copied from Steam's OnRegisterProductKeyFailure
		let sErrorMessage = 'An unexpected error has occurred.  Your product code has not been redeemed.  Please wait 30 minutes and try redeeming the code again.  If the problem persists, please contact <a href="https://help.steampowered.com/en/wizard/HelpWithCDKey">Steam Support</a> for further assistance.';

		switch (code) {
			case 14:
				sErrorMessage = 'The product code you\'ve entered is not valid. Please double check to see if you\'ve mistyped your key. I, L, and 1 can look alike, as can V and Y, and 0 and O.';
				break;

			case 15:
				sErrorMessage = 'The product code you\'ve entered has already been activated by a different Steam account. This code cannot be used again. Please contact the retailer or online seller where the code was purchased for assistance.';
				break;

			case 53:
				sErrorMessage = 'There have been too many recent activation attempts from this account or Internet address. Please wait and try your product code again later.';
				break;

			case 13:
				sErrorMessage = 'Sorry, but %1$s is not available for purchase in this country. Your product key has not been redeemed.'.replace(/\%1\$s/, productName ? productName : 'the product');
				break;

			case 9:
				sErrorMessage = 'This Steam account already owns the product(s) contained in this offer. To access them, visit your library in the Steam client.';
				break;

			case 24:
				sErrorMessage = 'The product code you\'ve entered requires ownership of another product before activation.\n\nIf you are trying to activate an expansion pack or downloadable content, please first activate the original game, then activate this additional content.';
				break;

			case 36:
				sErrorMessage = 'The product code you have entered requires that you first play %1$s on the PlayStation®3 system before it can be registered.\n\nPlease:\n\n- Start %1$s on your PlayStation®3 system\n\n- Link your Steam account to your PlayStation®3 Network account\n\n- Connect to Steam while playing %1$s on the PlayStation®3 system\n\n- Register this product code through Steam.'.replace(/\%1\$s/g, productName ? productName : 'the product');
				break;

			case 50: // User entered wallet code
				sErrorMessage = 'The code you have entered is from a Steam Gift Card or Steam Wallet Code.  Click <a href="https://store.steampowered.com/account/redeemwalletcode">here</a> to redeem it.';
				break;

			case 4: /* falls through */
			default:
				sErrorMessage = 'An unexpected error has occurred.  Your product code has not been redeemed.  Please wait 30 minutes and try redeeming the code again.  If the problem persists, please contact <a href="https://help.steampowered.com/en/wizard/HelpWithCDKey">Steam Support</a> for further assistance.';
				break;
		}

		return sErrorMessage;
	};

	const logResult = () => {
		log('info', `${succKeys.length} success, ${errKeys.length} fail.`);
		log('info', `Success: <code>${succKeys.join(',')}</code>`);
		log('info', `Fail: <code>${errKeys.join(',')}</code>`);
	};

	const main = () => {
		const key = shiftKey();
		if (key) {
			regKey(key).then(result => {
				if (result) {
					succKeys.push(key);
				}
				else {
					errKeys.push(key);
				}

				if (index >= keys.length) {
					logResult();
				}
				else {
					setTimeout(main, 5000);
				}
			});
		}
		else if (key !== undefined) {
			main();
		}
		else {
			logResult();
		}
	};

	const getShuffledNumbers = () => {
		// based on Fisher-Yates Shuffle
		let array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
		let currentIndex = array.length, randomIndex;

		// while there are elements to shuffle
		while (currentIndex != 0) {
			// pick a random remaining element
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;

			// then swap it with the current element
			[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
		}

		return array;
	}

	const log = (type, msg) => {
		// console[type](msg);

		const elem = document.createElement('div');
		elem.className = 'batch_log';
		switch (type) {
			case 'warn':
				elem.style.color = '#FF9800';
				break;

			case 'error':
				elem.style.color = '#F44336';
				break;

			case 'info':
				elem.style.color = '#03A9F4';
				break;

			case 'log': /* falls through */
			default:
				elem.style.color = '#c6d4df';
		}
		elem.innerHTML = msg.replace(/\n/g, '<br>');

		document.getElementById('registerkey_examples_text').appendChild(elem);
	};

	// by @7-elephant, see https://greasyfork.org/zh-CN/forum/discussion/29532/x
	const changeElementType = (element, newtype) => {
		var newelement = document.createElement(newtype);
		while (element.firstChild) {
			newelement.appendChild(element.firstChild);
		}
		for (let i = 0, a = element.attributes, l = a.length; i < l; i++) {
			newelement.setAttribute(a[i].name, a[i].value);
		}
		element.parentNode.replaceChild(newelement, element);
		return newelement;
	};

	const insertBatchBtn = () => {
		multi = false;
		nonstrict = false;
		const s = `
			/* overwrite steam default styles */
			#main_content > .leftcol { float: none; width: 100%; }
			#registerkey_examples_text { float: left; width: 616px; }

			.batch { display: -webkit-flex; display: flex; }
			.batch > div:first-child { flex: 1 }
			.batch #product_key { width: 100%; }
			.batch_multi { display: block; }
			.batch_multi > div:first-child { float: none; width: 100%; margin-bottom: 10px; }
			.batch_multi #product_key { height: 100px; width: 100%; }
			.batch_multi .btn_medium { margin-left: 0; margin-right: 12px; }
			.batch_log { margin-bottom: 2px; }
			.batch_options { float: right; }
			.batch_options > label { margin-left: 12px }
		`;
		const infoNormal = '[ To use batch redeem, split your keys with comma (,) ]';
		const infoMulti = '[ To use batch redeem, split your keys with new line (↵) ]';
		const root = document.getElementById('product_key').parentElement.parentElement;
		const intro = document.querySelector('#registerkey_form > h2 + div');
		const buttons = document.querySelector('.button_row');
		const style = document.createElement('style');
		style.textContent = s;
		root.appendChild(style);
		root.classList.add('batch');

		const redeemBtn = document.createElement('a');
		redeemBtn.setAttribute('tabindex', 301);
		redeemBtn.className = 'btnv6_blue_hoverfade btn_medium';
		redeemBtn.innerHTML = '<span>Batch</span>';
		redeemBtn.addEventListener('click', () => {
			const target = document.getElementById('registerkey_examples_text');
			target.innerHTML = '';
			target.style.fontSize = '14px';
			init();
			main();
		});
		buttons.appendChild(redeemBtn);

		const filterBtn = document.createElement('a');
		filterBtn.setAttribute('tabindex', 302);
		filterBtn.className = 'btnv6_blue_hoverfade btn_medium';
		filterBtn.innerHTML = '<span>Filter Keys</span>';
		filterBtn.addEventListener('click', () => {
			const ipt = document.getElementById('product_key');
			const vals = ipt.value;
			ipt.value = filterKeys(vals, nonstrict).join(multi ? '\n' : ',');
		});
		buttons.appendChild(filterBtn);

		const guessBtn = document.createElement('a');
		guessBtn.setAttribute('tabindex', 303);
		guessBtn.className = 'btnv6_blue_hoverfade btn_medium';
		guessBtn.innerHTML = '<span>Guess Key</span>';
		guessBtn.addEventListener('click', () => {
			const ipt = document.getElementById('product_key');
			const val = ipt.value.split(multi ? '\n' : ',')[0];
			const shuffledNumbers = getShuffledNumbers();
			ipt.value = "";
			for (let i = 0; i <= 9; i++) {
				ipt.value += val.replace(/\?/, shuffledNumbers[i]) + (multi ? '\n' : ',');
			}
		});
		buttons.appendChild(guessBtn);

		const optionSection = document.createElement('div');
		optionSection.className = 'batch_options';
		const infoText = document.createElement('span');
		infoText.textContent = infoNormal;

		const toggleLabel = document.createElement('label');
		const toggle = document.createElement('input');
		toggle.setAttribute('type', 'checkbox');
		toggle.addEventListener('change', () => {
			multi = toggle.checked;
			let ipt = document.getElementById('product_key');
			let keys = getKeys(ipt.value);

			if (multi) {
				root.classList.add('batch_multi');

				ipt = changeElementType(ipt, 'textarea');
				ipt.value = keys.join('\n');
				infoText.textContent = infoMulti;
			}
			else {
				root.classList.remove('batch_multi');

				ipt = changeElementType(ipt, 'input');
				ipt.removeAttribute('style');
				ipt.value = keys.join(',');
				infoText.textContent = infoNormal;
			}
		});
		toggleLabel.appendChild(toggle);
		toggleLabel.appendChild(document.createTextNode(' Multi-line Mode'));

		const filterLabel = document.createElement('label');
		const filterOption = document.createElement('input');
		filterOption.setAttribute('type', 'checkbox');
		filterOption.addEventListener('change', () => {
			nonstrict = filterOption.checked;
		});
		filterLabel.appendChild(filterOption);
		filterLabel.appendChild(document.createTextNode(' Non-strict Filter'));
		filterLabel.setAttribute('title', 'This allows you to get non-standard keys');

		optionSection.appendChild(toggleLabel);
		optionSection.appendChild(filterLabel);
		intro.appendChild(infoText);
		intro.appendChild(optionSection);
	};

	insertBatchBtn();
})();