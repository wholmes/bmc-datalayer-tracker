<?php
/**
 * DataLayer Tracker - Settings Page
 * 
 * @package    DataLayer_Tracker
 * @subpackage Admin
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */

defined('ABSPATH') || exit;

// Security check
if (!current_user_can('manage_options')) {
    wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'brandmeetscode-datalayer-tracker'));
}



// FORCE UPDATE DATABASE NOW (ADD THIS HERE)
$current = get_option('adt_settings', []);
// Add nonce verification
if ( isset( $_POST['adt_restore_settings_nonce'] ) &&
    wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['adt_restore_settings_nonce'] ) ), 'adt_restore_settings' ) &&
    current_user_can( 'manage_options' ) ) {
    $current = get_option('adt_settings', []);
    if (isset($current['include_page_type']) && $current['include_page_type'] === 0) {
        $correct_defaults = adt_get_default_settings();
        update_option('adt_settings', $correct_defaults);
        
        wp_safe_redirect(add_query_arg([
            'settings_restored' => '1',
            '_wpnonce' => wp_create_nonce('adt_settings_restored')
        ], admin_url('admin.php?page=adt-settings')));
        exit;
    }
}

// Show success message after redirect
if (isset($_GET['settings_restored']) && sanitize_text_field(wp_unslash($_GET['settings_restored'])) === '1') {
    echo '<div class="notice notice-success is-dismissible"><p><strong>' . 
         esc_html__('✅ Settings have been restored! All checkboxes should now show correctly.', 'brandmeetscode-datalayer-tracker') . 
         '</strong></p></div>';
}

// âœ… Show admin notices
settings_errors('adt_settings');

// âœ… Get defaults and settings
$defaults = adt_get_default_settings();
$settings = wp_parse_args(
    get_option('adt_settings', []),
    $defaults
);

// IMPORTANT Reload settings after form save to get fresh values
// This ensures tab visibility reflects the just-saved settings
if (isset($_GET['settings-updated']) && $_GET['settings-updated'] === '1') {
    wp_cache_delete('adt_settings', 'options');
    wp_cache_delete('alloptions', 'options');
    // Reload settings from database to get fresh values
    $settings = wp_parse_args(
        get_option('adt_settings', []),
        adt_get_default_settings()
    );
}

/**
 * Helper to render a field row.
 * Accepts either simple string label or a config array.
 */
