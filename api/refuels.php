<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
setCors();

$vehicle = requireAuth();
$vid = $vehicle['id'];
$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

if ($method === 'GET') {
    $st = $db->prepare(
        'SELECT id, date, liters, liters_in_tank, total_price, price_per_liter,
                odometer, station_name, station_address, driving_mode, notes
         FROM fuel_refuels WHERE vehicle_id = ? ORDER BY date DESC, created_at DESC'
    );
    $st->execute([$vid]);
    $rows = $st->fetchAll();
    $rows = array_map(function($r) {
        return [
            'id'             => $r['id'],
            'date'           => $r['date'],
            'liters'         => (float)$r['liters'],
            'litersInTank'   => $r['liters_in_tank'] !== null ? (float)$r['liters_in_tank'] : null,
            'totalPrice'     => (float)$r['total_price'],
            'pricePerLiter'  => (float)$r['price_per_liter'],
            'odometer'       => (int)$r['odometer'],
            'stationName'    => $r['station_name'],
            'stationAddress' => $r['station_address'],
            'drivingMode'    => $r['driving_mode'],
            'notes'          => $r['notes'],
        ];
    }, $rows);
    json($rows);
}

if ($method === 'POST') {
    $b        = body();
    $id       = $b['id'] ?? bin2hex(random_bytes(16));
    $date     = requireDate($b, 'date');
    $liters   = requireFloat($b, 'liters', 0.01);
    $pPerL    = requireFloat($b, 'pricePerLiter', 0);
    $total    = requireFloat($b, 'totalPrice', 0);
    $odometer = requireInt($b, 'odometer', 0);
    $db->prepare(
        'INSERT INTO fuel_refuels
         (id, vehicle_id, date, liters, liters_in_tank, total_price, price_per_liter, odometer, station_name, station_address, driving_mode, notes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $id, $vid,
        $date, $liters,
        isset($b['litersInTank']) ? (float)$b['litersInTank'] : null,
        $total, $pPerL,
        $odometer,
        $b['stationName'] ?? null, $b['stationAddress'] ?? null,
        $b['drivingMode'] ?? null,
        $b['notes'] ?? null,
    ]);
    json(['ok' => true, 'id' => $id], 201);
}

if ($method === 'PUT') {
    $b        = body();
    $id       = $_GET['id'] ?? $b['id'] ?? null;
    if (!$id) err('ID requerido');
    $st = $db->prepare('SELECT id FROM fuel_refuels WHERE id = ? AND vehicle_id = ?');
    $st->execute([$id, $vid]);
    if (!$st->fetch()) err('No encontrado', 404);

    $date     = requireDate($b, 'date');
    $liters   = requireFloat($b, 'liters', 0.01);
    $pPerL    = requireFloat($b, 'pricePerLiter', 0);
    $total    = requireFloat($b, 'totalPrice', 0);
    $odometer = requireInt($b, 'odometer', 0);

    $db->prepare(
        'UPDATE fuel_refuels SET
         date=?, liters=?, liters_in_tank=?, total_price=?, price_per_liter=?,
         odometer=?, station_name=?, station_address=?, driving_mode=?, notes=?
         WHERE id=? AND vehicle_id=?'
    )->execute([
        $date, $liters,
        isset($b['litersInTank']) ? (float)$b['litersInTank'] : null,
        $total, $pPerL,
        $odometer,
        $b['stationName'] ?? null, $b['stationAddress'] ?? null,
        $b['drivingMode'] ?? null,
        $b['notes'] ?? null,
        $id, $vid,
    ]);
    json(['ok' => true]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) err('ID requerido');
    $st = $db->prepare('DELETE FROM fuel_refuels WHERE id = ? AND vehicle_id = ?');
    $st->execute([$id, $vid]);
    if ($st->rowCount() === 0) err('No encontrado', 404);
    json(['ok' => true]);
}

err('Método no permitido', 405);
