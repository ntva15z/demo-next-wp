<?php
/**
 * Payment Gateways Configuration
 * 
 * This file configures WooCommerce payment gateways for the Vietnamese e-commerce store.
 * Includes Cash on Delivery (COD), VNPay, and MoMo payment methods.
 *
 * @package Headless_Theme
 * @subpackage WooCommerce
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Check if WooCommerce is active before proceeding
 */
if (!class_exists('WooCommerce')) {
    return;
}

/**
 * ============================================================================
 * CASH ON DELIVERY (COD) CONFIGURATION
 * Requirements: 8.1
 * ============================================================================
 */

/**
 * Setup Cash on Delivery payment method
 * 
 * Enables and configures COD for Vietnam shipping zones.
 * Requirements: 8.1
 */
function headless_setup_cod_payment() {
    // Only run once
    if (get_option('headless_cod_setup_complete')) {
        return;
    }
    
    // Enable COD payment gateway
    $cod_settings = array(
        'enabled' => 'yes',
        'title' => 'Thanh toán khi nhận hàng (COD)',
        'description' => 'Thanh toán bằng tiền mặt khi nhận hàng. Vui lòng chuẩn bị đúng số tiền.',
        'instructions' => 'Thanh toán bằng tiền mặt khi nhận hàng. Nhân viên giao hàng sẽ thu tiền khi giao hàng thành công.',
        'enable_for_methods' => array(), // Empty means available for all shipping methods
        'enable_for_virtual' => 'no', // Disable for virtual products
    );
    
    update_option('woocommerce_cod_settings', $cod_settings);
    
    // Mark setup as complete
    update_option('headless_cod_setup_complete', true);
}
add_action('woocommerce_init', 'headless_setup_cod_payment', 30);

/**
 * Configure COD availability by shipping zone
 * 
 * Makes COD available for all Vietnam shipping zones.
 * Requirements: 8.1
 * 
 * @param bool $available Whether COD is available
 * @param array $package Shipping package
 * @return bool Modified availability
 */
function headless_cod_availability_by_zone($available, $package) {
    // Get destination country
    $destination_country = isset($package['destination']['country']) ? $package['destination']['country'] : '';
    
    // Only enable COD for Vietnam
    if ($destination_country !== 'VN') {
        return false;
    }
    
    return $available;
}
add_filter('woocommerce_available_payment_gateways', 'headless_filter_cod_by_country');

/**
 * Filter COD payment gateway by country
 * 
 * @param array $gateways Available payment gateways
 * @return array Filtered gateways
 */
function headless_filter_cod_by_country($gateways) {
    if (!is_checkout() && !is_wc_endpoint_url('order-pay')) {
        return $gateways;
    }
    
    // Get customer shipping country
    $shipping_country = WC()->customer ? WC()->customer->get_shipping_country() : '';
    
    // If shipping country is set and not Vietnam, disable COD
    if (!empty($shipping_country) && $shipping_country !== 'VN') {
        if (isset($gateways['cod'])) {
            unset($gateways['cod']);
        }
    }
    
    return $gateways;
}

/**
 * Add COD fee for certain zones (optional)
 * 
 * Can be used to add a small COD handling fee.
 * Currently disabled but available for future use.
 * 
 * @param WC_Cart $cart Cart object
 */
function headless_add_cod_fee($cart) {
    if (is_admin() && !defined('DOING_AJAX')) {
        return;
    }
    
    // Check if COD is selected
    $chosen_payment_method = WC()->session->get('chosen_payment_method');
    
    if ($chosen_payment_method === 'cod') {
        // COD fee is currently 0, but can be configured here
        $cod_fee = 0; // Set to desired amount in VND if needed
        
        if ($cod_fee > 0) {
            $cart->add_fee(__('Phí thu hộ COD', 'headless-theme'), $cod_fee, true);
        }
    }
}
// Uncomment to enable COD fee: add_action('woocommerce_cart_calculate_fees', 'headless_add_cod_fee');


/**
 * ============================================================================
 * VNPAY PAYMENT GATEWAY CONFIGURATION
 * Requirements: 8.2
 * ============================================================================
 */

/**
 * VNPay sandbox/test credentials
 * In production, these should be stored in wp-config.php or environment variables
 */