function adt_render_setting_field( $key, $config, $value ) {
    if ( is_string( $config ) ) {
        $config = [
            'label'   => $config,
            'type'    => 'checkbox',
            'default' => 0,
        ];
    }

    $label       = $config['label'] ?? $key;
    $type        = $config['type'] ?? 'checkbox';
    $description = $config['description'] ?? '';
    $input_name  = "adt_settings[$key]";
    $input_id    = "adt_settings_$key";
    ?>
    <div class="adt-setting-row">
        <label for="<?php echo esc_attr( $input_id ); ?>">
            <strong><?php echo esc_html( $label ); ?></strong>
        </label><br/>

        <?php
        switch ( $type ) {
            case 'number':
            case 'text':
                printf(
                    '<textarea id="%s" name="%s" data-adt-setting="%s" rows="6" style="width:100%%;font-family:monospace;">%s</textarea>',
                    esc_attr( $input_id ),
                    esc_attr( $input_name ),
                    esc_attr( $key ),
                    esc_textarea( $value )
                );

                if ( $key === 'custom_events_json' ) {
                    // Generate unique nonce for this field
                    $json_nonce = wp_create_nonce('adt_json_validator_' . get_current_user_id());
                    
                    echo '
                    <div id="adt-gtm-preview-block" class="adt-gtm-json-preview">
                        <div id="json-validator-status" style="font-size:12px;margin-top:4px;"></div>
                        <div style="display:flex;gap:8px;margin-top:4px;">
                            <button type="button" id="copy-json-btn" class="button">' . esc_html__('Copy JSON', 'brandmeetscode-datalayer-tracker') . '</button>
                            <button type="button" id="toggle-preview-btn" class="button">' . esc_html__('Collapse Preview', 'brandmeetscode-datalayer-tracker') . '</button>
                        </div>
                        <pre id="json-preview" style="display:block;max-height:200px;overflow:auto;background:#f9f9f9;padding:8px;border:1px solid #ccc;font-family:monospace;font-size:12px;margin-top:6px;"></pre>
                    </div>';
                    $adt_json_validator_js = '(function() {
                        "use strict";
                        
                        document.addEventListener("DOMContentLoaded", function () {
                            const textarea = document.querySelector("[data-adt-setting=\"custom_events_json\"]");
                            const status   = document.getElementById("json-validator-status");
                            const preview  = document.getElementById("json-preview");
                            const copyBtn  = document.getElementById("copy-json-btn");
                            const toggleBtn = document.getElementById("toggle-preview-btn");

                            if (!textarea || !status || !preview || !copyBtn || !toggleBtn) {
                                return; // Elements not found, exit safely
                            }

                            function sanitizeText(text) {
                                const div = document.createElement("div");
                                div.textContent = text;
                                return div.innerHTML;
                            }

                            function validateJSON () {
                                const val = textarea.value.trim();
                                if (!val) {
                                    status.textContent = "";
                                    preview.style.display = "none";
                                    toggleBtn.style.display = "none";
                                    copyBtn.style.display = "none";
                                    return;
                                }
                                
                                try {
                                    const parsed = JSON.parse(val);
                                    
                                    // Validate structure - must be array of objects with "event" property
                                    if (!Array.isArray(parsed)) {
                                        throw new Error("' . esc_js(__('JSON must be an array of event objects', 'brandmeetscode-datalayer-tracker')) . '");
                                    }
                                    
                                    // Validate each event object
                                    for (let i = 0; i < parsed.length; i++) {
                                        if (typeof parsed[i] !== "object" || parsed[i] === null) {
                                            throw new Error("' . esc_js(__('Item', 'brandmeetscode-datalayer-tracker')) . ' " + i + " ' . esc_js(__('must be an object', 'brandmeetscode-datalayer-tracker')) . '");
                                        }
                                        if (!parsed[i].event || typeof parsed[i].event !== "string") {
                                            throw new Error("' . esc_js(__('Item', 'brandmeetscode-datalayer-tracker')) . ' " + i + " ' . esc_js(__('must have an \'event\' property', 'brandmeetscode-datalayer-tracker')) . '");
                                        }
                                    }
                                    
                                    status.textContent = "' . esc_js(__('✓ Valid JSON', 'brandmeetscode-datalayer-tracker')) . '";
                                    status.style.color = "#1e8c3a";
                                    
                                    // Safely stringify and display
                                    if (typeof window.ADTUtils !== "undefined" && typeof window.ADTUtils.safeJSONStringify === "function") {
                                        preview.textContent = window.ADTUtils.safeJSONStringify(parsed, null, 2);
                                    } else {
                                        preview.textContent = JSON.stringify(parsed, null, 2);
                                    }
                                    
                                    preview.style.display = "block";
                                    toggleBtn.style.display = "inline-block";
                                    copyBtn.style.display = "inline-block";
                                } catch (e) {
                                    const errorMsg = e.message || "' . esc_js(__('Unknown error', 'brandmeetscode-datalayer-tracker')) . '";
                                    status.textContent = "' . esc_js(__('⚠ Invalid JSON: ', 'brandmeetscode-datalayer-tracker')) . '" + sanitizeText(errorMsg);
                                    status.style.color = "#b30000";
                                    preview.style.display = "none";
                                    toggleBtn.style.display = "none";
                                    copyBtn.style.display = "none";
                                }
                            }

                            textarea.addEventListener("input", validateJSON);
                            validateJSON();

                            copyBtn.addEventListener("click", function() {
                                const textToCopy = preview.textContent;
                                
                                if (navigator.clipboard && navigator.clipboard.writeText) {
                                    navigator.clipboard.writeText(textToCopy)
                                        .then(function() {
                                            copyBtn.textContent = "' . esc_js(__('Copied!', 'brandmeetscode-datalayer-tracker')) . '";
                                            setTimeout(function() { 
                                                copyBtn.textContent = "' . esc_js(__('Copy JSON', 'brandmeetscode-datalayer-tracker')) . '"; 
                                            }, 1500);
                                        })
                                        .catch(function() {
                                            copyBtn.textContent = "' . esc_js(__('Copy failed', 'brandmeetscode-datalayer-tracker')) . '";
                                            setTimeout(function() { 
                                                copyBtn.textContent = "' . esc_js(__('Copy JSON', 'brandmeetscode-datalayer-tracker')) . '"; 
                                            }, 1500);
                                        });
                                } else {
                                    // Fallback for older browsers
                                    const tempTextarea = document.createElement("textarea");
                                    tempTextarea.value = textToCopy;
                                    tempTextarea.style.position = "fixed";
                                    tempTextarea.style.left = "-9999px";
                                    document.body.appendChild(tempTextarea);
                                    tempTextarea.select();
                                    
                                    try {
                                        document.execCommand("copy");
                                        copyBtn.textContent = "' . esc_js(__('Copied!', 'brandmeetscode-datalayer-tracker')) . '";
                                    } catch (err) {
                                        copyBtn.textContent = "' . esc_js(__('Copy failed', 'brandmeetscode-datalayer-tracker')) . '";
                                    }
                                    
                                    document.body.removeChild(tempTextarea);
                                    setTimeout(function() { 
                                        copyBtn.textContent = "' . esc_js(__('Copy JSON', 'brandmeetscode-datalayer-tracker')) . '"; 
                                    }, 1500);
                                }
                            });

                            toggleBtn.addEventListener("click", function() {
                                const isHidden = preview.style.display === "none";
                                preview.style.display = isHidden ? "block" : "none";
                                toggleBtn.textContent = isHidden 
                                    ? "' . esc_js(__('Collapse Preview', 'brandmeetscode-datalayer-tracker')) . '"
                                    : "' . esc_js(__('Expand Preview', 'brandmeetscode-datalayer-tracker')) . '";
                            });

                        });
                    })();';
                    wp_add_inline_script( 'adt-utils', $adt_json_validator_js );
                    echo '
                    <details style="margin-top:12px;padding:12px;background:#f9f9f9;border-left:3px solid #2271b1;border-radius:4px;">
                        <summary style="cursor:pointer;font-weight:600;color:#2271b1;user-select:none;">
                            📖 ' . esc_html__('Example Custom Events', 'brandmeetscode-datalayer-tracker') . '
                        </summary>
                        <div style="margin-top:12px;font-size:13px;line-height:1.6;">
                            <p style="margin-top:0;color:#666;">' . esc_html__('Custom events are automatically pushed to the dataLayer on page load:', 'brandmeetscode-datalayer-tracker') . '</p>
                            <pre style="background:#fff;padding:12px;border:1px solid #ddd;overflow-x:auto;font-size:12px;margin:8px 0;">' . esc_html('[
  {
    "event": "user_registered",
    "user_type": "subscriber",
    "registration_source": "homepage"
  },
  {
    "event": "content_download",
    "file_type": "pdf",
    "category": "whitepaper"
  },
  {
    "event": "custom_milestone",
    "milestone_type": "engagement",
    "threshold": 60
  }
]') . '</pre>
                            <p style="margin-bottom:0;font-size:12px;color:#666;">
                                <strong>' . esc_html__('Tip:', 'brandmeetscode-datalayer-tracker') . '</strong> ' . esc_html__('Each event object must have an "event" property. Add any additional parameters you need.', 'brandmeetscode-datalayer-tracker') . '
                            </p>
                        </div>
                    </details>';
                }

                if ( $key === 'pixel_event_map_json' ) {
                    echo '
                    <details style="margin-top:12px;padding:12px;background:#f9f9f9;border-left:3px solid #2271b1;border-radius:4px;">
                        <summary style="cursor:pointer;font-weight:600;color:#2271b1;user-select:none;">
                            📖 ' . esc_html__('Pixel Event Mapping Guide', 'brandmeetscode-datalayer-tracker') . '
                        </summary>
                        <div style="margin-top:12px;font-size:13px;line-height:1.6;">
                            <p style="margin-top:0;color:#666;">' . esc_html__('Map dataLayer events to specific advertising pixel platforms:', 'brandmeetscode-datalayer-tracker') . '</p>

                            <p style="margin:12px 0 8px;font-weight:600;">' . esc_html__('Available Platforms:', 'brandmeetscode-datalayer-tracker') . '</p>
                            <div style="background:#fff;padding:8px 12px;border:1px solid #ddd;border-radius:3px;font-family:monospace;font-size:12px;">
                                <code>meta</code>, <code>google</code>, <code>tiktok</code>, <code>linkedin</code>, <code>x</code>, <code>pinterest</code>, <code>reddit</code>, <code>snapchat</code>
                            </div>

                            <p style="margin:12px 0 8px;font-weight:600;">' . esc_html__('Example Mapping:', 'brandmeetscode-datalayer-tracker') . '</p>
                            <pre style="background:#fff;padding:12px;border:1px solid #ddd;overflow-x:auto;font-size:12px;margin:8px 0;">' . esc_html('{
  "page_view": ["meta", "google"],
  "form_submit": ["meta", "tiktok", "google", "linkedin"],
  "add_to_cart": ["meta", "google", "tiktok"],
  "purchase": ["meta", "google", "tiktok", "linkedin"],
  "video_complete": ["meta", "tiktok"]
}') . '</pre>
                            <p style="margin-bottom:0;font-size:12px;color:#666;">
                                <strong>' . esc_html__('Tip:', 'brandmeetscode-datalayer-tracker') . '</strong> ' . esc_html__('Only events listed here will fire to pixels. Unlisted events will be ignored by the Pixel Manager.', 'brandmeetscode-datalayer-tracker') . '
                            </p>
                        </div>
                    </details>';
                }
                break;
                
            case 'custom':
                // Custom field types - call the callback function
                if (isset($config['callback']) && is_callable($config['callback'])) {
                    call_user_func($config['callback'], $config);
                }
                break;
                
            case 'checkbox':
            default:
                // Add hidden field to ensure unchecked boxes send '0'
                printf(
                    '<input type="hidden" name="%s" value="0" />',
                    esc_attr( $input_name )
                );

                // Normalize value to handle both integer 1 and string "1"
                $is_checked = ( $value == 1 || $value === '1' || $value === true );

                printf(
                    '<input type="checkbox" id="%s" name="%s" value="1" %s data-adt-setting="%s" />',
                    esc_attr( $input_id ),
                    esc_attr( $input_name ),
                    $is_checked ? 'checked' : '',
                    esc_attr( $key )
                );
                break;
        }

        if ( $description ) {
            echo '<p class="description">' . esc_html( $description ) . '</p>';
        }
        ?>
    </div>
    <?php
}

