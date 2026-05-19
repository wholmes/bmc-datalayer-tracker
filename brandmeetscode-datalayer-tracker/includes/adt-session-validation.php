<?php
/**
 * DataLayer Tracker - Session Validation
 * 
 * @package    DataLayer_Tracker
 * @subpackage Core
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
if (!defined('ABSPATH')) exit;

/**
 * ADT Session Validator
 * Handles secure server-side session validation and management
 */
class ADT_Session_Validator {
    
    /**
     * @var string Session validation key prefix
     */
    private $session_prefix = 'adt_session_';
    
    /**
     * @var int Session timeout in seconds (30 minutes default)
     */
    private $session_timeout = 1800;
    
    /**
     * @var int Maximum sessions per user/IP
     */
    private $max_sessions_per_user = 5;
    
    /**
     * @var array Settings from database
     */
    private $settings;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->settings = get_option('adt_settings', []);
        $this->session_timeout = absint($this->settings['session_timeout_minutes'] ?? 30) * 60;
        
        // Register AJAX endpoints
        add_action('wp_ajax_adt_validate_session', [$this, 'ajax_validate_session']);
        add_action('wp_ajax_nopriv_adt_validate_session', [$this, 'ajax_validate_session']);
        
        add_action('wp_ajax_adt_refresh_session', [$this, 'ajax_refresh_session']);
        add_action('wp_ajax_nopriv_adt_refresh_session', [$this, 'ajax_refresh_session']);
        