define('HEADLESS_VNPAY_TMN_CODE', defined('VNPAY_TMN_CODE') ? VNPAY_TMN_CODE : 'VNPAY_SANDBOX_TMN');
define('HEADLESS_VNPAY_HASH_SECRET', defined('VNPAY_HASH_SECRET') ? VNPAY_HASH_SECRET : 'VNPAY_SANDBOX_SECRET');
define('HEADLESS_VNPAY_URL', defined('VNPAY_URL') ? VNPAY_URL : 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
define('HEADLESS_VNPAY_API_URL', defined('VNPAY_API_URL') ? VNPAY_API_URL : 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction');

/**
 * Register VNPay payment gateway
 * 
 * Adds VNPay to the list of available payment gateways.
 * Requirements: 8.2
 * 
 * @param array $gateways List of payment gateway classes
 * @return array Modified list with VNPay added
 */
function headless_add_vnpay_gateway($gateways) {
    $gateways[] = 'WC_Gateway_VNPay_Headless';
    return $gateways;
}
add_filter('woocommerce_payment_gateways', 'headless_add_vnpay_gateway');

/**
 * VNPay Payment Gateway Class
 * 
 * Custom WooCommerce payment gateway for VNPay integration.
 * Requirements: 8.2
 */
class WC_Gateway_VNPay_Headless extends WC_Payment_Gateway {
    
    /**
     * Constructor for the gateway
     */
    public function __construct() {
        $this->id = 'vnpay';
        $this->icon = ''; // URL to VNPay logo
        $this->has_fields = false;
        $this->method_title = 'VNPay';
        $this->method_description = 'Thanh toán qua cổng VNPay - Hỗ trợ ATM, Visa, MasterCard, JCB, QR Code';
        
        // Load settings
        $this->init_form_fields();
        $this->init_settings();
        
        // Define user set variables
        $this->title = $this->get_option('title');
        $this->description = $this->get_option('description');
        $this->enabled = $this->get_option('enabled');
        $this->testmode = 'yes' === $this->get_option('testmode');
        $this->tmn_code = $this->testmode ? HEADLESS_VNPAY_TMN_CODE : $this->get_option('tmn_code');
        $this->hash_secret = $this->testmode ? HEADLESS_VNPAY_HASH_SECRET : $this->get_option('hash_secret');
        
        // Actions
        add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
        add_action('woocommerce_api_vnpay_return', array($this, 'handle_return'));
        add_action('woocommerce_api_vnpay_ipn', array($this, 'handle_ipn'));
    }
    
    /**
     * Initialize gateway settings form fields
     */
    public function init_form_fields() {
        $this->form_fields = array(
            'enabled' => array(
                'title' => 'Kích hoạt/Tắt',
                'type' => 'checkbox',
                'label' => 'Kích hoạt VNPay',
                'default' => 'yes',
            ),
            'title' => array(
                'title' => 'Tiêu đề',
                'type' => 'text',
                'description' => 'Tiêu đề hiển thị cho khách hàng khi thanh toán',
                'default' => 'Thanh toán qua VNPay',
                'desc_tip' => true,
            ),
            'description' => array(
                'title' => 'Mô tả',
                'type' => 'textarea',
                'description' => 'Mô tả phương thức thanh toán',
                'default' => 'Thanh toán an toàn qua VNPay. Hỗ trợ ATM nội địa, Visa, MasterCard, JCB, QR Code.',
            ),
            'testmode' => array(
                'title' => 'Chế độ test',
                'type' => 'checkbox',
                'label' => 'Kích hoạt chế độ Sandbox',
                'default' => 'yes',
                'description' => 'Sử dụng môi trường sandbox để test thanh toán',
            ),
            'tmn_code' => array(
                'title' => 'TMN Code',
                'type' => 'text',
                'description' => 'Mã website (TMN Code) được VNPay cấp',
                'default' => '',
            ),
            'hash_secret' => array(
                'title' => 'Hash Secret',
                'type' => 'password',
                'description' => 'Chuỗi bí mật để tạo checksum',
                'default' => '',
            ),
        );
    }
    
    /**
     * Process the payment
     * 
     * @param int $order_id Order ID
     * @return array Result with redirect URL
     */
    public function process_payment($order_id) {
        $order = wc_get_order($order_id);
        
        // Build VNPay payment URL
        $vnp_url = $this->get_vnpay_payment_url($order);
        
        // Mark order as pending payment
        $order->update_status('pending', __('Đang chờ thanh toán VNPay', 'headless-theme'));
        
        // Empty cart
        WC()->cart->empty_cart();
        
        return array(
            'result' => 'success',
            'redirect' => $vnp_url,
        );
    }
    
    /**
     * Build VNPay payment URL
     * 
     * @param WC_Order $order Order object
     * @return string VNPay payment URL
     */
    private function get_vnpay_payment_url($order) {
        $vnp_TmnCode = $this->tmn_code;
        $vnp_HashSecret = $this->hash_secret;
        $vnp_Url = $this->testmode ? HEADLESS_VNPAY_URL : 'https://pay.vnpay.vn/vpcpay.html';
        $vnp_ReturnUrl = WC()->api_request_url('vnpay_return');
        
        $vnp_TxnRef = $order->get_id() . '_' . time();
        $vnp_OrderInfo = 'Thanh toan don hang #' . $order->get_order_number();
        $vnp_OrderType = 'billpayment';
        $vnp_Amount = $order->get_total() * 100; // VNPay requires amount in smallest currency unit
        $vnp_Locale = 'vn';
        $vnp_IpAddr = $this->get_client_ip();
        $vnp_CreateDate = date('YmdHis');
        
        $inputData = array(
            'vnp_Version' => '2.1.0',
            'vnp_TmnCode' => $vnp_TmnCode,
            'vnp_Amount' => $vnp_Amount,
            'vnp_Command' => 'pay',
            'vnp_CreateDate' => $vnp_CreateDate,
            'vnp_CurrCode' => 'VND',
            'vnp_IpAddr' => $vnp_IpAddr,
            'vnp_Locale' => $vnp_Locale,
            'vnp_OrderInfo' => $vnp_OrderInfo,
            'vnp_OrderType' => $vnp_OrderType,
            'vnp_ReturnUrl' => $vnp_ReturnUrl,
            'vnp_TxnRef' => $vnp_TxnRef,
        );
        
        ksort($inputData);
        $query = '';
        $i = 0;
        $hashdata = '';
        
        foreach ($inputData as $key => $value) {
            if ($i == 1) {
                $hashdata .= '&' . urlencode($key) . '=' . urlencode($value);
            } else {
                $hashdata .= urlencode($key) . '=' . urlencode($value);
                $i = 1;
            }
            $query .= urlencode($key) . '=' . urlencode($value) . '&';
        }
        
        $vnp_Url = $vnp_Url . '?' . $query;
        $vnpSecureHash = hash_hmac('sha512', $hashdata, $vnp_HashSecret);
        $vnp_Url .= 'vnp_SecureHash=' . $vnpSecureHash;
        
        // Store transaction reference in order meta
        $order->update_meta_data('_vnpay_txn_ref', $vnp_TxnRef);
        $order->save();
        
        return $vnp_Url;
    }
    
    /**
     * Handle VNPay return URL
     */
    public function handle_return() {
        $vnp_HashSecret = $this->hash_secret;
        $inputData = array();
        
        foreach ($_GET as $key => $value) {
            if (substr($key, 0, 4) == 'vnp_') {
                $inputData[$key] = $value;
            }
        }
        
        $vnp_SecureHash = isset($inputData['vnp_SecureHash']) ? $inputData['vnp_SecureHash'] : '';
        unset($inputData['vnp_SecureHash']);
        unset($inputData['vnp_SecureHashType']);
        
        ksort($inputData);
        $hashData = '';
        $i = 0;
        
        foreach ($inputData as $key => $value) {
            if ($i == 1) {
                $hashData .= '&' . urlencode($key) . '=' . urlencode($value);
            } else {
                $hashData .= urlencode($key) . '=' . urlencode($value);
                $i = 1;
            }
        }
        
        $secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);
        
        // Get order from transaction reference
        $vnp_TxnRef = isset($inputData['vnp_TxnRef']) ? $inputData['vnp_TxnRef'] : '';
        $order_id = explode('_', $vnp_TxnRef)[0];
        $order = wc_get_order($order_id);
        
        if (!$order) {
            wp_redirect(wc_get_checkout_url());
            exit;
        }
        
        if ($secureHash === $vnp_SecureHash) {
            $vnp_ResponseCode = isset($inputData['vnp_ResponseCode']) ? $inputData['vnp_ResponseCode'] : '';
            
            if ($vnp_ResponseCode == '00') {
                // Payment successful
                $order->payment_complete($vnp_TxnRef);
                $order->add_order_note('Thanh toán VNPay thành công. Mã giao dịch: ' . $vnp_TxnRef);
                wp_redirect($this->get_return_url($order));
            } else {
                // Payment failed
                $order->update_status('failed', 'Thanh toán VNPay thất bại. Mã lỗi: ' . $vnp_ResponseCode);
                wc_add_notice('Thanh toán không thành công. Vui lòng thử lại.', 'error');
                wp_redirect(wc_get_checkout_url());
            }
        } else {
            // Invalid signature
            $order->update_status('failed', 'Chữ ký VNPay không hợp lệ');
            wc_add_notice('Có lỗi xảy ra trong quá trình thanh toán.', 'error');
            wp_redirect(wc_get_checkout_url());
        }
        
        exit;
    }
    
    /**
     * Handle VNPay IPN (Instant Payment Notification)
     */
    public function handle_ipn() {
        $vnp_HashSecret = $this->hash_secret;
        $inputData = array();
        
        foreach ($_GET as $key => $value) {
            if (substr($key, 0, 4) == 'vnp_') {
                $inputData[$key] = $value;
            }
        }
        
        $vnp_SecureHash = isset($inputData['vnp_SecureHash']) ? $inputData['vnp_SecureHash'] : '';
        unset($inputData['vnp_SecureHash']);
        unset($inputData['vnp_SecureHashType']);
        
        ksort($inputData);
        $hashData = '';
        $i = 0;
        
        foreach ($inputData as $key => $value) {
            if ($i == 1) {
                $hashData .= '&' . urlencode($key) . '=' . urlencode($value);
            } else {
                $hashData .= urlencode($key) . '=' . urlencode($value);
                $i = 1;
            }
        }
        
        $secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);
        
        $returnData = array();
        
        if ($secureHash === $vnp_SecureHash) {
            $vnp_TxnRef = isset($inputData['vnp_TxnRef']) ? $inputData['vnp_TxnRef'] : '';
            $order_id = explode('_', $vnp_TxnRef)[0];
            $order = wc_get_order($order_id);
            
            if ($order) {
                $vnp_ResponseCode = isset($inputData['vnp_ResponseCode']) ? $inputData['vnp_ResponseCode'] : '';
                
                if ($vnp_ResponseCode == '00') {
                    if ($order->get_status() !== 'completed' && $order->get_status() !== 'processing') {
                        $order->payment_complete($vnp_TxnRef);
                        $order->add_order_note('IPN: Thanh toán VNPay thành công. Mã giao dịch: ' . $vnp_TxnRef);
                    }
                    $returnData['RspCode'] = '00';
                    $returnData['Message'] = 'Confirm Success';
                } else {
                    $returnData['RspCode'] = '00';
                    $returnData['Message'] = 'Confirm Success';
                }
            } else {
                $returnData['RspCode'] = '01';
                $returnData['Message'] = 'Order not found';
            }
        } else {
            $returnData['RspCode'] = '97';
            $returnData['Message'] = 'Invalid signature';
        }
        
        echo json_encode($returnData);
        exit;
    }
    
    /**
     * Get client IP address
     * 
     * @return string Client IP
     */
    private function get_client_ip() {
        $ipaddress = '';
        
        if (isset($_SERVER['HTTP_CLIENT_IP'])) {
            $ipaddress = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ipaddress = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } elseif (isset($_SERVER['HTTP_X_FORWARDED'])) {
            $ipaddress = $_SERVER['HTTP_X_FORWARDED'];
        } elseif (isset($_SERVER['HTTP_FORWARDED_FOR'])) {
            $ipaddress = $_SERVER['HTTP_FORWARDED_FOR'];
        } elseif (isset($_SERVER['HTTP_FORWARDED'])) {
            $ipaddress = $_SERVER['HTTP_FORWARDED'];
        } elseif (isset($_SERVER['REMOTE_ADDR'])) {
            $ipaddress = $_SERVER['REMOTE_ADDR'];
        } else {
            $ipaddress = '127.0.0.1';
        }
        
        return $ipaddress;
    }
}