/**
 * @deprecated 1.2.6 Use adt_render_setting_field().
 * @param string       $key    Setting key.
 * @param array|string $config Field config.
 * @param mixed        $value  Current value.
 * @return void
 */
function render_adt_setting_field( $key, $config, $value ) {
	adt_render_setting_field( $key, $config, $value );
}

// ------------------------------------
// SECTION DEFINITIONS (unchanged)
// ------------------------------------
$sections = [
    'adt_page_context'          => esc_html__('Page Context', 'brandmeetscode-datalayer-tracker'),
    'adt_device'                => esc_html__('Device Info', 'brandmeetscode-datalayer-tracker'),
    'adt_user_info'             => esc_html__('User & Identity', 'brandmeetscode-datalayer-tracker'),
    'adt_metadata'              => esc_html__('Metadata Tracking', 'brandmeetscode-datalayer-tracker'),
    'adt_behavior'              => esc_html__('Interaction Tracking', 'brandmeetscode-datalayer-tracker'),
    'adt_engagement'            => esc_html__('Engagement Signals', 'brandmeetscode-datalayer-tracker'),
    'adt_integrations'          => esc_html__('Integrations', 'brandmeetscode-datalayer-tracker'),
    'adt_advanced'              => esc_html__('Advanced Options', 'brandmeetscode-datalayer-tracker'),
    'adt_general'               => esc_html__('Debug Options', 'brandmeetscode-datalayer-tracker'),
];

