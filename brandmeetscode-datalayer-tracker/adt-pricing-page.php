<?php
/**
 * DataLayer Tracker — Get Pro add-on page.
 *
 * @package DataLayer_Tracker
 */

defined( 'ABSPATH' ) || exit;

$sales_url = esc_url( adt_get_pro_sales_url() );
?>
<div class="wrap">
<h1 style="margin-bottom:4px;"><?php echo esc_html__( 'DataLayer Tracker — Pro Add-on', 'brandmeetscode-datalayer-tracker' ); ?></h1>
<p style="color:#646970;margin-top:0;margin-bottom:24px;">
	<?php echo esc_html__( 'The Pro add-on is a standalone plugin — it works independently and does not require this free version.', 'brandmeetscode-datalayer-tracker' ); ?>
</p>

<div style="display:flex;gap:24px;flex-wrap:wrap;align-items:stretch;max-width:900px;">

	<!-- Free column -->
	<div style="
		flex:1;
		min-width:260px;
		background:#fff;
		border:1px solid #dcdcde;
		border-radius:6px;
		padding:28px 28px 24px;
		box-sizing:border-box;
	">
		<p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#646970;">
			<?php echo esc_html__( 'You have this', 'brandmeetscode-datalayer-tracker' ); ?>
		</p>
		<h2 style="margin:0 0 6px;font-size:22px;">
			<?php echo esc_html__( 'Free', 'brandmeetscode-datalayer-tracker' ); ?>
		</h2>
		<p style="margin:0 0 20px;color:#646970;font-size:13px;">
			<?php echo esc_html__( 'Everything you need to push clean, structured data to GTM.', 'brandmeetscode-datalayer-tracker' ); ?>
		</p>
		<ul style="margin:0 0 24px;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px;">
			<?php
			$free_features = [
				__( 'Page, content &amp; visitor context', 'brandmeetscode-datalayer-tracker' ),
				__( 'Engagement — scroll depth, active time, hover intent, video progress, focus/blur, clicks', 'brandmeetscode-datalayer-tracker' ),
				__( 'Form lifecycle events (view, start, submit, error, abandon)', 'brandmeetscode-datalayer-tracker' ),
				__( 'WooCommerce GA4-style browser events, cart abandonment &amp; refunds (when WooCommerce is active)', 'brandmeetscode-datalayer-tracker' ),
				__( 'Client-side sessions &amp; UTM parameters', 'brandmeetscode-datalayer-tracker' ),
				__( 'GTM snippet output — paste your container ID', 'brandmeetscode-datalayer-tracker' ),
				__( 'Consent-aware loading &amp; CMP auto-detection', 'brandmeetscode-datalayer-tracker' ),
				__( 'Debug overlay (admin-only)', 'brandmeetscode-datalayer-tracker' ),
				__( 'Settings import / export', 'brandmeetscode-datalayer-tracker' ),
			];
			foreach ( $free_features as $item ) :
			?>
			<li style="display:flex;align-items:flex-start;gap:8px;font-size:13px;line-height:1.5;">
				<span style="color:#2271b1;flex-shrink:0;font-weight:700;">✓</span>
				<?php echo wp_kses( $item, [] ); ?>
			</li>
			<?php endforeach; ?>
		</ul>
		<a class="button" style="width:100%;text-align:center;box-sizing:border-box;" href="<?php echo esc_url( admin_url( 'admin.php?page=adt-settings' ) ); ?>">
			<?php echo esc_html__( 'Go to Settings', 'brandmeetscode-datalayer-tracker' ); ?>
		</a>
	</div>

	<!-- Pro column -->
	<div style="
		flex:1;
		min-width:260px;
		background:#fff;
		border:2px solid #09ba65;
		border-radius:6px;
		padding:28px 28px 24px;
		box-sizing:border-box;
		position:relative;
	">
		<span style="
			position:absolute;
			top:-1px;right:20px;
			background:#09ba65;
			color:#fff;
			font-size:11px;
			font-weight:700;
			letter-spacing:.05em;
			padding:3px 10px;
			border-radius:0 0 4px 4px;
			text-transform:uppercase;
		">
			<?php echo esc_html__( 'Standalone Plugin', 'brandmeetscode-datalayer-tracker' ); ?>
		</span>
		<p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#09ba65;">
			<?php echo esc_html__( 'Upgrade', 'brandmeetscode-datalayer-tracker' ); ?>
		</p>
		<h2 style="margin:0 0 6px;font-size:22px;">
			<?php echo esc_html__( 'Pro Add-on', 'brandmeetscode-datalayer-tracker' ); ?>
		</h2>
		<p style="margin:0 0 20px;color:#646970;font-size:13px;">
			<?php echo esc_html__( 'Pixels, server-side tracking, GTM export, and modules not included in the free WordPress.org build.', 'brandmeetscode-datalayer-tracker' ); ?>
		</p>
		<ul style="margin:0 0 24px;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px;">
			<?php
			$pro_features = [
				__( 'Advertising pixels — Meta, TikTok, Google Ads, LinkedIn, X, Pinterest', 'brandmeetscode-datalayer-tracker' ),
				__( 'Dual pixel mode (GTM + direct SDKs) &amp; JSON event mapping', 'brandmeetscode-datalayer-tracker' ),
				__( 'Server-side — Meta CAPI &amp; GA4 Measurement Protocol', 'brandmeetscode-datalayer-tracker' ),
				__( 'GTM container JSON export (one-click import)', 'brandmeetscode-datalayer-tracker' ),
				__( 'Content intelligence &amp; session summaries', 'brandmeetscode-datalayer-tracker' ),
				__( 'Preset library for faster site rollout', 'brandmeetscode-datalayer-tracker' ),
				__( 'Field-level form tracking &amp; form-vendor shortcuts', 'brandmeetscode-datalayer-tracker' ),
				__( 'Priority email support', 'brandmeetscode-datalayer-tracker' ),
			];
			foreach ( $pro_features as $item ) :
			?>
			<li style="display:flex;align-items:flex-start;gap:8px;font-size:13px;line-height:1.5;">
				<span style="color:#09ba65;flex-shrink:0;font-weight:700;">✓</span>
				<?php echo wp_kses( $item, [] ); ?>
			</li>
			<?php endforeach; ?>
		</ul>
		<a class="button button-primary"
		   style="width:100%;text-align:center;box-sizing:border-box;background:#09ba65;border-color:#08a558;"
		   href="<?php echo esc_url( $sales_url ); ?>"
		   target="_blank"
		   rel="noopener noreferrer">
			<?php echo esc_html__( 'Get Pro Add-on →', 'brandmeetscode-datalayer-tracker' ); ?>
		</a>
	</div>

</div>

<p style="margin-top:20px;max-width:860px;color:#646970;font-size:13px;line-height:1.6;">
	<?php
	echo wp_kses(
		sprintf(
			/* translators: %s: external Pro sales URL */
			__( 'The Pro add-on is a <strong>completely separate, standalone plugin</strong> — it does not require this free version and can be installed on its own. Purchase and download it from <a href="%s" target="_blank" rel="noopener noreferrer">datalayer-tracker.com</a>. No features in this free build are locked, hidden, or time-limited.', 'brandmeetscode-datalayer-tracker' ),
			esc_url( $sales_url )
		),
		[
			'strong' => [],
			'a'      => [ 'href' => true, 'target' => true, 'rel' => true ],
		]
	);
	?>
</p>
</div>