        // Cleanup old sessions daily
        add_action('adt_cleanup_old_sessions', [$this, 'cleanup_old_sessions']);
        if (!wp_next_scheduled('adt_cleanup_old_sessions')) {
            wp_schedule_event(time(), 'daily', 'adt_cleanup_old_sessions');
        }
    }
    
    /**
     * Generate a cryptographically secure session ID
     * 
     * @return string Session ID
     */
    public function generate_session_id() {
        try {
            // Use random_bytes for cryptographic security
            $bytes = random_bytes(32);
            $session_id = bin2hex($bytes);
            
            // Add timestamp and hash for additional uniqueness
            $timestamp = microtime(true);
            $hash = hash('sha256', $session_id . $timestamp . wp_salt('nonce'));
            
            return substr($hash, 0, 64);
        } catch (Exception $e) {
            // Fallback to wp_generate_password if random_bytes fails
            return hash('sha256', wp_generate_password(64, true, true) . microtime(true));
        }
    }
    
    /**
     * Create a new validated session
     * 
     * @param array $data Session data
     * @return array Session info with server-validated ID
     */
    public function create_session($data = []) {
        // Generate secure session ID
        $session_id = $this->generate_session_id();
        
        // Get client fingerprint
        $fingerprint = $this->get_client_fingerprint();
        
        // Sanitize and validate input data
        $sanitized_data = $this->sanitize_session_data($data);
        
        // Build session record
        $session_data = [
            'session_id' => $session_id,
            'fingerprint' => $fingerprint,
            'created_at' => time(),
            'last_activity' => time(),
            'ip_address' => $this->get_client_ip(),
            'user_agent' => $this->get_sanitized_user_agent(),
            'user_id' => get_current_user_id(),
            'page_url' => $this->get_sanitized_url(),
            'is_validated' => true,
            'data' => $sanitized_data
        ];
        
        // Check rate limiting
        if (!$this->check_session_creation_limit($fingerprint)) {
            return [
                'success' => false,
                'error' => __('Session creation rate limit exceeded.', 'brandmeetscode-datalayer-tracker'),
                'code' => 'rate_limit'
            ];
        }
        
        // Store in database
        $stored = $this->store_session($session_id, $session_data);
        
        if (!$stored) {
            return [
                'success' => false,
                'error' => __('Failed to create session.', 'brandmeetscode-datalayer-tracker'),
                'code' => 'storage_failed'
            ];
        }
        
        // Log session creation if debug mode
        if (!empty($this->settings['debug_mode'])) {
            $this->log_session_event('create', $session_id, [
                'fingerprint' => substr($fingerprint, 0, 16) . '...',
                'user_id' => $session_data['user_id']
            ]);
        }
        
        return [
            'success' => true,
            'session_id' => $session_id,
            'expires_at' => time() + $this->session_timeout,
            'fingerprint' => $fingerprint
        ];
    }
    
    /**
     * Validate an existing session
     * 
     * @param string $session_id Session ID to validate
     * @param array $client_data Client-provided data for validation
     * @return array Validation result
     */
	public function validate_session($session_id, $client_data = []) {
	    // Sanitize session ID
	    $session_id = sanitize_text_field($session_id);
    
	    // UPDATED: Accept both client-generated (29 chars) and server-generated (64 chars) session IDs
	    if (empty($session_id) || strlen($session_id) < 20 || strlen($session_id) > 64) {
	        return [
	            'valid' => false,
	            'error' => 'invalid_format',
	            'message' => __('Invalid session ID format.', 'brandmeetscode-datalayer-tracker')
	        ];
	    }
    
	    // Retrieve session from database
	    $session_data = $this->get_session($session_id);
    
	    if (!$session_data) {
	        return [
	            'valid' => false,
	            'error' => 'not_found',
	            'message' => __('Session not found.', 'brandmeetscode-datalayer-tracker')
	        ];
	    }
        
        // Check if session has expired
        if ($this->is_session_expired($session_data)) {
            $this->delete_session($session_id);
            return [
                'valid' => false,
                'error' => 'expired',
                'message' => __('Session has expired.', 'brandmeetscode-datalayer-tracker'),
                'expired_at' => $session_data['last_activity'] + $this->session_timeout
            ];
        }
        
        // Validate client fingerprint
        $current_fingerprint = $this->get_client_fingerprint();
        if ($session_data['fingerprint'] !== $current_fingerprint) {
            // Suspicious activity - fingerprint mismatch
            $this->log_security_event('fingerprint_mismatch', $session_id, [
                'stored' => substr($session_data['fingerprint'], 0, 16) . '...',
                'current' => substr($current_fingerprint, 0, 16) . '...'
            ]);
            
            // Allow with warning if same user
            if (get_current_user_id() > 0 && get_current_user_id() === $session_data['user_id']) {
                // Same logged-in user, probably changed browser/device
                $this->update_session_fingerprint($session_id, $current_fingerprint);
            } else {
                return [
                    'valid' => false,
                    'error' => 'fingerprint_mismatch',
                    'message' => __('Session validation failed.', 'brandmeetscode-datalayer-tracker')
                ];
            }
        }
        
        // Validate IP address (allow change but log it)
        $current_ip = $this->get_client_ip();
        if ($session_data['ip_address'] !== $current_ip) {
            $this->log_security_event('ip_change', $session_id, [
                'old_ip' => $session_data['ip_address'],
                'new_ip' => $current_ip
            ]);
            
            // Update IP address
            $this->update_session_ip($session_id, $current_ip);
        }
        
        // Update last activity
        $this->touch_session($session_id);
        
        return [
            'valid' => true,
            'session_id' => $session_id,
            'created_at' => $session_data['created_at'],
            'last_activity' => time(),
            'expires_at' => time() + $this->session_timeout,
            'user_id' => $session_data['user_id'],
            'data' => $session_data['data'] ?? []
        ];
    }
    

	/**
	 * AJAX handler for session validation
	 */
	public function ajax_validate_session() {
		if ( ! check_ajax_referer( 'adt_session_nonce', 'nonce', false ) ) {
			wp_send_json_error(
				[
					'error'   => 'invalid_nonce',
					'message' => __( 'Security verification failed.', 'brandmeetscode-datalayer-tracker' ),
				],
				403
			);
			return;
		}

		$session_id = isset( $_POST['session_id'] ) ? sanitize_text_field( wp_unslash( $_POST['session_id'] ) ) : '';
    
	    if (empty($session_id)) {
	        wp_send_json_error([
	            'error' => 'missing_session_id',
	            'message' => __('Session ID is required.', 'brandmeetscode-datalayer-tracker')
	        ], 400);
	        return;
	    }
    
	    // Check if session exists
	    $session_data = $this->get_session($session_id);
    
	    if (!$session_data) {
	        // Session doesn't exist on server - register client-generated session
	        $session_record = [
	            'session_id' => $session_id,
	            'fingerprint' => $this->get_client_fingerprint(),
	            'created_at' => time(),
	            'last_activity' => time(),
	            'ip_address' => $this->get_client_ip(),
	            'user_agent' => $this->get_sanitized_user_agent(),
	            'user_id' => get_current_user_id(),
	            'page_url' => $this->get_sanitized_url(),
	            'is_validated' => true,
	            'client_generated' => true,
	            'data' => []
	        ];
        
	        $stored = $this->store_session($session_id, $session_record);
        
	        if ($stored) {
	            // Log registration if debug mode
	            if (!empty($this->settings['debug_mode'])) {
	                $this->log_session_event('register_client_session', $session_id, [
	                    'user_id' => get_current_user_id()
	                ]);
	            }
            
	            wp_send_json_success([
	                'valid' => true,
	                'session_id' => $session_id,
	                'created_at' => time(),
	                'last_activity' => time(),
	                'expires_at' => time() + $this->session_timeout,
	                'user_id' => get_current_user_id(),
	                'registered' => true,
	                'data' => []
	            ]);
	            return;
	        } else {
	            wp_send_json_error([
	                'error' => 'registration_failed',
	                'message' => __('Failed to register session.', 'brandmeetscode-datalayer-tracker')
	            ], 500);
	            return;
	        }
	    }
    
	    // Session exists - validate it normally
	    $result = $this->validate_session($session_id);
    
	    if ($result['valid']) {
	        wp_send_json_success($result);
	    } else {
	        wp_send_json_error($result, 401);
	    }
	}
    
	/**
	 * AJAX handler for session refresh
	 */
	public function ajax_refresh_session() {
		if ( ! check_ajax_referer( 'adt_session_nonce', 'nonce', false ) ) {
			wp_send_json_error(
				[
					'error'   => 'invalid_nonce',
					'message' => __( 'Security verification failed.', 'brandmeetscode-datalayer-tracker' ),
				],
				403
			);
			return;
		}

		$session_id = isset( $_POST['session_id'] ) ? sanitize_text_field( wp_unslash( $_POST['session_id'] ) ) : '';
    
	    if (empty($session_id)) {
	        wp_send_json_error([
	            'error' => 'missing_session_id',
	            'message' => __('Session ID is required.', 'brandmeetscode-datalayer-tracker')
	        ], 400);
	        return;
	    }
    
	    // Validate and refresh
	    $result = $this->validate_session($session_id);
    
	    if ($result['valid']) {
	        // Session is valid and was just refreshed
	        wp_send_json_success([
	            'refreshed' => true,
	            'expires_at' => $result['expires_at'],
	            'session_id' => $session_id
	        ]);
	    } else {
	        // Session invalid, create new one
	        $new_session = $this->create_session();
        
	        if ($new_session['success']) {
	            wp_send_json_success([
	                'refreshed' => false,
	                'new_session' => true,
	                'session_id' => $new_session['session_id'],
	                'expires_at' => $new_session['expires_at']
	            ]);
	        } else {
	            wp_send_json_error($new_session, 500);
	        }
	    }
	}
		   
    /**
     * Get client fingerprint for validation
     * 
     * @return string Fingerprint hash
     */
    private function get_client_fingerprint() {
        $components = [
            $this->get_client_ip(),
            isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '',
            isset( $_SERVER['HTTP_ACCEPT_LANGUAGE'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_ACCEPT_LANGUAGE'] ) ) : '',
            isset( $_SERVER['HTTP_ACCEPT_ENCODING'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_ACCEPT_ENCODING'] ) ) : '',
        ];
        
        return hash('sha256', implode('|', $components));
    }
    
    /**
     * Get sanitized client IP address
     * 
     * @return string IP address
     */
    private function get_client_ip() {
        $ip = '';
        
        // Check various headers (in order of reliability)
        $ip_keys = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_REAL_IP',        // Nginx proxy
            'HTTP_X_FORWARDED_FOR',  // Standard proxy
            'HTTP_CLIENT_IP',        // Rare
            'REMOTE_ADDR'            // Fallback
        ];
        
        foreach ($ip_keys as $key) {
            if ( ! empty( $_SERVER[ $key ] ) ) {
                // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- $key is from a fixed allowlist above.
                $raw = is_string( $_SERVER[ $key ] ) ? wp_unslash( $_SERVER[ $key ] ) : '';
                $ip  = sanitize_text_field( $raw );
                break;
            }
        }
        
        // Handle comma-separated IPs (X-Forwarded-For)
        if (strpos($ip, ',') !== false) {
            $ip_list = explode(',', $ip);
            $ip = trim($ip_list[0]);
        }
        
        // Validate and return
        $validated_ip = filter_var(trim($ip), FILTER_VALIDATE_IP);
        return $validated_ip ? $validated_ip : '0.0.0.0';
    }
    
    /**
     * Get sanitized user agent
     * 
     * @return string User agent
     */
    private function get_sanitized_user_agent() {
        // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Value passed to sanitize_text_field() immediately.
        $ua = isset( $_SERVER['HTTP_USER_AGENT'] ) ? wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) : '';
        return substr( sanitize_text_field( $ua ), 0, 255 );
    }
    
    /**
     * Get sanitized current URL
     * 
     * @return string URL
     */
    private function get_sanitized_url() {
        if ( isset( $_SERVER['HTTP_REFERER'] ) ) {
            return esc_url_raw( wp_unslash( $_SERVER['HTTP_REFERER'] ) );
        }
        return home_url(add_query_arg([]));
    }
    
    /**
     * Sanitize session data
     * 
     * @param array $data Raw session data
     * @return array Sanitized data
     */
    private function sanitize_session_data($data) {
        if (!is_array($data)) {
            return [];
        }
        
        $sanitized = [];
        
        foreach ($data as $key => $value) {
            $safe_key = sanitize_key($key);
            
            if (is_array($value)) {
                $sanitized[$safe_key] = $this->sanitize_session_data($value);
            } elseif (is_numeric($value)) {
                $sanitized[$safe_key] = $value;
            } else {
                $sanitized[$safe_key] = sanitize_text_field($value);
            }
        }
        
        return $sanitized;
    }
    
    /**
     * Store session in database
     * 
     * @param string $session_id Session ID
     * @param array $data Session data
     * @return bool Success
     */
    private function store_session($session_id, $data) {
        $transient_key = $this->session_prefix . $session_id;
        return set_transient($transient_key, $data, $this->session_timeout);
    }
    
    /**
     * Retrieve session from database
     * 
     * @param string $session_id Session ID
     * @return array|false Session data or false
     */
    private function get_session($session_id) {
        $transient_key = $this->session_prefix . $session_id;
        return get_transient($transient_key);
    }
    
    /**
     * Delete session from database
     * 
     * @param string $session_id Session ID
     * @return bool Success
     */
    private function delete_session($session_id) {
        $transient_key = $this->session_prefix . $session_id;
        return delete_transient($transient_key);
    }
    
    /**
     * Update session last activity timestamp
     * 
     * @param string $session_id Session ID
     * @return bool Success
     */
    private function touch_session($session_id) {
        $session_data = $this->get_session($session_id);
        
        if (!$session_data) {
            return false;
        }
        
        $session_data['last_activity'] = time();
        return $this->store_session($session_id, $session_data);
    }
    
    /**
     * Check if session has expired
     * 
     * @param array $session_data Session data
     * @return bool True if expired
     */
    private function is_session_expired($session_data) {
        $last_activity = $session_data['last_activity'] ?? 0;
        return (time() - $last_activity) > $this->session_timeout;
    }
    
    /**
     * Update session fingerprint (when user changes device/browser)
     * 
     * @param string $session_id Session ID
     * @param string $new_fingerprint New fingerprint
     * @return bool Success
     */
    private function update_session_fingerprint($session_id, $new_fingerprint) {
        $session_data = $this->get_session($session_id);
        
        if (!$session_data) {
            return false;
        }
        
        $session_data['fingerprint'] = $new_fingerprint;
        $session_data['fingerprint_updated_at'] = time();
        
        return $this->store_session($session_id, $session_data);
    }
    
    /**
     * Update session IP address
     * 
     * @param string $session_id Session ID
     * @param string $new_ip New IP address
     * @return bool Success
     */
    private function update_session_ip($session_id, $new_ip) {
        $session_data = $this->get_session($session_id);
        
        if (!$session_data) {
            return false;
        }
        
        $session_data['ip_address'] = $new_ip;
        $session_data['ip_updated_at'] = time();
        
        return $this->store_session($session_id, $session_data);
    }
    
    /**
     * Check session creation rate limit
     * 
     * @param string $fingerprint Client fingerprint
     * @return bool True if within limit
     */
    private function check_session_creation_limit($fingerprint) {
        $limit_key = 'adt_session_limit_' . substr(md5($fingerprint), 0, 16);
        $count = get_transient($limit_key);
        
        if ($count === false) {
            // First session in this period
            set_transient($limit_key, 1, 300); // 5 minute window
            return true;
        }
        
        // Allow max 10 sessions per 5 minutes per fingerprint
        if ($count >= 10) {
            return false;
        }
        
        set_transient($limit_key, $count + 1, 300);
        return true;
    }
    
    /**
     * Cleanup old/expired sessions
     */
    public function cleanup_old_sessions() {
        global $wpdb;
        
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Expired session transients cleanup.
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$wpdb->options} 
             WHERE option_name LIKE %s 
             AND option_value < %d",
            $wpdb->esc_like('_transient_timeout_' . $this->session_prefix) . '%',
            time()
        ));
        
        // Log cleanup if debug mode
        if (!empty($this->settings['debug_mode'])) {
            $this->log_session_event('cleanup', 'system', [
                'rows_affected' => $wpdb->rows_affected
            ]);
        }
    }
    
    /**
     * Log session event
     * 
     * @param string $event_type Event type
     * @param string $session_id Session ID
     * @param array $context Additional context
     */
    private function log_session_event($event_type, $session_id, $context = []) {
        if (!defined('WP_DEBUG_LOG') || !WP_DEBUG_LOG) {
            return;
        }
        
        $log_entry = [
            'event' => $event_type,
            'session_id' => substr($session_id, 0, 16) . '...',
            'timestamp' => current_time('mysql'),
            'context' => $context
        ];
        
        // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
        error_log('[ADT Session] ' . wp_json_encode($log_entry));
    }
    
    /**
     * Log security event
     * 
     * @param string $event_type Event type
     * @param string $session_id Session ID
     * @param array $context Additional context
     */
    private function log_security_event($event_type, $session_id, $context = []) {
        if (!defined('WP_DEBUG_LOG') || !WP_DEBUG_LOG) {
            return;
        }
        
        $log_entry = [
            'security_event' => $event_type,
            'session_id' => substr($session_id, 0, 16) . '...',
            'ip' => $this->get_client_ip(),
            'timestamp' => current_time('mysql'),
            'context' => $context
        ];
        
        // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
        error_log('[ADT Security] ' . wp_json_encode($log_entry));
    }
}

/**
 * Initialize the session validator
 */
function adt_init_session_validator() {
    global $adt_session_validator;
    $adt_session_validator = new ADT_Session_Validator();
}
add_action('init', 'adt_init_session_validator', 5);

/**
 * Helper function to validate a session
 * 
 * @param string $session_id Session ID to validate
 * @return array Validation result
 */
function adt_validate_session($session_id) {
    global $adt_session_validator;
    
    if (!$adt_session_validator) {
        return [
            'valid' => false,
            'error' => 'validator_not_initialized'
        ];
    }
    
    return $adt_session_validator->validate_session($session_id);
}

/**
 * Helper function to create a new session
 * 
 * @param array $data Optional session data
 * @return array Session creation result
 */
function adt_create_session($data = []) {
    global $adt_session_validator;
    
    if (!$adt_session_validator) {
        return [
            'success' => false,
            'error' => 'validator_not_initialized'
        ];
    }
    
    return $adt_session_validator->create_session($data);
}