$adt_brand_logo_url = ADT_PLUGIN_URL . 'logo.svg';
$adt_brand_logo_ver = file_exists( ADT_PLUGIN_DIR . 'logo.svg' ) ? (string) filemtime( ADT_PLUGIN_DIR . 'logo.svg' ) : '1';

?>


<div class="wrap">
	<!-- Empty h1 for WordPress admin notices to latch onto -->
	<h1 style="display: none; letter-spacing: -0.5px;"></h1>
	
	<h2 style="padding: 0; margin: 0 0 .5em 0; font-size: 23px; font-weight: 400; line-height: 1.3;">
		<?php echo esc_html__('DataLayer Tracker Settings', 'brandmeetscode-datalayer-tracker'); ?>
	</h2>
	<div id="adt-toast" class="adt-toast"></div>
	
<?php
// Feature Carousel
if (current_user_can('manage_options') && function_exists('adt_render_feature_carousel')) {
    adt_render_feature_carousel();
}

// CMP Status Panel - render in content, not via admin_notices
if (current_user_can('manage_options') && function_exists('adt_render_cmp_status_panel')) {
    adt_render_cmp_status_panel();
}
?>
		
		<?php
		// Compute active tab safely (?tab= bypass + client JS must honor same rules — see footer script).
		$active_tab = 'adt_page_context';
		if ( isset( $_GET['tab'] ) && is_string( $_GET['tab'] ) ) {
		    $requested = sanitize_text_field( wp_unslash( $_GET['tab'] ) );
		    if ( array_key_exists( $requested, $sections ) ) {
		        $active_tab = $requested;
		    }
		}
		?>

<?php /* Styles moved to assets/css/adt-admin.css, loaded via admin_enqueue_scripts. */ ?>

<?php
// Complete icon helper function for all tabs
function adt_get_tab_icon($section_id) {
    $icons = [
        // Page Context - Document with data points
        'adt_page_context' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2v6h6M10 13h4M10 17h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="13" r="1" fill="currentColor"/><circle cx="8" cy="17" r="1" fill="currentColor"/></svg>',
        
        // Device Info - Monitor with metrics
        'adt_device' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M7 8h10M7 11h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
        
        // User & Identity - User profile with ID badge
        'adt_user_info' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="16" cy="6" r="2" fill="currentColor"/></svg>',
        
        // Metadata Tracking - Tags with data
        'adt_metadata' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>',
        
        // Interaction Tracking (Behavior) - Activity graph with points
        'adt_behavior' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3v18h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 14l3-3 4 4 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="14" r="1.5" fill="currentColor"/><circle cx="10" cy="11" r="1.5" fill="currentColor"/><circle cx="14" cy="15" r="1.5" fill="currentColor"/><circle cx="20" cy="9" r="1.5" fill="currentColor"/></svg>',
        
        // Engagement Signals - Pulse/heartbeat with data
        'adt_engagement' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        
        // Integrations - Connected nodes/puzzle pieces
        'adt_integrations' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="6" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="18" cy="6" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="18" cy="18" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="18" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M8 7l2.5 2.5M16 7l-2.5 2.5M16 17l-2.5-2.5M8 17l2.5-2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
        
        // Advanced Options - Gear with data points
        'adt_advanced' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M12 1v3m0 16v3M4.22 4.22l2.12 2.12m11.32 11.32l2.12 2.12M1 12h3m16 0h3M4.22 19.78l2.12-2.12m11.32-11.32l2.12-2.12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
        
        // Debug Options (General) - Code/terminal with metrics
        'adt_general' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 4l-4 8 4 8M16 4l4 8-4 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 8v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>',
        
    ];
    
    return $icons[$section_id] ?? '';
}
?>

<div class="adt-settings-wrapper">
    <!-- Left Sidebar Menu -->
    <div class="adt-sidebar">
        <nav class="adt-sidebar-menu">
			<?php foreach ( $sections as $id => $title ) : 
		    $is_active = ( $id === $active_tab );
		    $tab_url = add_query_arg( 'tab', $id, admin_url('admin.php?page=adt-settings') );
		?>
			    <a href="<?php echo esc_url( $tab_url ); ?>" 
			       class="adt-menu-item<?php echo esc_attr( $is_active ? ' active' : '' ); ?>"
			       data-target="section-<?php echo esc_attr( $id ); ?>">
			       <span class="adt-tab-icon" aria-hidden="true"><?php echo wp_kses( adt_get_tab_icon( $id ), adt_get_inline_svg_allowed_html() ); ?></span>
                    <span><?php echo esc_html( $title ); ?></span>
                </a>
            <?php endforeach; ?>
	        </nav>
    </div>

   <div class="adt-content-area">
    <form method="post" action="options.php" style="background: #fff; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <?php settings_fields( 'adt_settings_group' ); ?>
        <?php foreach ( $sections as $id => $title ) : ?>
            <div id="section-<?php echo esc_attr( $id ); ?>" class="adt-tab-content<?php echo esc_attr( $id === $active_tab ? ' active' : '' ); ?>">
                
                <!-- Section Header -->
                <div class="adt-section-header" style="padding: 24px 24px 16px; border-bottom: 2px solid #f0f0f0; background: linear-gradient(to bottom, #fafafa 0%, #fff 100%);">
                    <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #23282d; display: flex; align-items: center; gap: 8px;">
                        <span class="adt-tab-icon" aria-hidden="true"><?php echo wp_kses( adt_get_tab_icon( $id ), adt_get_inline_svg_allowed_html() ); ?></span>
                        <?php echo esc_html( $title ); ?>
                    </h2>
                </div>
                
                <!-- Section Content -->
                <div style="padding: 24px;">
                    <table class="form-table" role="presentation">
                        <?php do_settings_fields( 'adt-settings', $id ); ?>
                    </table>
                </div>
                
            </div>
        <?php endforeach; ?>
    </form>
  </div><!-- .adt-content-area -->