/**
 * Initialize VNPay gateway class after plugins loaded
 */
function headless_init_vnpay_gateway() {
    if (!class_exists('WC_Payment_Gateway')) {
        return;
    }
    // Class is already defined above
}
add_action('plugins_loaded', 'headless_init_vnpay_gateway', 11);


/**
 * ============================================================================
 * MOMO PAYMENT GATEWAY CONFIGURATION
 * Requirements: 8.3
 * ============================================================================
 */

/**
 * MoMo sandbox/test credentials
 * In production, these should be stored in wp-config.php or environment variables
 */
define('HEADLESS_MOMO_PARTNER_CODE', defined('MOMO_PARTNER_CODE') ? MOMO_PARTNER_CODE : 'MOMO_SANDBOX_PARTNER');
define('HEADLESS_MOMO_ACCESS_KEY', defined('MOMO_ACCESS_KEY') ? MOMO_ACCESS_KEY : 'MOMO_SANDBOX_ACCESS_KEY');
define('HEADLESS_MOMO_SECRET_KEY', defined('MOMO_SECRET_KEY') ? MOMO_SECRET_KEY : 'MOMO_SANDBOX_SECRET_KEY');
define('HEADLESS_MOMO_ENDPOINT', defined('MOMO_ENDPOINT') ? MOMO_ENDPOINT : 'https://test-payment.momo.vn/v2/gateway/api/create');

