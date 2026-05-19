<?php
/**
 * DataLayer Tracker - E-commerce Data Export
 * 
 * @package    DataLayer_Tracker
 * @subpackage Integrations
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
defined('ABSPATH') || exit;

function adt_output_ecommerce_data() {
	if ( is_admin() || wp_doing_ajax() ) {
		return;
	}

	$ecommerce_keys = [
		'adt_last_purchase', // ✅ Most useful for schema
		// All others are skipped to avoid redundancy with JS
	];

	foreach ( $ecommerce_keys as $key ) {
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- $key is from the whitelist above; value is normalized before output.
		if ( empty( $_SESSION[ $key ] ) ) {
			continue;
		}

		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- session key is whitelisted; structured ecommerce payload only.
		$data = $_SESSION[ $key ];

		if ( isset( $data['ecommerce'] ) ) {
			$ecom = &$data['ecommerce'];

			// Enforce affiliation and currency
			$ecom['affiliation'] = $ecom['affiliation'] ?? get_bloginfo('name');
			$ecom['currency'] = $ecom['currency'] ?? 'USD';

			// Format value as float with 2 decimal places
			if ( isset( $ecom['value'] ) ) {
				$ecom['value'] = number_format( (float) $ecom['value'], 2, '.', '' );
			}

			// Schema.org markup for purchase only
			if ( $data['event'] === 'purchase' ) {
				$schema = [
					'@context' => 'https://schema.org',
					'@type'    => 'PurchaseAction',
					'name'     => $ecom['affiliation'],
					'priceCurrency' => $ecom['currency'],
					'price'    => $ecom['value'],
					'instrument' => $ecom['payment_type'] ?? 'Online',
					'seller'   => [
						'@type' => 'Organization',
						'name'  => get_bloginfo('name'),
					],
				];

				// Enrich with product list if present
				if ( !empty($ecom['items']) && is_array($ecom['items']) ) {
					$schema['object'] = array_values(array_map(function( $item ) {
						return [
							'@type' => 'Product',
							'name'  => $item['item_name'] ?? 'Unnamed',
							'sku'   => $item['item_id'] ?? null,
							'brand' => [
								'@type' => 'Brand',
								'name'  => $item['item_brand'] ?? 'Unknown'
							]
						];
					}, $ecom['items']));
				}

				// Output structured data (JSON-LD) as an inline script on an enqueued handle.
				// type="application/json" data is passed via wp_add_inline_script as a JS variable.
				wp_add_inline_script(
					'adt-datalayer',
					'window.ADTStructuredData = ' . wp_json_encode( $schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . ';',
					'before'
				);
			}
		}

		unset( $_SESSION[ $key ] );
		break;
	}
}
add_action('wp_footer', 'adt_output_ecommerce_data', 99);