<div class="adt-settings-page-bottom">

<?php ob_start(); ?>
document.addEventListener('DOMContentLoaded', function() {
    const menuItems = document.querySelectorAll('.adt-menu-item');
    const TAB_KEY = 'adt_active_tab';

    const showTab = (targetId) => {
        menuItems.forEach(item => {
            item.classList.toggle('active', item.dataset.target === targetId);
        });
        
        document.querySelectorAll('.adt-tab-content').forEach(section => {
            section.classList.toggle('active', section.id === targetId);
        });
        
        localStorage.setItem(TAB_KEY, targetId);
    };
    
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (!item.classList.contains('locked')) {
                const targetId = item.dataset.target;
                showTab(targetId);
                
                const tabName = targetId.replace('section-', '');
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('tab', tabName);
                window.history.pushState({tab: tabName}, '', newUrl);
            }
        });
    });
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.tab) {
            showTab('section-' + e.state.tab);
        }
    });
    
	// Check URL parameter first, respect PHP's default, then fallback to localStorage
	const urlParams = new URLSearchParams(window.location.search);
	const urlTab = urlParams.get('tab');

	if (urlTab) {
	    showTab('section-' + urlTab);
	} else {
	    // No URL parameter — sync menu to PHP-rendered active tab
	    const phpActiveTab = document.querySelector('.adt-tab-content.active');
	    if (phpActiveTab) {
	        const phpTabId = phpActiveTab.id;
	        localStorage.setItem(TAB_KEY, phpTabId);
	        showTab(phpTabId);
	    } else {
	        const lastTab = localStorage.getItem(TAB_KEY);
	        if (lastTab) {
	            showTab(lastTab);
	        }
	    }
	}
    
    // Handle all dismissible notices
    document.querySelectorAll('.adt-admin-notice.is-dismissible .notice-dismiss').forEach(btn => {
        btn.addEventListener('click', function() {
            const notice = this.closest('.adt-admin-notice');
            const noticeType = notice?.dataset.noticeType;
            
            if (noticeType) {
                fetch(ajaxurl, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    body: new URLSearchParams({
                        action: 'adt_dismiss_notice',
                        which: noticeType,
                        security: '<?php echo esc_js( wp_create_nonce( 'adt_admin_action' ) ); ?>'
                    })
                }).then(response => response.json())
                  .then(data => {
                      console.log('Dismiss response:', data);
                      if (data.success) {
                          console.log('Notice dismissed:', noticeType);
                      }
                  });
            }
        });
    });
});
<?php wp_add_inline_script( 'adt-utils', ob_get_clean() ); ?>


    <!-- SETTINGS FORM -->
<hr style="margin:2em 0;"/>

<a href="#" id="adt-toggle-all-boxes" style="display: inline-flex; align-items: center; gap: 4px; text-decoration: none; color: #2271b1; font-size: 13px; font-weight: 500; margin-bottom:10px;">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.2s;">
        <polyline points="6 9 12 15 18 9"/>
    </svg>
    <span><?php echo esc_html__('Expand All', 'brandmeetscode-datalayer-tracker'); ?></span>
</a>

<!-- 1. Import / Export -->
<div id="adt-import-export-postbox" class="postbox closed">
    <h2 class="hndle" role="button" tabindex="0" aria-expanded="false">
        <span class="toggle-indicator" aria-hidden="true"></span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <?php echo esc_html__('Import / Export Settings', 'brandmeetscode-datalayer-tracker'); ?>
    </h2>
    <div class="inside">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px;">
                
                <!-- Export Section -->
                <div style="padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #bae6fd; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0369a1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: #0369a1;">
                            <?php echo esc_html__('Export Settings', 'brandmeetscode-datalayer-tracker'); ?>
                        </h3>
                    </div>
                    <p style="margin: 0 0 16px 0; font-size: 13px; color: #475569;">
                        <?php echo esc_html__('Download your current configuration as a JSON file for backup or transfer.', 'brandmeetscode-datalayer-tracker'); ?>
                    </p>
                    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin: 0;">
                        <?php wp_nonce_field('adt_export_settings'); ?>
                        <input type="hidden" name="action" value="adt_export_settings">
                        <button type="submit" name="adt_export" class="button button-primary" style="width: 100%;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <?php echo esc_html__('Download Settings', 'brandmeetscode-datalayer-tracker'); ?>
                        </button>
                    </form>
                </div>
                
                <!-- Import Section -->
                <div style="padding: 20px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: #15803d;">
                            <?php echo esc_html__('Import Settings', 'brandmeetscode-datalayer-tracker'); ?>
                        </h3>
                    </div>
                    <p style="margin: 0 0 16px 0; font-size: 13px; color: #475569;">
                        <?php echo esc_html__('Upload a previously exported JSON file to restore your settings.', 'brandmeetscode-datalayer-tracker'); ?>
                    </p>
                    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" enctype="multipart/form-data" style="margin: 0;">
                        <?php wp_nonce_field('adt_export_settings'); ?>
                        <input type="hidden" name="action" value="adt_export_settings">
                        <div style="margin-bottom: 12px;">
                            <input type="file" 
                                   name="adt_import_file" 
                                   accept=".json" 
                                   style="width: 100%; padding: 8px; border: 2px dashed #bbf7d0; border-radius: 6px; background: #fff; cursor: pointer;"
                                   required>
                        </div>
                        <button type="submit" name="adt_import" class="button" style="width: 100%; background: #15803d; color: #fff; border-color: #15803d;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <?php echo esc_html__('Upload & Import', 'brandmeetscode-datalayer-tracker'); ?>
                        </button>
                    </form>
                </div>
                
            </div>
            
            <!-- Warning Notice -->
            <div style="padding: 12px 16px; background: #fff8e5; border-left: 3px solid #f59e0b; border-radius: 4px; font-size: 13px;">
                <strong style="color: #92400e;">⚠️ <?php echo esc_html__('Important:', 'brandmeetscode-datalayer-tracker'); ?></strong>
                <span style="color: #78350f;">
                    <?php echo esc_html__('Importing will overwrite your current settings. Export first to create a backup.', 'brandmeetscode-datalayer-tracker'); ?>
                </span>
            </div>
    </div>