/**
 * Register MoMo payment gateway
 * 
 * Adds MoMo to the list of available payment gateways.
 * Requirements: 8.3
 * 
 * @param array $gateways List of payment gateway classes
 * @return array Modified list with MoMo added
 */
function headless_add_momo_gateway($gateways) {
    $gateways[] = 'WC_Gateway_MoMo_Headless';
    return $gateways;
}
add_filter('woocommerce_payment_gateways', 'headless_add_momo_gateway');

/**
 * MoMo Payment Gateway Class
 * 
 * Custom WooCommerce payment gateway for MoMo integration.
 * Requirements: 8.3
 */
class WC_Gateway_MoMo_Headless extends WC_Payment_Gateway {
    
    /**
     * Constructor for the gateway
     */
    public function __construct() {
        $this->id = 'momo';
        $this->icon = ''; // URL to MoMo logo
        $this->has_fields = false;
        $this->method_title = 'MoMo';
        $this->method_description = 'Thanh toán qua ví điện tử MoMo';
        
        // Load settings
        $this->init_form_fields();
        $this->init_settings();
        
        // Define user set variables
        $this->title = $this->get_option('title');
        $this->description = $this->get_option('description');
        $this->enabled = $this->get_option('enabled');
        $this->testmode = 'yes' === $this->get_option('testmode');
        $this->partner_code = $this->testmode ? HEADLESS_MOMO_PARTNER_CODE : $this->get_option('partner_code');
        $this->access_key = $this->testmode ? HEADLESS_MOMO_ACCESS_KEY : $this->get_option('access_key');
        $this->secret_key = $this->testmode ? HEADLESS_MOMO_SECRET_KEY : $this->get_option('secret_key');
        
        // Actions
        add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
        add_action('woocommerce_api_momo_return', array($this, 'handle_return'));
        add_action('woocommerce_api_momo_ipn', array($this, 'handle_ipn'));
    }
    
