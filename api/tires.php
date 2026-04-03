<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
setCors();

$vehicle = requireAuth();
$vid = $vehicle['id'];
$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

// Create table if not exists
$db->exec("CREATE TABLE IF NOT EXISTS tires (
  id VARCHAR(32) PRIMARY KEY,
  vehicle_id INT NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,
  size VARCHAR(30) NOT NULL,
  position VARCHAR(20) NOT NULL,
  purchase_date DATE NOT NULL,
  purchase_price DECIMAL(8,2) NULL,
  odometer_at_install INT UNSIGNED NOT NULL DEFAULT 0,
  estimated_life_km INT UNSIGNED NOT NULL DEFAULT 40000,
  tread_depth_mm DECIMAL(4,1) NULL,
  estimated_change_date DATE NULL,
  dot_code VARCHAR(10) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vehicle (vehicle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

function mapTire(array $r): array {
    return [
        'id'                 => $r['id'],
        'brand'              => $r['brand'],
        'model'              => $r['model_name'],
        'type'               => $r['type'],
        'size'               => $r['size'],
        'position'           => $r['position'],
        'purchaseDate'       => $r['purchase_date'],
        'purchasePrice'      => $r['purchase_price'] !== null ? (float)$r['purchase_price'] : null,
        'odometerAtInstall'  => (int)$r['odometer_at_install'],
        'estimatedLifeKm'    => (int)$r['estimated_life_km'],
        'treadDepthMm'       => $r['tread_depth_mm'] !== null ? (float)$r['tread_depth_mm'] : null,
        'estimatedChangeDate'=> $r['estimated_change_date'],
        'dotCode'            => $r['dot_code'],
        'notes'              => $r['notes'],
    ];
}

if ($method === 'GET') {
    $st = $db->prepare('SELECT * FROM tires WHERE vehicle_id = ? ORDER BY position ASC');
    $st->execute([$vid]);
    json(array_map('mapTire', $st->fetchAll()));
}

if ($method === 'POST') {
    $b = body();
    $id = $b['id'] ?? bin2hex(random_bytes(16));
    $db->prepare(
        'INSERT INTO tires (id, vehicle_id, brand, model_name, type, size, position,
         purchase_date, purchase_price, odometer_at_install, estimated_life_km,
         tread_depth_mm, estimated_change_date, dot_code, notes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $id, $vid,
        $b['brand'], $b['model'], $b['type'], $b['size'], $b['position'],
        $b['purchaseDate'],
        isset($b['purchasePrice'])       ? (float)$b['purchasePrice']       : null,
        (int)($b['odometerAtInstall']    ?? 0),
        (int)($b['estimatedLifeKm']      ?? 40000),
        isset($b['treadDepthMm'])        ? (float)$b['treadDepthMm']        : null,
        $b['estimatedChangeDate']        ?? null,
        $b['dotCode']                    ?? null,
        $b['notes']                      ?? null,
    ]);
    json(['id' => $id, 'ok' => true], 201);
}

if ($method === 'PUT') {
    $b = body();
    $id = $_GET['id'] ?? '';
    $st = $db->prepare('SELECT id FROM tires WHERE id = ? AND vehicle_id = ?');
    $st->execute([$id, $vid]);
    if (!$st->fetch()) { jsonError('Not found', 404); }
    $db->prepare(
        'UPDATE tires SET brand=?, model_name=?, type=?, size=?, position=?,
         purchase_date=?, purchase_price=?, odometer_at_install=?, estimated_life_km=?,
         tread_depth_mm=?, estimated_change_date=?, dot_code=?, notes=?
         WHERE id=? AND vehicle_id=?'
    )->execute([
        $b['brand'], $b['model'], $b['type'], $b['size'], $b['position'],
        $b['purchaseDate'],
        isset($b['purchasePrice'])       ? (float)$b['purchasePrice']       : null,
        (int)($b['odometerAtInstall']    ?? 0),
        (int)($b['estimatedLifeKm']      ?? 40000),
        isset($b['treadDepthMm'])        ? (float)$b['treadDepthMm']        : null,
        $b['estimatedChangeDate']        ?? null,
        $b['dotCode']                    ?? null,
        $b['notes']                      ?? null,
        $id, $vid,
    ]);
    json(['ok' => true]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    $db->prepare('DELETE FROM tires WHERE id = ? AND vehicle_id = ?')->execute([$id, $vid]);
    json(['ok' => true]);
}
