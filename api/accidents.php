<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
setCors();

$vehicle = requireAuth();
$vid = $vehicle['id'];
$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

try {
    $db->exec("CREATE TABLE IF NOT EXISTS accident_reports (
      id VARCHAR(36) PRIMARY KEY,
      vehicle_id INT NOT NULL,
      date DATE NOT NULL,
      time TIME NULL,
      location VARCHAR(200) NULL,
      odometer INT UNSIGNED NULL,
      description TEXT NOT NULL,
      parts_affected TEXT NULL,
      damage_description TEXT NULL,
      has_third_party TINYINT(1) NOT NULL DEFAULT 0,
      third_party_name VARCHAR(150) NULL,
      third_party_plate VARCHAR(20) NULL,
      third_party_insurance VARCHAR(150) NULL,
      third_party_policy VARCHAR(80) NULL,
      notified_insurance TINYINT(1) NOT NULL DEFAULT 0,
      claim_number VARCHAR(80) NULL,
      status VARCHAR(15) NOT NULL DEFAULT 'open',
      repair_cost DECIMAL(10,2) NULL,
      workshop VARCHAR(150) NULL,
      resolution_date DATE NULL,
      notes TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_vehicle (vehicle_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
} catch (PDOException $e) { err('Error al inicializar tabla: ' . $e->getMessage(), 500); }

function mapAccident(array $r): array {
    return [
        'id'                  => $r['id'],
        'date'                => $r['date'],
        'time'                => $r['time'],
        'location'            => $r['location'],
        'odometer'            => $r['odometer'] !== null ? (int)$r['odometer'] : null,
        'description'         => $r['description'],
        'partsAffected'       => $r['parts_affected'] ? json_decode($r['parts_affected'], true) : [],
        'damageDescription'   => $r['damage_description'],
        'hasThirdParty'       => (bool)$r['has_third_party'],
        'thirdPartyName'      => $r['third_party_name'],
        'thirdPartyPlate'     => $r['third_party_plate'],
        'thirdPartyInsurance' => $r['third_party_insurance'],
        'thirdPartyPolicy'    => $r['third_party_policy'],
        'notifiedInsurance'   => (bool)$r['notified_insurance'],
        'claimNumber'         => $r['claim_number'],
        'status'              => $r['status'],
        'repairCost'          => $r['repair_cost'] !== null ? (float)$r['repair_cost'] : null,
        'workshop'            => $r['workshop'],
        'resolutionDate'      => $r['resolution_date'],
        'notes'               => $r['notes'],
    ];
}

if ($method === 'GET') {
    $st = $db->prepare('SELECT * FROM accident_reports WHERE vehicle_id = ? ORDER BY date DESC');
    $st->execute([$vid]);
    json(array_map('mapAccident', $st->fetchAll()));
}

if ($method === 'POST') {
    $b = body();
    $id = $b['id'] ?? bin2hex(random_bytes(16));
    $db->prepare(
        'INSERT INTO accident_reports (id, vehicle_id, date, time, location, odometer, description,
         parts_affected, damage_description, has_third_party, third_party_name, third_party_plate,
         third_party_insurance, third_party_policy, notified_insurance, claim_number, status,
         repair_cost, workshop, resolution_date, notes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $id, $vid,
        $b['date'],
        $b['time']                ?? null,
        $b['location']            ?? null,
        $b['odometer']            ?? null,
        $b['description'],
        isset($b['partsAffected'])    ? json_encode($b['partsAffected']) : null,
        $b['damageDescription']   ?? null,
        isset($b['hasThirdParty'])    ? (int)(bool)$b['hasThirdParty']    : 0,
        $b['thirdPartyName']      ?? null,
        $b['thirdPartyPlate']     ?? null,
        $b['thirdPartyInsurance'] ?? null,
        $b['thirdPartyPolicy']    ?? null,
        isset($b['notifiedInsurance']) ? (int)(bool)$b['notifiedInsurance'] : 0,
        $b['claimNumber']         ?? null,
        $b['status']              ?? 'open',
        isset($b['repairCost'])       ? (float)$b['repairCost']           : null,
        $b['workshop']            ?? null,
        $b['resolutionDate']      ?? null,
        $b['notes']               ?? null,
    ]);
    json(['id' => $id, 'ok' => true], 201);
}

if ($method === 'PUT') {
    $b = body();
    $id = $_GET['id'] ?? '';
    $st = $db->prepare('SELECT id FROM accident_reports WHERE id = ? AND vehicle_id = ?');
    $st->execute([$id, $vid]);
    if (!$st->fetch()) err('Not found', 404);
    $db->prepare(
        'UPDATE accident_reports SET date=?, time=?, location=?, odometer=?, description=?,
         parts_affected=?, damage_description=?, has_third_party=?, third_party_name=?,
         third_party_plate=?, third_party_insurance=?, third_party_policy=?,
         notified_insurance=?, claim_number=?, status=?, repair_cost=?, workshop=?,
         resolution_date=?, notes=?
         WHERE id=? AND vehicle_id=?'
    )->execute([
        $b['date'],
        $b['time']                ?? null,
        $b['location']            ?? null,
        $b['odometer']            ?? null,
        $b['description'],
        isset($b['partsAffected'])    ? json_encode($b['partsAffected']) : null,
        $b['damageDescription']   ?? null,
        isset($b['hasThirdParty'])    ? (int)(bool)$b['hasThirdParty']    : 0,
        $b['thirdPartyName']      ?? null,
        $b['thirdPartyPlate']     ?? null,
        $b['thirdPartyInsurance'] ?? null,
        $b['thirdPartyPolicy']    ?? null,
        isset($b['notifiedInsurance']) ? (int)(bool)$b['notifiedInsurance'] : 0,
        $b['claimNumber']         ?? null,
        $b['status']              ?? 'open',
        isset($b['repairCost'])       ? (float)$b['repairCost']           : null,
        $b['workshop']            ?? null,
        $b['resolutionDate']      ?? null,
        $b['notes']               ?? null,
        $id, $vid,
    ]);
    json(['ok' => true]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    $db->prepare('DELETE FROM accident_reports WHERE id = ? AND vehicle_id = ?')->execute([$id, $vid]);
    json(['ok' => true]);
}
