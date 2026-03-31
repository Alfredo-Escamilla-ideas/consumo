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
        'SELECT id, date, kwh, total_price, price_per_kwh,
                odometer_start, odometer_end, station_name, station_address, notes
         FROM electric_charges WHERE vehicle_id = ? ORDER BY date DESC, created_at DESC'
    );
    $st->execute([$vid]);
    $rows = $st->fetchAll();
    // Cast numeric fields
    $rows = array_map(function($r) {
        return [
            'id'            => $r['id'],
            'date'          => $r['date'],
            'kWh'           => (float)$r['kwh'],
            'totalPrice'    => (float)$r['total_price'],
            'pricePerKWh'   => (float)$r['price_per_kwh'],
            'odometerStart' => (int)$r['odometer_start'],
            'odometerEnd'   => (int)$r['odometer_end'],
            'stationName'   => $r['station_name'],
            'stationAddress'=> $r['station_address'],
            'notes'         => $r['notes'],
        ];
    }, $rows);
    json($rows);
}

if ($method === 'POST') {
    $b = body();
    $id = $b['id'] ?? bin2hex(random_bytes(16));
    $db->prepare(
        'INSERT INTO electric_charges
         (id, vehicle_id, date, kwh, total_price, price_per_kwh, odometer_start, odometer_end, station_name, station_address, notes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $id, $vid,
        $b['date'], $b['kWh'], $b['totalPrice'], $b['pricePerKWh'],
        $b['odometerStart'], $b['odometerEnd'],
        $b['stationName'], $b['stationAddress'],
        $b['notes'] ?? null,
    ]);
    json(['ok' => true, 'id' => $id], 201);
}

if ($method === 'PUT') {
    $b = body();
    $id = $_GET['id'] ?? $b['id'] ?? null;
    if (!$id) err('ID requerido');
    // Verify ownership
    $st = $db->prepare('SELECT id FROM electric_charges WHERE id = ? AND vehicle_id = ?');
    $st->execute([$id, $vid]);
    if (!$st->fetch()) err('No encontrado', 404);

    $db->prepare(
        'UPDATE electric_charges SET
         date=?, kwh=?, total_price=?, price_per_kwh=?,
         odometer_start=?, odometer_end=?, station_name=?, station_address=?, notes=?
         WHERE id=? AND vehicle_id=?'
    )->execute([
        $b['date'], $b['kWh'], $b['totalPrice'], $b['pricePerKWh'],
        $b['odometerStart'], $b['odometerEnd'],
        $b['stationName'], $b['stationAddress'],
        $b['notes'] ?? null,
        $id, $vid,
    ]);
    json(['ok' => true]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) err('ID requerido');
    $st = $db->prepare('DELETE FROM electric_charges WHERE id = ? AND vehicle_id = ?');
    $st->execute([$id, $vid]);
    if ($st->rowCount() === 0) err('No encontrado', 404);
    json(['ok' => true]);
}

err('Método no permitido', 405);