</div>

		<?php if ( current_user_can('manage_options') ) : ?>
		<!-- 2. Danger Zone -->
		<div id="adt-danger-zone-postbox" class="postbox closed">
		    <h2 class="hndle" role="button" tabindex="0" aria-expanded="false" style="color: #dc3232;">
		        <span class="toggle-indicator" aria-hidden="true"></span>
		        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3232" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;">
		            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
		            <line x1="12" y1="9" x2="12" y2="13"></line>
		            <line x1="12" y1="17" x2="12.01" y2="17"></line>
		        </svg>
		        <?php echo esc_html__('Danger Zone', 'brandmeetscode-datalayer-tracker'); ?>
		    </h2>
		    <div class="inside">
		        <!-- Warning Banner -->
		        <div style="padding: 16px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #fca5a5; border-radius: 8px; margin-bottom: 20px;">
		            <div style="display: flex; align-items: start; gap: 12px;">
		                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px;">
		                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
		                    <line x1="12" y1="9" x2="12" y2="13"></line>
		                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
		                </svg>
		                <div>
		                    <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #991b1b;">
		                        <?php echo esc_html__('⚠️ Critical Action - Read Carefully', 'brandmeetscode-datalayer-tracker'); ?>
		                    </h3>
		                    <p style="margin: 0; font-size: 13px; color: #7f1d1d; line-height: 1.6;">
		                        <?php echo esc_html__('Resetting will permanently delete all your custom configurations and return the plugin to its default state. This action cannot be undone.', 'brandmeetscode-datalayer-tracker'); ?>
		                    </p>
		                </div>
		            </div>
		        </div>

		        <!-- What Will Be Reset -->
		        <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
		            <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #1e293b;">
		                <?php echo esc_html__('What will be reset:', 'brandmeetscode-datalayer-tracker'); ?>
		            </h4>
		            <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 13px; line-height: 1.8;">
		                <li><?php echo esc_html__('All event tracking configurations', 'brandmeetscode-datalayer-tracker'); ?></li>
		                <li><?php echo esc_html__('Enabled features and integrations', 'brandmeetscode-datalayer-tracker'); ?></li>
		                <li><?php echo esc_html__('Custom field mappings', 'brandmeetscode-datalayer-tracker'); ?></li>
		                <li><?php echo esc_html__('GTM snippet configuration', 'brandmeetscode-datalayer-tracker'); ?></li>
		                <li><?php echo esc_html__('Consent and privacy settings', 'brandmeetscode-datalayer-tracker'); ?></li>
		                <li><?php echo esc_html__('All orphaned or custom fields', 'brandmeetscode-datalayer-tracker'); ?></li>
		            </ul>
		        </div>

		        <!-- Pro Tip -->
		        <div style="padding: 12px 16px; background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 4px; margin-bottom: 20px;">
		            <div style="display: flex; align-items: start; gap: 8px;">
		                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px;">
		                    <circle cx="12" cy="12" r="10"></circle>
		                    <path d="M12 16v-4"></path>
		                    <path d="M12 8h.01"></path>
		                </svg>
		                <div>
		                    <strong style="font-size: 13px; color: #92400e;">
		                        <?php echo esc_html__('💡 Pro Tip:', 'brandmeetscode-datalayer-tracker'); ?>
		                    </strong>
		                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #78350f;">
		                        <?php echo esc_html__('Export your current settings first (above) so you can restore them later if needed.', 'brandmeetscode-datalayer-tracker'); ?>
		                    </p>
		                </div>
		            </div>
		        </div>

		        <!-- Reset Button -->
		        <form method="post" style="margin: 0;">
		            <?php wp_nonce_field('adt_reset_defaults', 'adt_reset_defaults_nonce'); ?>
		            <input type="hidden" name="adt_action" value="reset_defaults" />
            
		            <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px;">
		                <button type="submit" 
		                        class="button" 
		                        style="background: #dc2626; color: #fff; border-color: #dc2626; font-weight: 600; padding: 8px 24px; height: auto; font-size: 14px;"
		                        onclick="return confirm('⚠️⚠️⚠️ FINAL WARNING ⚠️⚠️⚠️\n\nThis will PERMANENTLY DELETE all your settings!\n\n❌ All custom configurations will be lost\n❌ All enabled features will be reset\n❌ All custom field mappings will be cleared\n❌ All orphaned fields will be removed\n\n🔴 THIS CANNOT BE UNDONE 🔴\n\nType YES in the next prompt to confirm you understand this is permanent...');">
		                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;">
		                        <polyline points="3 6 5 6 21 6"></polyline>
		                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
		                        <line x1="10" y1="11" x2="10" y2="17"></line>
		                        <line x1="14" y1="11" x2="14" y2="17"></line>
		                    </svg>
		                    <?php esc_html_e('Reset All Settings to Defaults', 'brandmeetscode-datalayer-tracker'); ?>
		                </button>
		                <span style="color: #dc2626; font-size: 12px; font-weight: 600;">
		                    ⚠️ <?php esc_html_e('Cannot be undone', 'brandmeetscode-datalayer-tracker'); ?>
		                </span>
		            </div>
		        </form>

		    </div>
		</div>
		<?php endif; ?>
	<?php ob_start(); ?>
	document.addEventListener('DOMContentLoaded', () => {
	    // Define utilities ONCE at the top
	    const LS  = localStorage;
	    const $   = (sel, ctx = document) => ctx.querySelector(sel);
	    const $$  = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
	    const KEY = k => `adt_${k}`;

	    // 1. POSTBOX COLLAPSE
	    function enablePostboxCollapse(id, {lsKey, defaultClosed = true, neverPersist = false} = {}) {
	        const box = document.getElementById(id);
	        if (!box) return null;
        
	        const header = $('.hndle', box);
	        if (!header) return null;

	        const apply = closed => {
	            box.classList.toggle('closed', closed);
	            header.setAttribute('aria-expanded', !closed);
	            if (lsKey && !neverPersist) {
	                LS.setItem(lsKey, closed ? '1' : '0');
	            }
	        };

	        const stored = (lsKey && !neverPersist) ? LS.getItem(lsKey) : null;
	        apply(neverPersist ? true : (stored === null ? defaultClosed : stored === '1'));

	        const toggle = () => apply(!box.classList.contains('closed'));
	        header.addEventListener('click', toggle);
	        header.addEventListener('keydown', e => {
	            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
	        });

	        return {box, apply};
	    }

	    const POSTBOXES = [
	        enablePostboxCollapse('adt-tips-postbox', {lsKey: KEY('tips_closed')}),
	        enablePostboxCollapse('adt-import-export-postbox', {lsKey: KEY('imp_exp_closed')}),
	        enablePostboxCollapse('adt-danger-zone-postbox', {defaultClosed: true, neverPersist: true}),
	        enablePostboxCollapse('adt-field-debug-postbox', {lsKey: KEY('field_dbg_closed')}),
	        enablePostboxCollapse('adt-helpers-box', {lsKey: KEY('adt_helpers_collapsed')}),
	    ].filter(Boolean);

	    // Expand/Collapse ALL button
	    (function() {
	        const btn = document.getElementById('adt-toggle-all-boxes');
	        if (!btn || POSTBOXES.length === 0) return;

	        const svg = btn.querySelector('svg');
	        const span = btn.querySelector('span');

	        const updateLabel = () => {
	            const anyClosed = POSTBOXES.some(pb => pb.box.classList.contains('closed'));
	            if (span) {
	                span.textContent = anyClosed ? '<?php echo esc_js(__('Expand All', 'brandmeetscode-datalayer-tracker')); ?>' : '<?php echo esc_js(__('Collapse All', 'brandmeetscode-datalayer-tracker')); ?>';
	            }
	            if (svg) {
	                svg.style.transform = anyClosed ? 'rotate(0deg)' : 'rotate(180deg)';
	            }
	            btn.dataset.state = anyClosed ? 'collapsed' : 'expanded';
	        };

	        btn.addEventListener('click', (e) => {
	            e.preventDefault();
	            const collapseNext = btn.dataset.state !== 'collapsed';
	            POSTBOXES.forEach(pb => pb.apply(collapseNext));
	            updateLabel();
	        });

	        updateLabel();
	    })();

	    // 3. FIELD DEBUG TOGGLE
	    const dbgBtn = document.getElementById('adt-debug-fields-btn');
	    const dbgPane = document.getElementById('adt-debug-fields-output');
	    if (dbgBtn && dbgPane) {
	        dbgBtn.addEventListener('click', () => {
	            const open = dbgPane.style.display === 'block';
	            dbgPane.style.display = open ? 'none' : 'block';
            
	            const slotId = 'adt-last-form-snapshot';
	            let slot = document.getElementById(slotId);
	            if (!slot) {
	                slot = document.createElement('pre');
	                slot.id = slotId;
	                slot.style.marginTop = '1em';
	                dbgPane.appendChild(slot);
	            }

	            try {
	                const json = LS.getItem('adt_last_form_submit');
	                slot.textContent = json ? `📋 Last form_submit payload\n${json}` : 'No form_submit events captured in this browser yet.';
	            } catch (err) {
	                slot.textContent = 'Unable to read localStorage: ' + err;
	            }
	        });
	    }

	    // 5. TOAST + JSON TEMPLATE HELPER
	    const toast = document.getElementById('adt-toast');
	    const templateEl = document.querySelector("textarea[name='adt_settings[custom_events_json]']");

	    if (templateEl) {
	        const wrap = document.createElement('div');
	        wrap.innerHTML = `
	            <p><strong>${ADTData.i18n?.custom_events_title || 'Need a template for Custom Events?'}</strong></p>
	            <button type="button" class="button button-secondary" data-act="load">
	                ${ADTData.i18n?.load_example || 'Load Example Events'}
	            </button>
	            <button type="button" class="button" data-act="clear">
	                ${ADTData.i18n?.clear || 'Clear'}
	            </button>`;

	        templateEl.after(wrap);

	        const sample = [
	            { selector: '.cta-button', event: 'click', name: 'ctaClick', data: { location: 'hero' } },
	            { selector: 'form.subscribe-form', event: 'submit', name: 'formSubmit', data: { formType: 'newsletter' } }
	        ];

	        const toastMsg = (m, d = 2500) => {
	            toast.textContent = m;
	            toast.classList.add('show');
	            setTimeout(() => toast.classList.remove('show'), d);
	        };

	        wrap.addEventListener('click', e => {
	            if (e.target.tagName !== 'BUTTON') return;

	            if (e.target.dataset.act === 'load') {
	                templateEl.value = ADTUtils.safeJSONStringify(sample, null, 2);
	                templateEl.focus();
	                toastMsg(ADTData.i18n?.toast_loaded || 'Example events loaded');
	            } else {
	                templateEl.value = '';
	                templateEl.focus();
	                toastMsg(ADTData.i18n?.toast_cleared || 'Custom events cleared');
	            }
	        });
	    }

	    // 6. NOTICE DISMISSAL HANDLER
	    document.querySelectorAll('.adt-admin-notice.is-dismissible .notice-dismiss').forEach(btn => {
	        btn.addEventListener('click', function() {
	            const notice = this.closest('.adt-admin-notice');
	            const noticeType = notice?.dataset.noticeType;

	            if (noticeType) {
	                fetch(ajaxurl, {
	                    method: 'POST',
	                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
	                    body: new URLSearchParams({
	                        action: 'adt_dismiss_notice',
	                        which: noticeType,
	                        security: '<?php echo esc_js( wp_create_nonce( 'adt_admin_action' ) ); ?>'
	                    })
	                }).then(response => response.json())
	                  .then(data => {
	                      console.log('Dismiss response:', data);
	                      if (data.success) {
	                          console.log('Notice dismissed:', noticeType);
	                      }
	                  })
	                  .catch(error => console.error('Dismiss failed:', error));
	            }
	        });
	    });
		
	    document.querySelectorAll('[data-dismissible]').forEach(notice => {
	        notice.addEventListener('click', function(e) {
	            if (e.target.classList.contains('notice-dismiss') || e.target.closest('.notice-dismiss')) {
	                const dismissKey = this.dataset.dismissible;
	                const nonce = this.dataset.nonce;
                
	                fetch(ajaxurl, {
	                    method: 'POST',
	                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
	                    body: new URLSearchParams({
	                        action: 'adt_dismiss_welcome_notice',
	                        nonce: nonce
	                    })
	                });
	            }
	        }, true);
	    });
	});
	<?php wp_add_inline_script( 'adt-utils', ob_get_clean() ); ?>

	<?php ob_start(); ?>
	document.addEventListener('DOMContentLoaded', () => {
	  const btn = document.getElementById('adt-save-btn');
	  if (btn) {
	    btn.addEventListener('click', () => {
	      btn.classList.add('adt-saving');
	      const form = document.querySelector('.adt-save-row form');
	      if (form) form.classList.add('adt-saving');
	      const spinner = btn.querySelector('.adt-spinner');
	      if (spinner) spinner.setAttribute('aria-hidden', 'false');
	    });
	  }
	});
	<?php wp_add_inline_script( 'adt-utils', ob_get_clean() ); ?>


	<?php /* .adt-saving + .adt-spinner styles are in assets/css/adt-admin.css */ ?>
	
	<!-- ADT Plugin Footer -->
	<div class="adt-plugin-footer-meta" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 13px; width: 100%; max-width: 100%; box-sizing: border-box;">
	    <p class="adt-footer-links">
	        <strong><?php esc_html_e('DataLayer Tracker', 'brandmeetscode-datalayer-tracker'); ?></strong>
	        <span class="adt-footer-sep" aria-hidden="true">|</span>
	        <span>v<?php echo defined('ADT_VERSION') ? esc_html(ADT_VERSION) : '1.2.5'; ?></span>
	        <span class="adt-footer-sep" aria-hidden="true">|</span>
	        <span><?php esc_html_e('Made by', 'brandmeetscode-datalayer-tracker'); ?></span>
	        <a href="https://brandmeetscode.com" style="color: #0073aa; text-decoration: none;" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Brand Meets Code', 'brandmeetscode-datalayer-tracker'); ?></a>
	        <span class="adt-footer-sep" aria-hidden="true">|</span>
	        <a href="https://datalayer-tracker.com/knowledge-base/" target="_blank" rel="noopener noreferrer" style="color: #0073aa; text-decoration: none;"><?php esc_html_e('Documentation', 'brandmeetscode-datalayer-tracker'); ?></a>
	        <span class="adt-footer-sep" aria-hidden="true">|</span>
	        <a href="https://datalayer-tracker.com/support" style="color: #0073aa; text-decoration: none;" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Support', 'brandmeetscode-datalayer-tracker'); ?></a>
	        <?php if (defined('WP_DEBUG') && WP_DEBUG) : ?>
	        <span class="adt-footer-sep" aria-hidden="true">|</span>
	        <a href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=adt_reset_notices'), 'adt_reset_notices')); ?>" 
	           onclick="return confirm('Reset all notice dismissals?');" 
	           style="color: #999; text-decoration: none;">Reset Notices</a>
	        <?php endif; ?>
	    </p>
	</div>

</div><!-- .adt-settings-page-bottom -->

</div><!-- .adt-settings-wrapper -->

</div><!-- .wrap -->