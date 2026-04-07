<?php
// Ocultar errores en producción: nunca revelar rutas ni stack traces al cliente
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL); // seguir registrando en el log del servidor

function setCors(): void {
    $allowed = ['https://lienzovirtual.com', 'http://localhost:5173'];
    $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Vary: Origin');

    // Cabeceras de seguridad HTTP
    header('X-Frame-Options: DENY');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');

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

// Rate limiting: max $max intentos por IP en una ventana de $windowSecs segundos.
// Crea la tabla si no existe. Lanza err() 429 si se supera el límite.
function checkRateLimit(string $endpoint, int $max = 10, int $windowSecs = 900): void {
    require_once __DIR__ . '/db.php';
    $db = getDB();
    $db->exec("CREATE TABLE IF NOT EXISTS rate_limit (
        ip        VARCHAR(45)  NOT NULL,
        endpoint  VARCHAR(50)  NOT NULL,
        attempts  INT          NOT NULL DEFAULT 1,
        window_start DATETIME  NOT NULL,
        PRIMARY KEY (ip, endpoint)
    )");

    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $ip = trim(explode(',', $ip)[0]); // primer IP si hay proxy

    // Limpiar ventanas caducadas
    $db->prepare('DELETE FROM rate_limit WHERE window_start < DATE_SUB(NOW(), INTERVAL ? SECOND)')
       ->execute([$windowSecs]);

    $st = $db->prepare('SELECT attempts, window_start FROM rate_limit WHERE ip = ? AND endpoint = ?');
    $st->execute([$ip, $endpoint]);
    $row = $st->fetch();

    if ($row) {
        if ($row['attempts'] >= $max) {
            err('Demasiados intentos. Espera unos minutos.', 429);
        }
        $db->prepare('UPDATE rate_limit SET attempts = attempts + 1 WHERE ip = ? AND endpoint = ?')
           ->execute([$ip, $endpoint]);
    } else {
        $db->prepare('INSERT INTO rate_limit (ip, endpoint, attempts, window_start) VALUES (?, ?, 1, NOW())')
           ->execute([$ip, $endpoint]);
    }
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