    /**
     * Initialize gateway settings form fields
     */
    public function init_form_fields() {
        $this->form_fields = array(
            'enabled' => array(
                'title' => 'Kích hoạt/Tắt',
                'type' => 'checkbox',
                'label' => 'Kích hoạt MoMo',
                'default' => 'yes',
            ),
            'title' => array(
                'title' => 'Tiêu đề',
                'type' => 'text',
                'description' => 'Tiêu đề hiển thị cho khách hàng khi thanh toán',
                'default' => 'Thanh toán qua MoMo',
                'desc_tip' => true,
            ),
            'description' => array(
                'title' => 'Mô tả',
                'type' => 'textarea',
                'description' => 'Mô tả phương thức thanh toán',
                'default' => 'Thanh toán nhanh chóng và an toàn qua ví điện tử MoMo.',
            ),
            'testmode' => array(
                'title' => 'Chế độ test',
                'type' => 'checkbox',
                'label' => 'Kích hoạt chế độ Sandbox',
                'default' => 'yes',
                'description' => 'Sử dụng môi trường sandbox để test thanh toán',
            ),
            'partner_code' => array(
                'title' => 'Partner Code',
                'type' => 'text',
                'description' => 'Mã đối tác được MoMo cấp',
                'default' => '',
            ),
            'access_key' => array(
                'title' => 'Access Key',
                'type' => 'text',
                'description' => 'Access Key được MoMo cấp',
                'default' => '',
            ),
            'secret_key' => array(
                'title' => 'Secret Key',
                'type' => 'password',
                'description' => 'Secret Key để tạo chữ ký',
                'default' => '',
            ),
        );
    }
    
