<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
setCors();

$vehicle = requireAuth();
$vid = $vehicle['id'];
$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

try {
$db->exec("CREATE TABLE IF NOT EXISTS maintenance (
  id VARCHAR(36) PRIMARY KEY,
  vehicle_id INT NOT NULL,
  date DATE NOT NULL,
  odometer INT UNSIGNED NULL,
  next_date DATE NULL,
  next_odometer INT UNSIGNED NULL,
  type VARCHAR(30) NOT NULL DEFAULT 'annual',
  workshop VARCHAR(150) NULL,
  workshop_phone VARCHAR(30) NULL,
  price DECIMAL(10,2) NULL,
  items_checked TEXT NULL,
  notes TEXT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'done',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vehicle (vehicle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $db->exec("ALTER TABLE maintenance MODIFY COLUMN id VARCHAR(36) NOT NULL");
} catch (PDOException $e) { err('Error al inicializar tabla: ' . $e->getMessage(), 500); }

function mapService(array $r): array {
    return [
        'id'            => $r['id'],
        'date'          => $r['date'],
        'odometer'      => $r['odometer']      !== null ? (int)$r['odometer']      : null,
        'nextDate'      => $r['next_date'],
        'nextOdometer'  => $r['next_odometer'] !== null ? (int)$r['next_odometer'] : null,
        'type'          => $r['type'],
        'workshop'      => $r['workshop'],
        'workshopPhone' => $r['workshop_phone'],
        'price'         => $r['price']         !== null ? (float)$r['price']       : null,
        'itemsChecked'  => $r['items_checked'] ? json_decode($r['items_checked'], true) : [],
        'notes'         => $r['notes'],
        'status'        => $r['status'],
    ];
}

if ($method === 'GET') {
    $st = $db->prepare('SELECT * FROM maintenance WHERE vehicle_id = ? ORDER BY date DESC');
    $st->execute([$vid]);
    json(array_map('mapService', $st->fetchAll()));
}

if ($method === 'POST') {
    $b = body();
    $id = $b['id'] ?? bin2hex(random_bytes(16));
    $db->prepare(
        'INSERT INTO maintenance (id, vehicle_id, date, odometer, next_date, next_odometer,
         type, workshop, workshop_phone, price, items_checked, notes, status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $id, $vid,
        $b['date'],
        $b['odometer']      ?? null,
        $b['nextDate']      ?? null,
        $b['nextOdometer']  ?? null,
        $b['type']          ?? 'annual',
        $b['workshop']      ?? null,
        $b['workshopPhone'] ?? null,
        isset($b['price'])  ? (float)$b['price'] : null,
        isset($b['itemsChecked']) ? json_encode($b['itemsChecked']) : null,
        $b['notes']  ?? null,
        $b['status'] ?? 'done',
    ]);
    json(['id' => $id, 'ok' => true], 201);
}

if ($method === 'PUT') {
    $b = body();
    $id = $_GET['id'] ?? '';
    $st = $db->prepare('SELECT id FROM maintenance WHERE id = ? AND vehicle_id = ?');
    $st->execute([$id, $vid]);
    if (!$st->fetch()) err('Not found', 404);
    $db->prepare(
        'UPDATE maintenance SET date=?, odometer=?, next_date=?, next_odometer=?,
         type=?, workshop=?, workshop_phone=?, price=?, items_checked=?, notes=?, status=?
         WHERE id=? AND vehicle_id=?'
    )->execute([
        $b['date'],
        $b['odometer']      ?? null,
        $b['nextDate']      ?? null,
        $b['nextOdometer']  ?? null,
        $b['type']          ?? 'annual',
        $b['workshop']      ?? null,
        $b['workshopPhone'] ?? null,
        isset($b['price'])  ? (float)$b['price'] : null,
        isset($b['itemsChecked']) ? json_encode($b['itemsChecked']) : null,
        $b['notes']  ?? null,
        $b['status'] ?? 'done',
        $id, $vid,
    ]);
    json(['ok' => true]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    $db->prepare('DELETE FROM maintenance WHERE id = ? AND vehicle_id = ?')->execute([$id, $vid]);
    json(['ok' => true]);
}
