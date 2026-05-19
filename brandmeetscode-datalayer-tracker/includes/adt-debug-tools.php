<?php
/**
 * DataLayer Tracker - Debug Tools
 * 
 * @package    DataLayer_Tracker
 * @subpackage Core
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
defined('ABSPATH') || exit;

if (!function_exists('adt_is_builder_editor_page')) {
    function adt_is_builder_editor_page() {
        // Query param detection for common builders
        $builderParams = [
            'breakdance' => 'builder',
            'breakdance_iframe' => 'true',
            'breakdance_open_document' => null, // just present
            'elementor-preview' => '1',
            'fl_builder' => '1',
            'ct_builder' => 'true',
            'et_fb' => '1',
            'bricks' => 'run',
            'tve' => 'true',
            'vc_editable' => 'true',
            'preview' => 'true',
            'themify_builder' => 'true'
        ];
        
        foreach ($builderParams as $key => $val) {
            // phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Builder routing; $key is a local whitelist key; value sanitized below.
            $param_raw = isset( $_GET[ $key ] ) ? wp_unslash( $_GET[ $key ] ) : '';
            $param_value = sanitize_text_field( $param_raw );
            if ($param_value && ($val === null || $param_value === $val)) {
                return true;
            }
        }
        
        // Special case: SeedProd - sanitize both parameters
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        $preview = isset( $_GET['preview'] ) ? sanitize_text_field( wp_unslash( $_GET['preview'] ) ) : '';
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        $seedprod = isset( $_GET['seedprod_page_builder'] ) ? sanitize_text_field( wp_unslash( $_GET['seedprod_page_builder'] ) ) : '';
        if ($preview === 'true' && $seedprod) {
            return true;
        }
        
        // Backend/editor page paths - sanitize REQUEST_URI
        $uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
        $editorUris = [
            '/wp-admin/admin.php?page=breakdance',
            '/wp-admin/post.php',
            '/wp-admin/post-new.php',
            '/wp-admin/admin.php?page=elementor',
            '/wp-admin/site-editor.php',
        ];
        
        foreach ($editorUris as $pattern) {
            if (stripos($uri, $pattern) !== false) {
                return true;
            }
        }
        
        return false;
    }
}

if ( ! function_exists( 'adt_user_has_min_role' ) ) {
	function adt_user_has_min_role( $min_role = 'administrator' ) {
		if ( ! is_user_logged_in() ) return false;

		$user = wp_get_current_user();
		$roles = array_map( 'strtolower', (array) $user->roles );

		$role_ranks = [
			'subscriber'    => 0,
			'contributor'   => 1,
			'author'        => 2,
			'editor'        => 3,
			'administrator' => 4,
		];

		$user_rank = max( array_map( fn($r) => $role_ranks[$r] ?? 0, $roles ) );
		$min_rank  = $role_ranks[strtolower($min_role)] ?? 4;

		return $user_rank >= $min_rank;
	}
}

/**
 * Clear ADT-specific caches when settings are updated.
 */
add_action('update_option_adt_settings', function($old_value, $value) {
    // Clear ADT-specific cache entries
    if (function_exists('wp_cache_delete')) {
        wp_cache_delete('adt_settings', 'options');
        wp_cache_delete('adt_field_map', 'adt');
        wp_cache_delete('adt_default_settings', 'adt');
        
        // More aggressive: flush entire object cache to ensure no stale data
        wp_cache_flush();
    }
    
    // Clear transients
    delete_transient('adt_settings_fresh');
    set_transient('adt_settings_fresh', true, 30);
    
    // Update cache buster for asset versioning
    update_option('adt_cache_buster', time(), false); // false = don't autoload
    
    // WP Rocket - clear everything including minified assets
    if (function_exists('rocket_clean_domain')) {
        rocket_clean_domain();
        if (function_exists('rocket_clean_minify')) {
            rocket_clean_minify('css');
            rocket_clean_minify('js');
        }
    }
    
    // W3 Total Cache
    if (function_exists('w3tc_flush_all')) {
        w3tc_flush_all();
    }
    
    // WP Super Cache
    if (function_exists('wp_cache_clear_cache')) {
        wp_cache_clear_cache();
    }
    
    // LiteSpeed Cache
    if (class_exists('LiteSpeed_Cache_API')) {
        LiteSpeed_Cache_API::purge_all();
    }
    
    // Autoptimize (clears minified CSS/JS)
    if (class_exists('autoptimizeCache')) {
        autoptimizeCache::clearall();
    }
    
    // SG Optimizer
    if (function_exists('sg_cachepress_purge_cache')) {
        sg_cachepress_purge_cache();
    }
    
    // WP Fastest Cache
    if (function_exists('wpfc_clear_all_cache')) {
        wpfc_clear_all_cache(true);
    }
    
}, 10, 2);

