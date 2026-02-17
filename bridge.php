<?php
/**
 * Robot Interviewer PHP Bridge Relay
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['status' => 'ok', 'message' => 'Bridge is active.']);
    exit;
}

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
    $type = $payload['type'] ?? 'response'; // 'study' or 'response'

    try {
        $dsn = "mysql:host={$config['HOST']};dbname={$config['DATABASE']};charset=utf8mb4";
        $pdo = new PDO($dsn, $config['USER'], $config['PASSWORD'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);

        if ($type === 'study') {
            $sql = "INSERT INTO studies (name, goal, questions_json, created_at) VALUES (?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $data['name'],
                $data['goal'],
                $data['questions_json'],
                $data['timestamp']
            ]);
        } else {
            $sql = "INSERT INTO interview_responses (study_name, respondent_id, interview_json, summary_text, created_at) VALUES (?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $data['study_name'],
                $data['respondent_id'],
                $data['interview_json'],
                $data['summary_text'],
                $data['timestamp']
            ]);
        }

        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'type' => $type]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database Error: ' . $e->getMessage()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'General Error: ' . $e->getMessage()]);
    }
}
?>