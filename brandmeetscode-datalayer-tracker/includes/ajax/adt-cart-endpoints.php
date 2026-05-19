<?php
/**
 * DataLayer Tracker - Cart AJAX Endpoints
 * 
 * @package    DataLayer_Tracker
 * @subpackage Core
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
defined('ABSPATH') || exit; 

add_action('wp_ajax_adt_get_cart_data', 'adt_ajax_cart_response');
add_action('wp_ajax_nopriv_adt_get_cart_data', 'adt_ajax_cart_response');

function adt_ajax_cart_response() {
    $config = apply_filters('adt_frontend_config', []);
    wp_send_json_success(['adtWoo' => $config['adtWoo'] ?? []]);
}

add_action('wp_ajax_nopriv_adt_get_cart_item', 'adt_get_cart_item');
add_action('wp_ajax_adt_get_cart_item', 'adt_get_cart_item');

function adt_get_cart_item() {
    // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Public product metadata for cart UX; product_id is absint below.
    $product_id = isset( $_GET['product_id'] ) ? absint( wp_unslash( $_GET['product_id'] ) ) : 0;
    if (!$product_id || !function_exists('wc_get_product')) {
        wp_send_json([]);
        return;
    }

    $product = wc_get_product($product_id);
    if (!$product) {
        wp_send_json([]);
        return;
    }

    $categories = wp_get_post_terms($product_id, 'product_cat', ['fields' => 'names']);

    $item = [
        'item_id'       => $product_id,
        'item_name'     => $product->get_name(),
        'price'         => number_format($product->get_price(), 2, '.', ''),
        'quantity'      => 1,
        'item_category' => implode('/', array_map('sanitize_text_field', $categories)),
        'item_variant'  => $product->is_type('variation') ? $product->get_formatted_name() : ''
    ];

    wp_send_json($item);
}