/**
 * Conditional page cache bypass for debug overlay (role synced).
 */
add_action('send_headers', function() {
    // Only bypass cache if we're actually showing the overlay
    if (!is_user_logged_in()) return;
    
    $settings = get_option('adt_settings', []);
    
    // Check both that overlay is enabled AND user wants to see it
    if (empty($settings['enable_debug_overlay'])) return;
    if (empty($settings['show_debug_overlay'])) return; // Add user preference check
    
    $min_role = $settings['overlay_min_role'] ?? 'administrator';
    if (!adt_user_has_min_role($min_role)) return;
    
    // Only on frontend pages where overlay would show
    if (is_admin() || wp_doing_ajax() || wp_doing_cron()) return;
    
    header('Cache-Control: no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: Wed, 11 Jan 1984 05:00:00 GMT');
    
    if (!defined('DONOTCACHEPAGE')) {
        define('DONOTCACHEPAGE', true);
    }
});

/**
 * Check if current page URL should load tracking based on regex patterns
 * 
 * @return bool True if should load, false if excluded
 */
if (!function_exists('adt_should_load_on_current_page')) {
    function adt_should_load_on_current_page() {
        $settings = get_option('adt_settings', []);
        
        // Get current URL
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = isset( $_SERVER['HTTP_HOST'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_HOST'] ) ) : '';
        $req  = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
        $current_url = $protocol . '://' . $host . $req;
        
        // Check regex_exclude first (it overrides include)
        if (!empty($settings['regex_exclude'])) {
            $pattern = '#' . $settings['regex_exclude'] . '#';
            $excluded = false;
            try {
                $excluded = (bool) preg_match( $pattern, $current_url );
            } catch ( \Throwable $e ) {
                $excluded = false;
            }
            
            if ($excluded) {
                if (!empty($settings['debug_mode'])) {
                    adt_debug_log('[ADT] Page excluded by regex_exclude: ' . $current_url);
                }
                return false; // Excluded
            }
        }
        
        // If we get here: either no patterns set, or URL passed both checks
        return true;
    }
}

/**
 * Set cookie when IP is excluded (for cache variation)
 */
add_action('init', function() {
    if (function_exists('adt_is_ip_excluded') && adt_is_ip_excluded()) {
        if (!isset($_COOKIE['adt_ip_excluded'])) {
            setcookie('adt_ip_excluded', '1', time() + 86400, '/', '', is_ssl(), false);
            $_COOKIE['adt_ip_excluded'] = '1'; // Set for current request
        }
    } else {
        if (isset($_COOKIE['adt_ip_excluded'])) {
            setcookie('adt_ip_excluded', '', time() - 3600, '/', '', is_ssl(), false);
            unset($_COOKIE['adt_ip_excluded']);
        }
    }
}, 1);

/**
 * Don't cache pages when IP is excluded
 */
add_action('template_redirect', function() {
    if (function_exists('adt_is_ip_excluded') && adt_is_ip_excluded()) {
        nocache_headers();
        
        if (!defined('DONOTCACHEPAGE')) {
            define('DONOTCACHEPAGE', true);
        }
        if (!defined('DONOTMINIFY')) {
            define('DONOTMINIFY', true);
        }
        if (!defined('DONOTCDN')) {
            define('DONOTCDN', true);
        }
        
        // LiteSpeed
        if (function_exists('litespeed_purge_all')) {
            header('X-LiteSpeed-Cache-Control: no-cache');
        }
        
        // WP Rocket
        if (function_exists('rocket_clean_domain')) {
            header('Cache-Control: no-cache, no-store, must-revalidate');
        }
    }
}, 1);


/**
 * Check if current user's IP should be excluded from tracking
 * 
 * @return bool True if IP should be excluded
 */
function adt_is_ip_excluded() {
    $settings = get_option('adt_settings', []);
    
    // Get current IP
    $current_ip = adt_get_client_ip();
    
    if (empty($current_ip) || $current_ip === '0.0.0.0') {
        return false;
    }
    
    
	// Check if auto-exclude admins is enabled
	if (!empty($settings['exclude_admin_ips']) && is_user_logged_in()) {
	    $user = wp_get_current_user();
	    if (in_array('administrator', $user->roles)) {
	        return true;
	    }
	}

	// NEW: Check for IPs saved via "Exclude My Current IP" checkbox
	$excluded_admin_ips = get_option('adt_excluded_admin_ips', []);
	if (is_array($excluded_admin_ips) && in_array($current_ip, $excluded_admin_ips)) {
	    return true;
	}

	// Check manual IP list
	if (empty($settings['exclude_ips'])) {
        return false;
    }
    
    $excluded_ips = array_filter(array_map('trim', explode("\n", $settings['exclude_ips'])));
    
    foreach ($excluded_ips as $excluded) {
        if (empty($excluded)) {
            continue;
        }
        
        // Check for CIDR notation
        if (strpos($excluded, '/') !== false) {
            if (adt_ip_in_cidr($current_ip, $excluded)) {
                return true;
            }
        } else {
            // Exact match
            if ($current_ip === $excluded) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Get client IP address
 * 
 * @return string IP address
 */
if (!function_exists('adt_get_client_ip')) {
    function adt_get_client_ip() {
        $ip_keys = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_REAL_IP',        // Nginx proxy
            'HTTP_X_FORWARDED_FOR',  // Standard proxy
            'HTTP_CLIENT_IP',        // Rare
            'REMOTE_ADDR'            // Fallback
        ];
        
        foreach ($ip_keys as $key) {
            if (!empty($_SERVER[$key])) {
                // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- $key is from a fixed allowlist above.
                $ip = is_string( $_SERVER[ $key ] ) ? sanitize_text_field( wp_unslash( $_SERVER[ $key ] ) ) : '';
                
                // Handle comma-separated IPs (X-Forwarded-For)
                if (strpos($ip, ',') !== false) {
                    $ip_list = explode(',', $ip);
                    $ip = trim($ip_list[0]);
                }
                
                // Validate IP
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        
        return '0.0.0.0';
    }
}

/**
 * Check if IP is in CIDR range
 * 
 * @param string $ip IP address to check
 * @param string $cidr CIDR notation (e.g., 192.168.1.0/24)
 * @return bool True if IP is in range
 */
if (!function_exists('adt_ip_in_cidr')) {
    function adt_ip_in_cidr($ip, $cidr) {
        list($subnet, $mask) = explode('/', $cidr);
        
        // Check if IPv6
        if (strpos($ip, ':') !== false) {
            return adt_ipv6_in_cidr($ip, $cidr);
        }
        
        // IPv4
        $ip_long = ip2long($ip);
        $subnet_long = ip2long($subnet);
        $mask_long = -1 << (32 - (int)$mask);
        $subnet_long &= $mask_long;
        
        return ($ip_long & $mask_long) === $subnet_long;
    }
}

/**
 * Check if IPv6 is in CIDR range
 * 
 * @param string $ip IPv6 address
 * @param string $cidr CIDR notation
 * @return bool True if IP is in range
 */
if (!function_exists('adt_ipv6_in_cidr')) {
    function adt_ipv6_in_cidr($ip, $cidr) {
        list($subnet, $mask) = explode('/', $cidr);
        
        $ip_bin = inet_pton($ip);
        $subnet_bin = inet_pton($subnet);
        
        if ($ip_bin === false || $subnet_bin === false) {
            return false;
        }
        
        $mask = (int)$mask;
        $ip_bits = '';
        $subnet_bits = '';
        
        for ($i = 0; $i < strlen($ip_bin); $i++) {
            $ip_bits .= str_pad(decbin(ord($ip_bin[$i])), 8, '0', STR_PAD_LEFT);
            $subnet_bits .= str_pad(decbin(ord($subnet_bin[$i])), 8, '0', STR_PAD_LEFT);
        }
        
        return substr($ip_bits, 0, $mask) === substr($subnet_bits, 0, $mask);
    }
}