    /**
     * Process the payment
     * 
     * @param int $order_id Order ID
     * @return array Result with redirect URL
     */
    public function process_payment($order_id) {
        $order = wc_get_order($order_id);
        
        // Build MoMo payment request
        $momo_response = $this->create_momo_payment($order);
        
        if ($momo_response && isset($momo_response['payUrl'])) {
            // Mark order as pending payment
            $order->update_status('pending', __('Đang chờ thanh toán MoMo', 'headless-theme'));
            
            // Empty cart
            WC()->cart->empty_cart();
            
            return array(
                'result' => 'success',
                'redirect' => $momo_response['payUrl'],
            );
        } else {
            $error_message = isset($momo_response['message']) ? $momo_response['message'] : 'Không thể kết nối đến MoMo';
            wc_add_notice('Lỗi thanh toán MoMo: ' . $error_message, 'error');
            return array(
                'result' => 'failure',
            );
        }
    }
    
    /**
     * Create MoMo payment request
     * 
     * @param WC_Order $order Order object
     * @return array|false MoMo API response or false on failure
     */
    private function create_momo_payment($order) {
        $endpoint = $this->testmode ? HEADLESS_MOMO_ENDPOINT : 'https://payment.momo.vn/v2/gateway/api/create';
        
        $partnerCode = $this->partner_code;
        $accessKey = $this->access_key;
        $secretKey = $this->secret_key;
        
        $orderId = $order->get_id() . '_' . time();
        $requestId = $orderId;
        $amount = (int) $order->get_total();
        $orderInfo = 'Thanh toan don hang #' . $order->get_order_number();
        $redirectUrl = WC()->api_request_url('momo_return');
        $ipnUrl = WC()->api_request_url('momo_ipn');
        $extraData = base64_encode(json_encode(array('order_id' => $order->get_id())));
        $requestType = 'captureWallet';
        
        // Create signature
        $rawHash = 'accessKey=' . $accessKey .
                   '&amount=' . $amount .
                   '&extraData=' . $extraData .
                   '&ipnUrl=' . $ipnUrl .
                   '&orderId=' . $orderId .
                   '&orderInfo=' . $orderInfo .
                   '&partnerCode=' . $partnerCode .
                   '&redirectUrl=' . $redirectUrl .
                   '&requestId=' . $requestId .
                   '&requestType=' . $requestType;
        
        $signature = hash_hmac('sha256', $rawHash, $secretKey);
        
        $data = array(
            'partnerCode' => $partnerCode,
            'partnerName' => 'Headless Store',
            'storeId' => $partnerCode,
            'requestId' => $requestId,
            'amount' => $amount,
            'orderId' => $orderId,
            'orderInfo' => $orderInfo,
            'redirectUrl' => $redirectUrl,
            'ipnUrl' => $ipnUrl,
            'lang' => 'vi',
            'extraData' => $extraData,
            'requestType' => $requestType,
            'signature' => $signature,
        );
        
        // Store order reference
        $order->update_meta_data('_momo_order_id', $orderId);
        $order->update_meta_data('_momo_request_id', $requestId);
        $order->save();
        
        // Send request to MoMo
        $response = wp_remote_post($endpoint, array(
            'method' => 'POST',
            'timeout' => 30,
            'headers' => array(
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode($data),
        ));
        
        if (is_wp_error($response)) {
            return false;
        }
        
        $body = wp_remote_retrieve_body($response);
        return json_decode($body, true);
    }
    
    /**
     * Handle MoMo return URL
     */
    public function handle_return() {
        $resultCode = isset($_GET['resultCode']) ? $_GET['resultCode'] : '';
        $orderId = isset($_GET['orderId']) ? $_GET['orderId'] : '';
        $message = isset($_GET['message']) ? $_GET['message'] : '';
        
        // Extract WooCommerce order ID from MoMo order ID
        $wc_order_id = explode('_', $orderId)[0];
        $order = wc_get_order($wc_order_id);
        
        if (!$order) {
            wp_redirect(wc_get_checkout_url());
            exit;
        }
        
        // Verify signature
        if ($this->verify_momo_signature($_GET)) {
            if ($resultCode == '0') {
                // Payment successful
                $transId = isset($_GET['transId']) ? $_GET['transId'] : '';
                $order->payment_complete($transId);
                $order->add_order_note('Thanh toán MoMo thành công. Mã giao dịch: ' . $transId);
                wp_redirect($this->get_return_url($order));
            } else {
                // Payment failed
                $order->update_status('failed', 'Thanh toán MoMo thất bại: ' . $message);
                wc_add_notice('Thanh toán không thành công: ' . $message, 'error');
                wp_redirect(wc_get_checkout_url());
            }
        } else {
            // Invalid signature
            $order->update_status('failed', 'Chữ ký MoMo không hợp lệ');
            wc_add_notice('Có lỗi xảy ra trong quá trình thanh toán.', 'error');
            wp_redirect(wc_get_checkout_url());
        }
        
        exit;
    }
    
    /**
     * Handle MoMo IPN (Instant Payment Notification)
     */
    public function handle_ipn() {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(array('message' => 'Invalid request'));
            exit;
        }
        
        $orderId = isset($data['orderId']) ? $data['orderId'] : '';
        $resultCode = isset($data['resultCode']) ? $data['resultCode'] : '';
        
        // Extract WooCommerce order ID
        $wc_order_id = explode('_', $orderId)[0];
        $order = wc_get_order($wc_order_id);
        
        if (!$order) {
            http_response_code(404);
            echo json_encode(array('message' => 'Order not found'));
            exit;
        }
        
        // Verify signature
        if ($this->verify_momo_ipn_signature($data)) {
            if ($resultCode == '0') {
                if ($order->get_status() !== 'completed' && $order->get_status() !== 'processing') {
                    $transId = isset($data['transId']) ? $data['transId'] : '';
                    $order->payment_complete($transId);
                    $order->add_order_note('IPN: Thanh toán MoMo thành công. Mã giao dịch: ' . $transId);
                }
            }
            
            http_response_code(204);
        } else {
            http_response_code(400);
            echo json_encode(array('message' => 'Invalid signature'));
        }
        
        exit;
    }
    
