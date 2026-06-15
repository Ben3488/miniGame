<?php
/* ==========================================================================
   兒童表現計分板 - NAS 後端 JSON 資料同步 API (api.php)
   ========================================================================== */

header('Content-Type: application/json; charset=utf-8');

// 資料儲存設定
$dataDir = __DIR__ . '/data';
$dataFile = $dataDir . '/scoreboard_data.json';
$htaccessFile = $dataDir . '/.htaccess';

// 自動建立資料夾並寫入安全防護
if (!is_dir($dataDir)) {
    if (!mkdir($dataDir, 0755, true)) {
        echo json_encode(['success' => false, 'message' => '無法建立資料儲存目錄']);
        exit;
    }
}

// 寫入 Apache/Web Station .htaccess 防護，防止外部直接下載 JSON 檔案
if (!file_exists($htaccessFile)) {
    @file_put_contents($htaccessFile, "Deny from all");
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (file_exists($dataFile)) {
        $content = @file_get_contents($dataFile);
        if ($content === false) {
            echo json_encode(['success' => false, 'message' => '無法讀取資料檔']);
            exit;
        }
        echo $content;
    } else {
        // 返回空狀態，讓前端使用預設資料初始化
        echo json_encode(['status' => 'empty']);
    }
    exit;
}

if ($method === 'POST') {
    // 讀取請求的 JSON 負載
    $input = file_get_contents('php://input');
    $decoded = json_decode($input, true);

    if ($decoded === null) {
        echo json_encode(['success' => false, 'message' => '無效的 JSON 請求']);
        exit;
    }

    // 基本資料結構欄位防呆驗證
    if (!isset($decoded['kids']) || !is_array($decoded['kids'])) {
        echo json_encode(['success' => false, 'message' => '無效的資料格式，缺少 kids 陣列']);
        exit;
    }

    // 格式化寫入 JSON 檔，保護非 ASCII 字元 (如中文)
    $jsonFlags = JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT;
    $bytesWritten = @file_put_contents($dataFile, json_encode($decoded, $jsonFlags));

    if ($bytesWritten === false) {
        echo json_encode(['success' => false, 'message' => '資料寫入 NAS 失敗，請檢查權限設定']);
        exit;
    }

    echo json_encode(['success' => true]);
    exit;
}

// 不支援的 HTTP 方法
http_response_code(405);
echo json_encode(['success' => false, 'message' => '不支援的請求方法']);
