<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
setCors();

$vehicle = requireAuth();
$vid = $vehicle['id'];
$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

try {
    $db->exec("CREATE TABLE IF NOT EXISTS insurance (
      id VARCHAR(32) PRIMARY KEY,
      vehicle_id INT NOT NULL UNIQUE,
      company VARCHAR(100) NOT NULL,
      policy_number VARCHAR(100) NOT NULL DEFAULT '',
      type VARCHAR(30) NOT NULL DEFAULT 'comprehensive',
      annual_price DECIMAL(10,2) NULL,
      excess_amount DECIMAL(10,2) NULL,
      start_date DATE NULL,
      end_date DATE NULL,
      auto_renewal TINYINT(1) NOT NULL DEFAULT 1,
      agent_name VARCHAR(100) NULL,
      agent_phone VARCHAR(30) NULL,
      agent_email VARCHAR(100) NULL,
      emergency_phone VARCHAR(30) NULL,
      coverages TEXT NULL,
      notes TEXT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_vehicle (vehicle_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
} catch (PDOException $e) {
    err('Error al inicializar tabla: ' . $e->getMessage(), 500);
}

function mapInsurance(array $r): array {
    return [
        'id'             => $r['id'],
        'company'        => $r['company'],
        'policyNumber'   => $r['policy_number'],
        'type'           => $r['type'],
        'annualPrice'    => $r['annual_price']    !== null ? (float)$r['annual_price']    : null,
        'excessAmount'   => $r['excess_amount']   !== null ? (float)$r['excess_amount']   : null,
        'startDate'      => $r['start_date'],
        'endDate'        => $r['end_date'],
        'autoRenewal'    => (bool)$r['auto_renewal'],
        'agentName'      => $r['agent_name'],
        'agentPhone'     => $r['agent_phone'],
        'agentEmail'     => $r['agent_email'],
        'emergencyPhone' => $r['emergency_phone'],
        'coverages'      => $r['coverages'] ? json_decode($r['coverages'], true) : [],
        'notes'          => $r['notes'],
    ];
}

if ($method === 'GET') {
    $st = $db->prepare('SELECT * FROM insurance WHERE vehicle_id = ?');
    $st->execute([$vid]);
    $row = $st->fetch();
    json($row ? mapInsurance($row) : null);
}

if ($method === 'POST' || $method === 'PUT') {
    $b = body();
    $st = $db->prepare('SELECT id FROM insurance WHERE vehicle_id = ?');
    $st->execute([$vid]);
    $existing = $st->fetchColumn();

    $id = $existing ?: ($b['id'] ?? bin2hex(random_bytes(16)));
    $coverages = json_encode($b['coverages'] ?? []);

    if ($existing) {
        $db->prepare(
            'UPDATE insurance SET company=?, policy_number=?, type=?, annual_price=?,
             excess_amount=?, start_date=?, end_date=?, auto_renewal=?,
             agent_name=?, agent_phone=?, agent_email=?, emergency_phone=?,
             coverages=?, notes=?, updated_at=NOW()
             WHERE vehicle_id=?'
        )->execute([
            $b['company'], $b['policyNumber'] ?? '', $b['type'] ?? 'comprehensive',
            isset($b['annualPrice'])    ? (float)$b['annualPrice']    : null,
            isset($b['excessAmount'])   ? (float)$b['excessAmount']   : null,
            $b['startDate']  ?? null, $b['endDate'] ?? null,
            isset($b['autoRenewal'])    ? (int)(bool)$b['autoRenewal'] : 1,
            $b['agentName']       ?? null, $b['agentPhone']  ?? null,
            $b['agentEmail']      ?? null, $b['emergencyPhone'] ?? null,
            $coverages, $b['notes'] ?? null,
            $vid,
        ]);
    } else {
        $db->prepare(
            'INSERT INTO insurance (id, vehicle_id, company, policy_number, type, annual_price,
             excess_amount, start_date, end_date, auto_renewal, agent_name, agent_phone,
             agent_email, emergency_phone, coverages, notes)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
        )->execute([
            $id, $vid,
            $b['company'], $b['policyNumber'] ?? '', $b['type'] ?? 'comprehensive',
            isset($b['annualPrice'])    ? (float)$b['annualPrice']    : null,
            isset($b['excessAmount'])   ? (float)$b['excessAmount']   : null,
            $b['startDate']  ?? null, $b['endDate'] ?? null,
            isset($b['autoRenewal'])    ? (int)(bool)$b['autoRenewal'] : 1,
            $b['agentName']       ?? null, $b['agentPhone']  ?? null,
            $b['agentEmail']      ?? null, $b['emergencyPhone'] ?? null,
            $coverages, $b['notes'] ?? null,
        ]);
    }
    json(['id' => $id, 'ok' => true]);
}