    /**
     * Verify MoMo return signature
     * 
     * @param array $data Return data
     * @return bool True if signature is valid
     */
    private function verify_momo_signature($data) {
        $accessKey = $this->access_key;
        $secretKey = $this->secret_key;
        
        $signature = isset($data['signature']) ? $data['signature'] : '';
        
        $rawHash = 'accessKey=' . $accessKey .
                   '&amount=' . (isset($data['amount']) ? $data['amount'] : '') .
                   '&extraData=' . (isset($data['extraData']) ? $data['extraData'] : '') .
                   '&message=' . (isset($data['message']) ? $data['message'] : '') .
                   '&orderId=' . (isset($data['orderId']) ? $data['orderId'] : '') .
                   '&orderInfo=' . (isset($data['orderInfo']) ? $data['orderInfo'] : '') .
                   '&orderType=' . (isset($data['orderType']) ? $data['orderType'] : '') .
                   '&partnerCode=' . (isset($data['partnerCode']) ? $data['partnerCode'] : '') .
                   '&payType=' . (isset($data['payType']) ? $data['payType'] : '') .
                   '&requestId=' . (isset($data['requestId']) ? $data['requestId'] : '') .
                   '&responseTime=' . (isset($data['responseTime']) ? $data['responseTime'] : '') .
                   '&resultCode=' . (isset($data['resultCode']) ? $data['resultCode'] : '') .
                   '&transId=' . (isset($data['transId']) ? $data['transId'] : '');
        
        $expectedSignature = hash_hmac('sha256', $rawHash, $secretKey);
        
        return $signature === $expectedSignature;
    }
    
