<?php
/**
 * DataLayer Tracker - WooCommerce Refunds Handler
 * 
 * @package    DataLayer_Tracker
 * @subpackage Integrations
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
defined('ABSPATH') || exit;

/**
 * Track WooCommerce refunds
 * 
 * Fires when an order is refunded in WooCommerce admin.
 * Stores refund data in WordPress transient to be pushed to dataLayer on next frontend page load.
 * 
 * @param int $order_id The order ID being refunded
 * @param int $refund_id The refund ID
 */
function adt_track_woocommerce_refund($order_id, $refund_id) {
    // Safety checks
    if (!function_exists('wc_get_order')) {
        return;
    }
    
    $order = wc_get_order($order_id);
    if (!$order) {
        adt_debug_log('Refund tracking: Order not found - ID: ' . $order_id);
        return;
    }
    
    $refund = wc_get_order($refund_id);
    if (!$refund || !is_a($refund, 'WC_Order_Refund')) {
        adt_debug_log('Refund tracking: Refund not found - ID: ' . $refund_id);
        return;
    }
    
    // Get refund details
    $refund_amount = abs((float) $refund->get_amount());
    $refund_reason = $refund->get_reason();
    
    // Build items array for refunded items
    $items = [];
    foreach ($refund->get_items() as $item_id => $item) {
        $product = $item->get_product();
        $product_id = $item->get_product_id();
        
        // Get category
        $category = '';
        if ($product) {
            $terms = get_the_terms($product_id, 'product_cat');
            if ($terms && !is_wp_error($terms)) {
                $category_names = array_map(function($term) {
                    return $term->name;
                }, $terms);
                $category = implode('/', $category_names);
            }
        }
        
        $items[] = [
            'item_id'       => $product ? $product->get_id() : $product_id,
            'item_name'     => $item->get_name(),
            'price'         => abs((float) $item->get_total()),
            'quantity'      => abs((int) $item->get_quantity()),
            'item_brand'    => $product ? $product->get_attribute('brand') : '',
            'item_category' => $category,
            'item_variant'  => $product && $product->is_type('variation') ? $product->get_formatted_name() : ''
        ];
    }
    
    // Build GA4-compliant refund event
    $refund_data = [
        'event' => 'refund',
        'ecommerce' => [
            'transaction_id' => $order->get_order_number(),
            'value'          => $refund_amount,
            'currency'       => $order->get_currency(),
            'affiliation'    => 'Online Store',
            'items'          => $items
        ],
        'refund_meta' => [
            'refund_id'     => $refund_id,
            'refund_reason' => $refund_reason,
            'refund_date'   => $refund->get_date_created() ? $refund->get_date_created()->format('Y-m-d H:i:s') : '',
            'order_id'      => $order_id,
            'refund_type'   => count($items) < count($order->get_items()) ? 'partial' : 'full'
        ]
    ];
    
    // Store in WordPress transient (more reliable than PHP sessions)
    $user_id = get_current_user_id();
    $transient_key = 'adt_pending_refund_' . $user_id;
    set_transient($transient_key, $refund_data, 3600); // Expires in 1 hour
    
    adt_debug_log('Refund tracking: Event stored in transient for order #' . $order->get_order_number());
    
    // Add order note for visibility
    $order->add_order_note(
        sprintf(
            'ADT: Refund event queued for analytics (Amount: %s %s)',
            $refund_amount,
            $order->get_currency()
        ),
        false,
        false
    );
}

/**
 * Output refund event to dataLayer if one is pending
 * 
 * Checks WordPress transient for pending refund and outputs it to the page using the "two push" pattern.
 * Clears the transient after output to prevent duplicate tracking.
 * Bypasses consent checks since refunds are admin actions, not user tracking.
 * 
 * FIRES ON FRONTEND ONLY so GTM Preview can see it.
 */
function adt_output_refund_to_datalayer() {
    // Fire on FRONTEND only (so GTM Preview can see it)
    if (is_admin()) {
        return;
    }
    
    // Check for pending refund in transient
    $user_id = get_current_user_id();
    $transient_key = 'adt_pending_refund_' . $user_id;
    $refund_data = get_transient($transient_key);
    
    if (empty($refund_data)) {
        return;
    }
    
    // Clear transient immediately to prevent duplicate tracking
    delete_transient($transient_key);
    
    // Check if ecommerce tracking is enabled
    $settings = get_option('adt_settings', []);
    if (empty($settings['enable_ecommerce_tracking'])) {
        adt_debug_log('Refund tracking: Ecommerce tracking disabled, skipping output');
        return;
    }
    
    // Output refund data via wp_add_inline_script (no raw <script> tags).
    $refund_json = wp_json_encode( $refund_data );
    $js = "(function(){window.dataLayer=window.dataLayer||[];var originalPush=window.dataLayer.__originalPush||window.dataLayer.push;var refundData=" . $refund_json . ";originalPush.call(window.dataLayer,{ecommerce:null});originalPush.call(window.dataLayer,refundData);if(window.ADTData&&window.ADTData.debug_mode){console.log('[ADT] Refund event pushed to dataLayer (consent bypassed for admin action):',refundData);}})();";
    $adt_asset_ver = defined( 'ADT_VERSION' ) ? ADT_VERSION : '1.2.5';
    wp_register_script( 'adt-refund-data', false, [], $adt_asset_ver, true );
    wp_add_inline_script( 'adt-refund-data', $js );
    wp_enqueue_script( 'adt-refund-data' );
}

/**
 * Initialize refund tracking hooks
 * 
 * Only runs if:
 * 1. WooCommerce is active
 * 2. Ecommerce tracking is enabled in settings
 */
function adt_init_refund_tracking() {
    // Check if WooCommerce is active
    if (!class_exists('WooCommerce')) {
        return;
    }
    
    // Check if ecommerce tracking is enabled
    $settings = get_option('adt_settings', []);
    if (empty($settings['enable_ecommerce_tracking'])) {
        return;
    }
    
    // Hook into WooCommerce refund action
    add_action('woocommerce_order_refunded', 'adt_track_woocommerce_refund', 10, 2);
    
    // Enqueue refund event on frontend via wp_enqueue_scripts (must run before wp_footer prints scripts).
    add_action('wp_enqueue_scripts', 'adt_output_refund_to_datalayer', 99);
    
    adt_debug_log('Refund tracking: Initialized successfully');
}

// Initialize on plugins_loaded to ensure WooCommerce is available
add_action('plugins_loaded', 'adt_init_refund_tracking', 20);