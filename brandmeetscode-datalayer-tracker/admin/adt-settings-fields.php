<?php
defined('ABSPATH') || exit;

function adt_render_field_callback( $key, $config, $settings = null ) {
    $options     = $settings ?? adt_get_settings();
    $value       = $options[$key] ?? ($config['default'] ?? '');
    $type        = $config['type'] ?? 'checkbox';
    $description = $config['description'] ?? '';
    $label       = $config['label'] ?? $key;
    $input_id    = 'cb-' . $key;
    $input_name  = "adt_settings[$key]";
    $is_gated = false; // All features are available in this build.

    // Normalize group values
    if ($type === 'group' && !empty($config['fields'])) {
        $value = is_array($value) ? $value : [];
    }

    // Render by type
	switch ($type) {
	    case 'header':
	        // Close the current table row, render full-width header, then start a new row
	        echo '</td></tr>'; // Close current field's cell and row
	        echo '<tr><td colspan="2" style="padding: 0;">'; // Full-width cell
	        echo '<div id="' . esc_attr( $key ) . '" class="adt-settings-field-header">';
	        echo '<h3 class="adt-settings-field-header__title">';
	        echo esc_html( $label );
	        echo '</h3>';
        
	        // ✅ Add optional description right under the title
	        if ( ! empty( $description ) ) {
	            echo '<p class="adt-settings-field-header__description">';
	            echo wp_kses_post( $description );
	            echo '</p>';
	        }
        
	        echo '</div>';
	        echo '</td></tr>'; // Close the full-width cell and row
	        echo '<tr><td>'; // Start a new row for the next field (WordPress will add the second <td>)
	        return; // Don't render description below
        
			case 'textarea':
	            printf(
	                '<textarea id="%1$s" name="%2$s" data-adt-setting="%3$s" rows="10" wrap="off" style="width:100%%; max-width:800px; font-family:monospace;"',
	                esc_attr( $input_id ),
	                esc_attr( $input_name ),
	                esc_attr( $key )
	            );
				disabled( $is_gated, true, true );
				echo '>' . esc_textarea( $value ) . '</textarea>';
	            if ($key === 'pixel_event_map_json') {
	                echo "<div id='adt-json-status' style='font-size:12px;margin-top:4px;'></div>";
	                echo '<details style="margin-top:12px;padding:12px;background:#f9f9f9;border-left:3px solid #2271b1;border-radius:4px;">
	                    <summary style="cursor:pointer;font-weight:600;color:#2271b1;user-select:none;">
	                        📖 Pixel Event Mapping Guide
	                    </summary>
	                    <div style="margin-top:12px;font-size:13px;line-height:1.6;">
	                        <p style="margin-top:0;color:#666;">Map dataLayer events to specific advertising pixel platforms:</p>
	                        <p style="margin:12px 0 8px;font-weight:600;">Available Platforms:</p>
	                        <div style="background:#fff;padding:8px 12px;border:1px solid #ddd;border-radius:3px;font-family:monospace;font-size:12px;">
	                            <code>meta</code>, <code>google</code>, <code>tiktok</code>, <code>linkedin</code>, <code>x</code>, <code>pinterest</code>, <code>reddit</code>, <code>snapchat</code>
	                        </div>
	                        <p style="margin:12px 0 8px;font-weight:600;">Example Mapping:</p>
	                        <pre style="background:#fff;padding:12px;border:1px solid #ddd;overflow-x:auto;font-size:12px;margin:8px 0;">{
	  "page_view": ["meta", "google"],
	  "form_submit": ["meta", "tiktok", "google", "linkedin"],
	  "add_to_cart": ["meta", "google", "tiktok"],
	  "purchase": ["meta", "google", "tiktok", "linkedin"],
	  "video_complete": ["meta", "tiktok"]
	}</pre>
	                        <p style="margin-bottom:0;font-size:12px;color:#666;">
	                            <strong>Tip:</strong> Only events listed here will fire to pixels. Unlisted events will be ignored by the Pixel Manager.
	                        </p>
	                    </div>
	                </details>';
	            }
	            if ($key === 'custom_events_json') {
	                echo '<details style="margin-top:12px;padding:12px;background:#f9f9f9;border-left:3px solid #2271b1;border-radius:4px;">
	                    <summary style="cursor:pointer;font-weight:600;color:#2271b1;user-select:none;">
	                        📖 Example Custom Events
	                    </summary>
	                    <div style="margin-top:12px;font-size:13px;line-height:1.6;">
	                        <p style="margin-top:0;color:#666;">Custom events are automatically pushed to the dataLayer on page load:</p>
	                        <pre style="background:#fff;padding:12px;border:1px solid #ddd;overflow-x:auto;font-size:12px;margin:8px 0;">[
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
	]</pre>
	                        <p style="margin-bottom:0;font-size:12px;color:#666;">
	                            <strong>Tip:</strong> Each event object must have an "event" property. Add any additional parameters you need.
	                        </p>
	                    </div>
	                </details>';
	            }
			break;

		case 'select':
		    $optionsArray = $config['options'] ?? [];
		    echo '<div style="display:block; margin-top:8px;">';
		    printf(
		        '<select id="%1$s" name="%2$s" data-adt-setting="%3$s" style="margin-bottom:5px;"',
		        esc_attr( $input_id ),
		        esc_attr( $input_name ),
		        esc_attr( $key )
		    );
			disabled( $is_gated, true, true );
			echo '>';
		    foreach ($optionsArray as $optValue => $optLabel) {
		        if (is_array($optLabel)) {
		            printf( '<optgroup label="%s">', esc_attr( $optValue ) );
		            foreach ($optLabel as $subVal => $subLabel) {
		                printf(
		                    '<option value="%1$s"%2$s>%3$s</option>',
		                    esc_attr( $subVal ),
		                    selected( $value, $subVal, false ),
		                    esc_html( $subLabel )
		                );
		            }
		            echo '</optgroup>';
		        } else {
		            printf(
		                '<option value="%1$s"%2$s>%3$s</option>',
		                esc_attr( $optValue ),
		                selected( $value, $optValue, false ),
		                esc_html( $optLabel )
		            );
		        }
		    }
		    echo '</select>';
		    echo '</div>';
		    break;
				
        case 'radio':
            foreach (($config['options'] ?? []) as $optValue => $optLabel) {
                printf(
                    '<label style="display:block; margin-bottom:0.25em; opacity:%1$s;"><input type="radio" name="%2$s" value="%3$s" data-adt-setting="%4$s"',
                    esc_attr( $is_gated ? '0.6' : '1' ),
                    esc_attr( $input_name ),
                    esc_attr( $optValue ),
                    esc_attr( $key )
                );
				checked( $value, $optValue, true );
				disabled( $is_gated, true, true );
				echo ' /> ' . esc_html( $optLabel ) . '</label>';
            }
            break;

        case 'multi-checkbox':
            $saved = is_array($value) ? $value : explode(',', $value);
            foreach (($config['options'] ?? []) as $optValue => $optLabel) {
                $is_opt_checked = in_array( $optValue, $saved, true );
                printf(
                    '<label style="display:block; margin-bottom:0.25em; opacity:%1$s;"><input type="checkbox" name="%2$s[]" value="%3$s" data-adt-setting="%4$s"',
                    esc_attr( $is_gated ? '0.6' : '1' ),
                    esc_attr( $input_name ),
                    esc_attr( $optValue ),
                    esc_attr( $key )
                );
				checked( $is_opt_checked, true, true );
				disabled( $is_gated, true, true );
				echo ' /> ' . esc_html( $optLabel ) . '</label>';
            }
            break;

		case 'number':
	        case 'text':
	            $input_type = ( 'number' === $type ) ? 'number' : 'text';
	            printf(
	                '<input type="%1$s" id="%2$s" name="%3$s" value="%4$s" class="regular-text" data-adt-setting="%5$s"',
	                esc_attr( $input_type ),
	                esc_attr( $input_id ),
	                esc_attr( $input_name ),
	                esc_attr( $value ),
	                esc_attr( $key )
	            );
				disabled( $is_gated, true, true );
				echo ' />';

	            // Show description on new line with 5px gap for text/number fields
	            if ($description) {
	                echo '<p class="description" style="display:block; margin-top:5px;">' . wp_kses_post( $description ) . '</p>';
	                $description = ''; // Clear it so it doesn't render again below
	            }

	            if ($key === 'cookieMatchRegex') {
	                $isValid = false;
	                try {
	                    $isValid = @preg_match("#{$value}#", '') !== false;
	                } catch ( \Throwable $e ) {
	                    $isValid = false;
	                }
	                if (!$isValid) {
	                    adt_debug_log("Invalid regex pattern submitted: " . $value);
	                    wp_send_json_error('Invalid regex pattern');
	                }
	            }
	            break;

        case 'group':
            $saved_group = is_array($value) ? $value : [];
            echo '<div class="adt-field-group" style="opacity:' . esc_attr( $is_gated ? '0.6' : '1' ) . ';">';
            foreach ($config['fields'] as $sub_key => $sub_config) {
                $sub_value = $saved_group[$sub_key] ?? '';
                printf(
                    '<label for="%s_%s" style="display:block; margin-top:6px;">%s</label>',
                    esc_attr($key),
                    esc_attr($sub_key),
                    esc_html($sub_config['label'] ?? ucwords(str_replace('_', ' ', $sub_key)))
                );
                printf(
                    '<input type="text" id="%1$s_%2$s" name="adt_settings[%3$s][%4$s]" data-adt-setting="%3$s[%4$s]" value="%5$s" class="regular-text" style="margin-bottom:6px;"',
                    esc_attr($key),
                    esc_attr($sub_key),
                    esc_attr($key),
                    esc_attr($sub_key),
                    esc_attr($sub_value)
                );
				disabled( $is_gated, true, true );
				echo ' />';
            }
            echo '</div>';
            break;
        
        case 'custom':
            // Custom field types - call the callback function
            if (isset($config['callback']) && function_exists($config['callback'])) {
                call_user_func($config['callback'], $config);
            }
            break;

        case 'checkbox':
            // Handle both string "1" and integer 1, but treat "0" and 0 as unchecked
            $is_checked = ($value === 1 || $value === '1' || $value === true);

            printf(
                '<input type="hidden" name="%1$s" value="0" />',
                esc_attr( $input_name )
            );
            printf(
                '<input type="checkbox" id="%1$s" name="%2$s" value="1" data-adt-setting="%3$s"',
                esc_attr( $input_id ),
                esc_attr( $input_name ),
                esc_attr( $key )
            );
			checked( $is_checked, true, true );
			disabled( $is_gated, true, true );
			echo ' />';
            break;
    }

    // Show description below the field (except for headers which return early)
    if ($description) {
        echo "<p class='description'>" . wp_kses_post($description) . "</p>";
    }
	


    // JSON validator (only load once)
    static $adt_json_validator_loaded = false;
    if (!$adt_json_validator_loaded) {
        $valid_json   = wp_json_encode( __( '✅ Valid JSON', 'brandmeetscode-datalayer-tracker' ), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
        $invalid_json = wp_json_encode( __( '❌ Invalid JSON', 'brandmeetscode-datalayer-tracker' ), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
        $js = 'document.addEventListener("DOMContentLoaded",function(){'
            . 'var el=document.querySelector(\'textarea[data-adt-setting="pixel_event_map_json"]\');'
            . 'var status=document.getElementById(\'adt-json-status\');'
            . 'if(!el||!status)return;'
            . 'var formatJSON=function(str){try{return JSON.stringify(JSON.parse(str),null,2);}catch(e){return str;}};'
            . 'var validate=function(){'
            .   'var val=el.value.trim();'
            .   'try{JSON.parse(val);status.textContent=' . $valid_json . ';status.style.color="green";el.style.borderColor="#5ca75c";}'
            .   'catch(err){status.textContent=' . $invalid_json . ';status.style.color="red";el.style.borderColor="red";}'
            . '};'
            . 'el.addEventListener("blur",function(){el.value=formatJSON(el.value);validate();});'
            . 'el.addEventListener("input",validate);'
            . 'validate();'
            . '});';
        wp_add_inline_script( 'jquery', $js, 'after' );
        $adt_json_validator_loaded = true;
    }
}

function adt_get_flat_field_map() {
    global $adt_field_map;
    $flat = [];
    foreach ( $adt_field_map as $fields ) {
        foreach ( $fields as $key => $_ ) {
            $flat[ $key ] = true;
        }
    }
    return $flat;
}

function adt_dump_field_map_summary() {
    global $adt_field_map;
    
    $settings = adt_get_settings();
    $defaults = adt_get_default_settings();

    // Whitelist of allowed safety net fields that aren't in field_map
    $allowed_safety_fields = adt_get_allowed_safety_fields();
	
    // Check for orphaned fields
    $orphaned_fields = [];
    foreach ($settings as $key => $value) {
        $found = false;
        foreach ($adt_field_map as $section => $fields) {
            foreach ($fields as $field_key => $config) {
                if (is_int($field_key)) {
                    $field_key = $config;
                }
                if ($field_key === $key) {
                    $found = true;
                    break 2;
                }
            }
        }
        if (!$found && !in_array($key, $allowed_safety_fields)) {
            $orphaned_fields[] = $key;
        }
    }

    echo '<div class="adt-field-map-debug" style="background:#fff;border:1px solid #ccc;padding:1em;margin-top:2em;">';
    echo '<h2>🧭 ' . esc_html__('Field Map Debug: Registered Plugin Fields', 'brandmeetscode-datalayer-tracker') . '</h2>';

    // Show orphaned fields warning with cleanup button
    if (!empty($orphaned_fields)) {
        echo '<div class="notice notice-warning" style="margin-top:1em;padding:1em;border-left:4px solid #ffba00;">';
        echo '<h3 style="margin-top:0;">⚠️ ' . esc_html__('Orphaned Fields Detected', 'brandmeetscode-datalayer-tracker') . '</h3>';
        echo '<p>' . esc_html__('These fields exist in your database but are not defined in the current plugin architecture. They are safe to remove:', 'brandmeetscode-datalayer-tracker') . '</p>';
        echo '<ul style="list-style:disc;margin-left:2em;margin-bottom:1em;">';
        foreach ($orphaned_fields as $orphan) {
            echo '<li><code style="background:#fff3cd;padding:2px 6px;border-radius:3px;">' . esc_html($orphan) . '</code></li>';
        }
        echo '</ul>';
        echo '<form method="post" action="" style="margin-top:1em;">';
        wp_nonce_field('adt_cleanup_orphaned_fields', 'adt_cleanup_nonce');
        echo '<input type="hidden" name="adt_cleanup_orphaned" value="1">';
		echo '<button type="submit" class="button button-secondary" style="background:#dc3232;color:#fff;border-color:#dc3232;">';
		echo '🗑️ ' . esc_html__('Clean Up Orphaned Fields', 'brandmeetscode-datalayer-tracker');
		echo '</button>';
        echo '<span style="margin-left:1em;color:#666;font-size:12px;">' . sprintf(
            /* translators: %d: Number of orphaned settings keys to remove. */
            esc_html__( '(%d field(s) will be removed)', 'brandmeetscode-datalayer-tracker' ),
            (int) count( $orphaned_fields )
        ) . '</span>';
        echo '</form>';
        echo '</div>';
    }

    // Display section-based field map structure
    echo '<h3>📋 ' . esc_html__('Field Map Structure by Section', 'brandmeetscode-datalayer-tracker') . '</h3>';
    
    if (empty($adt_field_map)) {
        echo '<div class="notice notice-error">❌ ' . esc_html__('$adt_field_map is not defined or empty.', 'brandmeetscode-datalayer-tracker') . '</div>';
    } else {
        echo '<div style="margin-top:1em;">';
        foreach ($adt_field_map as $section_key => $fields) {
            if (empty($fields)) continue;
            
            echo '<details style="margin-bottom:1em;border:1px solid #ddd;padding:0.5em;">';
            echo '<summary style="cursor:pointer;font-weight:bold;padding:0.5em;background:#f9f9f9;">';
            echo esc_html($section_key) . ' <span style="color:#666;">(' . count($fields) . ' fields)</span>';
            echo '</summary>';
            
            echo '<ul style="margin:0.5em 0;padding-left:2em;list-style:disc;">';
            foreach ($fields as $field_key => $config) {
                // Normalize field key and config
                if (is_int($field_key)) {
                    $field_key = $config;
                    $config = ['type' => 'checkbox', 'default' => 0];
                } elseif (is_string($config)) {
                    $config = ['label' => $config, 'type' => 'checkbox', 'default' => 0];
                }
                
                $type = $config['type'] ?? 'checkbox';
                $category = $config['category'] ?? 'uncategorized';
                
                echo '<li>';
                echo '<code>' . esc_html($field_key) . '</code>';
                echo ' <span style="color:#666;">(' . esc_html($type) . ', category: ' . esc_html($category) . ')</span>';
                
                // Show subfields for group types
                if ($type === 'group' && !empty($config['fields'])) {
                    echo '<ul style="margin-top:0.25em;list-style:circle;">';
                    foreach ($config['fields'] as $subKey => $subConfig) {
                        $subType = is_array($subConfig) ? ($subConfig['type'] ?? 'text') : 'text';
                        echo '<li><code>' . esc_html($subKey) . '</code> <span style="color:#999;">(' . esc_html($subType) . ')</span></li>';
                    }
                    echo '</ul>';
                }
                
                echo '</li>';
            }
            echo '</ul>';
            echo '</details>';
        }
        echo '</div>';
    }

    echo '<hr/>';
    echo '<p><strong>' . esc_html__('Backend Saved Settings (PHP):', 'brandmeetscode-datalayer-tracker') . '</strong></p>';

    if (empty($settings)) {
        echo '<div class="notice notice-warning">⚠️ ' . esc_html__('No ADT settings found. Save your settings first.', 'brandmeetscode-datalayer-tracker') . '</div>';
    } else {
        echo '<h4 style="margin-top:1em;">⚙️ ' . esc_html__('Flat Settings with Default Comparison', 'brandmeetscode-datalayer-tracker') . '</h4>';
        
        // Build a mapping of field keys to their section and config for better context
        $field_context = [];
        foreach ($adt_field_map as $section_key => $fields) {
            foreach ($fields as $field_key => $config) {
                // Normalize field key and config
                if (is_int($field_key)) {
                    $field_key = $config;
                    $config = ['type' => 'checkbox', 'default' => 0];
                } elseif (is_string($config)) {
                    $config = ['label' => $config, 'type' => 'checkbox', 'default' => 0];
                }
                
                $field_context[$field_key] = [
                    'section' => $section_key,
                    'type' => $config['type'] ?? 'checkbox',
                    'config' => $config
                ];
            }
        }
        
		echo '<table style="width:100%;table-layout:fixed;border-collapse:collapse;margin-top:1em;font-size:13px;">';
        echo '<colgroup>';
        echo '<col style="width:20%;">'; // Key
        echo '<col style="width:15%;">'; // Section
        echo '<col style="width:10%;">'; // Type
        echo '<col style="width:22%;">'; // Saved Value
        echo '<col style="width:22%;">'; // Default Value
        echo '<col style="width:11%;">'; // Status
        echo '</colgroup>';
        echo '<thead><tr style="border-bottom:2px solid #ccc;background:#f9f9f9;">';
        echo '<th align="left" style="padding:8px;">Key</th>';
        echo '<th align="left" style="padding:8px;">Section</th>';
        echo '<th align="left" style="padding:8px;">Type</th>';
        echo '<th align="left" style="padding:8px;">Saved Value</th>';
        echo '<th align="left" style="padding:8px;">Default Value</th>';
        echo '<th align="left" style="padding:8px;">Status</th>';
        echo '</tr></thead>';
        echo '<tbody>';

        $all_keys = array_unique(array_merge(array_keys($settings), array_keys($defaults)));
        sort($all_keys);

        foreach ($all_keys as $key) {
            $saved   = $settings[$key] ?? '⛔️ unset';
            $default = $defaults[$key] ?? '—';
            
            // Get field context
            $context = $field_context[$key] ?? null;
            $section = $context ? $context['section'] : (in_array($key, $allowed_safety_fields) ? '⚙️ safety-net' : '❓ orphaned');
            $type = $context ? $context['type'] : '❓';

            // Detect arrays for group fields
            $isArray = is_array($saved) || is_array($default);

            if ($isArray) {
                $savedExport   = wp_json_encode($saved, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
                $defaultExport = wp_json_encode($default, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
                $match         = $saved === $default;
            } else {
                $savedExport   = wp_json_encode($saved, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
                $defaultExport = wp_json_encode($default, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
                $match         = (string) $saved === (string) $default;
            }

            // Color coding
            if (!$context && !in_array($key, $allowed_safety_fields)) {
                $rowStyle = 'background:#ffe6e6;'; // Red tint for orphaned fields
                $status   = '⚠️ Orphaned';
            } elseif ($saved === '⛔️ unset') {
                $rowStyle = 'background:#fff3cd;'; // Yellow tint for unset fields
                $status   = '⚠️ Not Saved';
            } elseif ($match) {
                $rowStyle = 'background:#f6ffed;'; // Green tint for matches
                $status   = '✅ Match';
            } else {
                $rowStyle = 'background:#fffbe6;'; // Light yellow for mismatches
                $status   = '⚠️ Mismatch';
            }
			echo '<tr style="' . esc_attr( $rowStyle ) . '">';
            echo '<td style="padding:8px;border-bottom:1px solid #eee;"><code style="font-size:12px;">' . esc_html($key) . '</code></td>';
            echo '<td style="padding:8px;border-bottom:1px solid #eee;"><span style="font-size:11px;color:#666;">' . esc_html($section) . '</span></td>';
            echo '<td style="padding:8px;border-bottom:1px solid #eee;"><span style="font-size:11px;color:#666;">' . esc_html($type) . '</span></td>';

            echo '<td style="padding:8px;border-bottom:1px solid #eee;max-width:200px;">';
            echo '<div class="adt-truncate-value" style="cursor:pointer;font-size:11px;font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;" title="Click to expand" data-full="' . esc_attr($savedExport) . '">';
            echo esc_html($savedExport);
            echo '</div></td>';

            echo '<td style="padding:8px;border-bottom:1px solid #eee;max-width:200px;">';
            echo '<div class="adt-truncate-value" style="cursor:pointer;font-size:11px;font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;" title="Click to expand" data-full="' . esc_attr($defaultExport) . '">';
            echo esc_html($defaultExport);
            echo '</div></td>';

            echo '<td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;white-space:nowrap;">' . esc_html( $status ) . '</td>';
            echo '</tr>';
            
            // For group fields, show subfield details
            if ($type === 'group' && is_array($saved)) {
                foreach ($saved as $subKey => $subValue) {
                    $subDefault = is_array($default) ? ($default[$subKey] ?? '—') : '—';
                    $subMatch = $subValue === $subDefault;
                    
                    $subRowStyle = $subMatch ? 'background:#f0f9ff;' : 'background:#fef3c7;';
                    $subStatus = $subMatch ? '✅' : '⚠️';
                    
                    echo '<tr style="' . esc_attr( $subRowStyle ) . '">';
                    echo '<td style="padding:8px 8px 8px 24px;border-bottom:1px solid #eee;"><code style="font-size:11px;">└─ ' . esc_html($subKey) . '</code></td>';
                    echo '<td style="padding:8px;border-bottom:1px solid #eee;" colspan="2"><span style="font-size:10px;color:#999;">subfield</span></td>';
                    echo '<td style="padding:8px;border-bottom:1px solid #eee;"><pre style="margin:0;font-size:11px;">' . esc_html( wp_json_encode( $subValue, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE ) ) . '</pre></td>';
                    echo '<td style="padding:8px;border-bottom:1px solid #eee;"><pre style="margin:0;font-size:11px;">' . esc_html( wp_json_encode( $subDefault, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE ) ) . '</pre></td>';
                    echo '<td style="padding:8px;border-bottom:1px solid #eee;">' . esc_html( $subStatus ) . '</td>';
                    echo '</tr>';
                }
            }
        }

        echo '</tbody></table>';
        
        // Summary stats
        $total_fields = count($all_keys);
        $orphaned = count($orphaned_fields);
        $unset = 0;
        $matches = 0;
        $mismatches = 0;
        
        foreach ($all_keys as $key) {
            if (in_array($key, $orphaned_fields)) continue; // Skip orphaned in counts
            
            $saved = $settings[$key] ?? '⛔️ unset';
            $default = $defaults[$key] ?? '—';
            $context = $field_context[$key] ?? null;
            
            if ($saved === '⛔️ unset') {
                $unset++;
            } else {
                $isArray = is_array($saved) || is_array($default);
                $match = $isArray ? ($saved === $default) : ((string)$saved === (string)$default);
                if ($match) {
                    $matches++;
                } else {
                    $mismatches++;
                }
            }
        }
        
        echo '<div style="margin-top:1.5em;padding:1em;background:#f9f9f9;border:1px solid #ddd;border-radius:4px;">';
        echo '<h4 style="margin-top:0;">📊 ' . esc_html__('Summary Statistics', 'brandmeetscode-datalayer-tracker') . '</h4>';
        echo '<ul style="margin:0;padding-left:1.5em;">';
        echo '<li><strong>' . esc_html__('Total Fields:', 'brandmeetscode-datalayer-tracker') . '</strong> ' . esc_html( (string) $total_fields ) . '</li>';
        echo '<li><strong>' . esc_html__('Matches Default:', 'brandmeetscode-datalayer-tracker') . '</strong> ' . esc_html( (string) $matches ) . ' ✅</li>';
        echo '<li><strong>' . esc_html__('Custom Values:', 'brandmeetscode-datalayer-tracker') . '</strong> ' . esc_html( (string) $mismatches ) . ' ⚠️</li>';
        echo '<li><strong>' . esc_html__('Not Saved Yet:', 'brandmeetscode-datalayer-tracker') . '</strong> ' . esc_html( (string) $unset ) . ' ⚠️</li>';
        if ($orphaned > 0) {
            echo '<li><strong style="color:#dc2626;">' . esc_html__('Orphaned Fields:', 'brandmeetscode-datalayer-tracker') . '</strong> ' . esc_html( (string) $orphaned ) . ' ⚠️ <em>(not in field_map - use cleanup button above)</em></li>';
        }
        echo '</ul>';
        echo '</div>';
    }

	echo '<hr/><h3>🧠 ' . esc_html__('Live Frontend ADTData.include (JS)', 'brandmeetscode-datalayer-tracker') . '</h3>';
	echo '<p style="color:#666;font-size:13px;margin-bottom:0.5em;">' . esc_html__('This shows what feature flags are sent to the frontend. Only available when viewing the frontend with debug mode enabled.', 'brandmeetscode-datalayer-tracker') . '</p>';
	echo '<pre id="adt-include-live-output" style="background:#f5f5f5;padding:1em;border:1px solid #ddd;border-radius:4px;max-height:400px;overflow:auto;">' . esc_html__('Not available in admin area.', 'brandmeetscode-datalayer-tracker') . '</pre>';

	$adt_include_admin_hint = __(
		"⚠️ ADTData.include is not available in the WordPress admin area.\n\nTo view live frontend configuration:\n1. Enable Debug Mode in ADT settings\n2. Visit your site frontend (not admin)\n3. Open the browser console\n4. Run: console.log(window.ADTData.include)\n\nOr use the PHP backend data shown above.",
		'brandmeetscode-datalayer-tracker'
	);
	$adt_hint_json = wp_json_encode( $adt_include_admin_hint, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
	$js = '(function(){var o=document.getElementById("adt-include-live-output");'
	    . 'if(typeof window.ADTData!=="undefined"&&window.ADTData.include){'
	    .   'o.textContent=JSON.stringify(window.ADTData.include,null,2);o.style.background="#f0fff4";o.style.borderColor="#86efac";'
	    . '}else{o.textContent=' . $adt_hint_json . ';o.style.background="#fffbea";o.style.borderColor="#fbbf24";}})();';
	wp_add_inline_script( 'jquery', $js, 'after' );

    echo '</div>';
}
