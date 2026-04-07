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

function body(int $maxBytes = 65536): array {
    $raw = file_get_contents('php://input', false, null, 0, $maxBytes + 1);
    if (strlen($raw) > $maxBytes) err('Payload demasiado grande', 413);
    return json_decode($raw, true) ?? [];
}

function requireFloat(array $b, string $key, float $min = 0): float {
    if (!isset($b[$key]) || !is_numeric($b[$key])) err("Campo '$key' requerido y debe ser numérico");
    $v = (float)$b[$key];
    if ($v < $min) err("Campo '$key' debe ser >= $min");
    return $v;
}

function requireInt(array $b, string $key, int $min = 0): int {
    if (!isset($b[$key]) || !is_numeric($b[$key])) err("Campo '$key' requerido y debe ser numérico");
    $v = (int)$b[$key];
    if ($v < $min) err("Campo '$key' debe ser >= $min");
    return $v;
}

function requireDate(array $b, string $key): string {
    $v = trim($b[$key] ?? '');
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) || !checkdate((int)substr($v,5,2), (int)substr($v,8,2), (int)substr($v,0,4)))
        err("Campo '$key' debe ser una fecha válida (YYYY-MM-DD)");
    return $v;
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

    // Añadir columna last_used_at si aún no existe (migración silenciosa)
    try {
        $db->exec('ALTER TABLE sessions ADD COLUMN last_used_at DATETIME NULL');
    } catch (PDOException $e) { /* ya existe, ignorar */ }

    $st = $db->prepare(
        'SELECT v.id, v.plate, v.vehicle_model
         FROM sessions s
         JOIN vehicles v ON v.id = s.vehicle_id
         WHERE s.token = ?
           AND s.expires_at > NOW()
           AND (s.last_used_at IS NULL OR s.last_used_at > DATE_SUB(NOW(), INTERVAL 7 DAY))'
    );
    $st->execute([$token]);
    $v = $st->fetch();
    if (!$v) err('Sesión expirada', 401);

    // Actualizar último uso
    $db->prepare('UPDATE sessions SET last_used_at = NOW() WHERE token = ?')
       ->execute([$token]);

    return $v;
}
