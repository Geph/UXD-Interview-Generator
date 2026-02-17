<?php
/**
 * InsightPro PHP Bridge Relay
 * Upload this file to your web server.
 */

// Allow cross-origin requests from your app
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Health Check Endpoint
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['status' => 'ok', 'message' => 'PHP Bridge Relay is active.']);
    exit;
}

// Handle POST request (Data Sync)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $payload = json_decode($json, true);

    if (!$payload) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON payload']);
        exit;
    }

    $config = $payload['config'];
    $data = $payload['data'];

    try {
        // Build DSN
        $dsn = "mysql:host={$config['HOST']};dbname={$config['DATABASE']};charset=utf8mb4";
        
        // Connect via PDO
        $pdo = new PDO($dsn, $config['USER'], $config['PASSWORD'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);

        // Prepare Insert
        $sql = "INSERT INTO {$config['TABLE']} 
                (study_name, respondent_id, interview_json, summary_text, created_at) 
                VALUES (?, ?, ?, ?, ?)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data['study_name'],
            $data['respondent_id'],
            $data['interview_json'],
            $data['summary_text'],
            $data['timestamp']
        ]);

        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database Error: ' . $e->getMessage()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'General Error: ' . $e->getMessage()]);
    }
}
?>