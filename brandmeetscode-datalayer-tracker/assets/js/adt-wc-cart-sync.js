(function () {
	function syncADTCartToLocalStorage() {
		try {
			var cartTotalEl = document.querySelector('.cart-subtotal .amount, .order-total .amount');
			var cartItemsEl = document.querySelector('.woocommerce-mini-cart__total strong, .woocommerce-cart-form .cart_item');

			var total = 0;
			var items = 0;

			if (cartTotalEl) {
				var txt = cartTotalEl.textContent || '';
				txt = txt.replace(/[^0-9.,]/g, '').replace(',', '.');
				total = parseFloat(txt) || 0;
			}

			if (cartItemsEl) {
				if (cartItemsEl.tagName === 'STRONG') {
					var raw = cartItemsEl.textContent || '';
					var match = raw.match(/\d+/);
					items = match ? parseInt(match[0], 10) : 0;
				} else {
					items = document.querySelectorAll('.woocommerce-cart-form .cart_item').length;
				}
			}

			localStorage.setItem('adt_cart_total', String(total));
			localStorage.setItem('adt_cart_items', String(items));

			if (window.ADTData && window.ADTData.debug) {
				console.log('[ADT] Cart sync → total:', total, 'items:', items);
			}
		} catch (e) {
			if (window.ADTData && window.ADTData.debug) {
				console.warn('[ADT] Cart sync failed:', e);
			}
		}
	}

	document.addEventListener('DOMContentLoaded', syncADTCartToLocalStorage);

	jQuery(document.body).on(
		'updated_cart_totals updated_wc_div updated_checkout added_to_cart removed_from_cart',
		syncADTCartToLocalStorage
	);
})();