    /**
     * Verify MoMo IPN signature
     * 
     * @param array $data IPN data
     * @return bool True if signature is valid
     */
    private function verify_momo_ipn_signature($data) {
        $accessKey = $this->access_key;
        $secretKey = $this->secret_key;
        
        $signature = isset($data['signature']) ? $data['signature'] : '';
        
        $rawHash = 'accessKey=' . $accessKey .
                   '&amount=' . (isset($data['amount']) ? $data['amount'] : '') .
                   '&extraData=' . (isset($data['extraData']) ? $data['extraData'] : '') .
                   '&message=' . (isset($data['message']) ? $data['message'] : '') .
                   '&orderId=' . (isset($data['orderId']) ? $data['orderId'] : '') .
                   '&orderInfo=' . (isset($data['orderInfo']) ? $data['orderInfo'] : '') .
                   '&orderType=' . (isset($data['orderType']) ? $data['orderType'] : '') .
                   '&partnerCode=' . (isset($data['partnerCode']) ? $data['partnerCode'] : '') .
                   '&payType=' . (isset($data['payType']) ? $data['payType'] : '') .
                   '&requestId=' . (isset($data['requestId']) ? $data['requestId'] : '') .
                   '&responseTime=' . (isset($data['responseTime']) ? $data['responseTime'] : '') .
                   '&resultCode=' . (isset($data['resultCode']) ? $data['resultCode'] : '') .
                   '&transId=' . (isset($data['transId']) ? $data['transId'] : '');
        
        $expectedSignature = hash_hmac('sha256', $rawHash, $secretKey);
        
        return $signature === $expectedSignature;
    }
}

/**
 * Initialize MoMo gateway class after plugins loaded
 */
function headless_init_momo_gateway() {
    if (!class_exists('WC_Payment_Gateway')) {
        return;
    }
    // Class is already defined above
}
add_action('plugins_loaded', 'headless_init_momo_gateway', 11);

/**
 * ============================================================================
 * PAYMENT GATEWAY UTILITIES
 * ============================================================================
 */

/**
 * Update order status and send confirmation after payment completion
 * 
 * Requirements: 8.4
 * 
 * @param int $order_id Order ID
 * @param string $old_status Old order status
 * @param string $new_status New order status
 */
function headless_payment_complete_notification($order_id, $old_status, $new_status) {
    // Only trigger for payment completion transitions
    if ($new_status === 'processing' || $new_status === 'completed') {
        $order = wc_get_order($order_id);
        
        if (!$order) {
            return;
        }
        
        // Get payment method
        $payment_method = $order->get_payment_method();
        
        // Log payment completion
        $order->add_order_note(sprintf(
            __('Thanh toán hoàn tất qua %s. Đơn hàng đang được xử lý.', 'headless-theme'),
            $order->get_payment_method_title()
        ));
    }
}
add_action('woocommerce_order_status_changed', 'headless_payment_complete_notification', 10, 3);

/**
 * Add payment gateway information to REST API
 */
function headless_add_payment_info_to_rest_api() {
    register_rest_route('headless/v1', '/payment/methods', array(
        'methods' => 'GET',
        'callback' => 'headless_get_payment_methods_api',
        'permission_callback' => '__return_true',
    ));
}
add_action('rest_api_init', 'headless_add_payment_info_to_rest_api');

/**
 * REST API callback to get available payment methods
 * 
 * @return WP_REST_Response
 */
function headless_get_payment_methods_api() {
    $available_gateways = WC()->payment_gateways()->get_available_payment_gateways();
    
    $methods = array();
    
    foreach ($available_gateways as $gateway_id => $gateway) {
        $methods[] = array(
            'id' => $gateway_id,
            'title' => $gateway->get_title(),
            'description' => $gateway->get_description(),
            'icon' => $gateway->get_icon(),
            'enabled' => $gateway->is_available(),
        );
    }
    
    return new WP_REST_Response(array(
        'payment_methods' => $methods,
    ), 200);
}

/**
 * Ensure payment gateways are properly ordered
 * COD should be last option
 */
function headless_order_payment_gateways($gateways) {
    // Move COD to the end
    if (isset($gateways['cod'])) {
        $cod = $gateways['cod'];
        unset($gateways['cod']);
        $gateways['cod'] = $cod;
    }
    
    return $gateways;
}
add_filter('woocommerce_available_payment_gateways', 'headless_order_payment_gateways', 100);
