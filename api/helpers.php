<?php
function setCors(): void {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
    header('Content-Type: application/json; charset=utf-8');
}

function json(mixed $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function err(string $msg, int $status = 400): never {
    json(['error' => $msg], $status);
}

function body(): array {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function requireAuth(): array {
    require_once __DIR__ . '/db.php';
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/Bearer\s+(.+)/i', $header, $m)) {
        err('No autorizado', 401);
    }
    $token = $m[1];
    $db = getDB();
    $st = $db->prepare(
        'SELECT v.id, v.plate, v.vehicle_model
         FROM sessions s
         JOIN vehicles v ON v.id = s.vehicle_id
         WHERE s.token = ? AND s.expires_at > NOW()'
    );
    $st->execute([$token]);
    $v = $st->fetch();
    if (!$v) err('Sesión expirada', 401);
    return $v;
}
