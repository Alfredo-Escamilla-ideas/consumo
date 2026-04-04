<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
setCors();

$vehicle = requireAuth();
$vid = $vehicle['id'];
$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

try {
$db->exec("CREATE TABLE IF NOT EXISTS repairs (
  id VARCHAR(36) PRIMARY KEY,
  vehicle_id INT NOT NULL,
  date DATE NOT NULL,
  odometer INT UNSIGNED NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'mechanical',
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  description TEXT NOT NULL,
  diagnosis TEXT NULL,
  workshop VARCHAR(150) NULL,
  workshop_phone VARCHAR(30) NULL,
  parts_affected TEXT NULL,
  estimate_price DECIMAL(10,2) NULL,
  final_price DECIMAL(10,2) NULL,
  repair_days INT UNSIGNED NULL,
  warranty_claim TINYINT(1) NOT NULL DEFAULT 0,
  invoice_number VARCHAR(100) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vehicle (vehicle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $db->exec("ALTER TABLE repairs MODIFY COLUMN id VARCHAR(36) NOT NULL");
} catch (PDOException $e) { err('Error al inicializar tabla: ' . $e->getMessage(), 500); }

function mapRepair(array $r): array {
    return [
        'id'            => $r['id'],
        'date'          => $r['date'],
        'odometer'      => $r['odometer'] !== null ? (int)$r['odometer'] : null,
        'type'          => $r['type'],
        'status'        => $r['status'],
        'description'   => $r['description'],
        'diagnosis'     => $r['diagnosis'],
        'workshop'      => $r['workshop'],
        'workshopPhone' => $r['workshop_phone'],
        'partsAffected' => $r['parts_affected'] ? json_decode($r['parts_affected'], true) : [],
        'estimatePrice' => $r['estimate_price'] !== null ? (float)$r['estimate_price'] : null,
        'finalPrice'    => $r['final_price']    !== null ? (float)$r['final_price']    : null,
        'repairDays'    => $r['repair_days']    !== null ? (int)$r['repair_days']      : null,
        'warrantyClaim' => (bool)$r['warranty_claim'],
        'invoiceNumber' => $r['invoice_number'],
        'notes'         => $r['notes'],
    ];
}

if ($method === 'GET') {
    $st = $db->prepare('SELECT * FROM repairs WHERE vehicle_id = ? ORDER BY date DESC');
    $st->execute([$vid]);
    json(array_map('mapRepair', $st->fetchAll()));
}

if ($method === 'POST') {
    $b = body();
    $id = $b['id'] ?? bin2hex(random_bytes(16));
    $db->prepare(
        'INSERT INTO repairs (id, vehicle_id, date, odometer, type, status, description, diagnosis,
         workshop, workshop_phone, parts_affected, estimate_price, final_price,
         repair_days, warranty_claim, invoice_number, notes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $id, $vid,
        $b['date'], $b['odometer'] ?? null,
        $b['type'] ?? 'mechanical', $b['status'] ?? 'open',
        $b['description'],
        $b['diagnosis'] ?? null,
        $b['workshop'] ?? null, $b['workshopPhone'] ?? null,
        isset($b['partsAffected']) ? json_encode($b['partsAffected']) : null,
        isset($b['estimatePrice']) ? (float)$b['estimatePrice'] : null,
        isset($b['finalPrice'])    ? (float)$b['finalPrice']    : null,
        isset($b['repairDays'])    ? (int)$b['repairDays']      : null,
        isset($b['warrantyClaim']) ? (int)(bool)$b['warrantyClaim'] : 0,
        $b['invoiceNumber'] ?? null,
        $b['notes'] ?? null,
    ]);
    json(['id' => $id, 'ok' => true], 201);
}

if ($method === 'PUT') {
    $b = body();
    $id = $_GET['id'] ?? '';
    $st = $db->prepare('SELECT id FROM repairs WHERE id = ? AND vehicle_id = ?');
    $st->execute([$id, $vid]);
    if (!$st->fetch()) err('Not found', 404);
    $db->prepare(
        'UPDATE repairs SET date=?, odometer=?, type=?, status=?, description=?, diagnosis=?,
         workshop=?, workshop_phone=?, parts_affected=?, estimate_price=?, final_price=?,
         repair_days=?, warranty_claim=?, invoice_number=?, notes=?
         WHERE id=? AND vehicle_id=?'
    )->execute([
        $b['date'], $b['odometer'] ?? null,
        $b['type'] ?? 'mechanical', $b['status'] ?? 'open',
        $b['description'],
        $b['diagnosis'] ?? null,
        $b['workshop'] ?? null, $b['workshopPhone'] ?? null,
        isset($b['partsAffected']) ? json_encode($b['partsAffected']) : null,
        isset($b['estimatePrice']) ? (float)$b['estimatePrice'] : null,
        isset($b['finalPrice'])    ? (float)$b['finalPrice']    : null,
        isset($b['repairDays'])    ? (int)$b['repairDays']      : null,
        isset($b['warrantyClaim']) ? (int)(bool)$b['warrantyClaim'] : 0,
        $b['invoiceNumber'] ?? null,
        $b['notes'] ?? null,
        $id, $vid,
    ]);
    json(['ok' => true]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    $db->prepare('DELETE FROM repairs WHERE id = ? AND vehicle_id = ?')->execute([$id, $vid]);
    json(['ok' => true]);
}
