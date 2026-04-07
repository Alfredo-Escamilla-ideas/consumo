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
        'SELECT id, date, kwh, total_price, price_per_kwh, total_price_gross,
                waylet_before, waylet_after, battery_percent,
                odometer, station_name, station_address, driving_mode, notes
         FROM electric_charges WHERE vehicle_id = ? ORDER BY odometer ASC'
    );
    $st->execute([$vid]);
    $rows = $st->fetchAll();
    // Cast numeric fields
    $rows = array_map(function($r) {
        return [
            'id'              => $r['id'],
            'date'            => $r['date'],
            'kWh'             => (float)$r['kwh'],
            'pricePerKWh'     => (float)$r['price_per_kwh'],
            'totalPriceGross' => (float)($r['total_price_gross'] ?? $r['total_price']),
            'totalPrice'      => (float)$r['total_price'],
            'wayletBefore'    => $r['waylet_before']    !== null ? (float)$r['waylet_before']    : null,
            'wayletAfter'     => $r['waylet_after']     !== null ? (float)$r['waylet_after']     : null,
            'batteryPercent'  => $r['battery_percent']  !== null ? (int)$r['battery_percent']    : null,
            'odometer'        => (int)$r['odometer'],
            'stationName'     => $r['station_name'],
            'stationAddress'  => $r['station_address'],
            'drivingMode'     => $r['driving_mode'],
            'notes'           => $r['notes'],
        ];
    }, $rows);
    json($rows);
}

if ($method === 'POST') {
    $b = body();
    $id = $b['id'] ?? bin2hex(random_bytes(16));
    try {
        $db->prepare(
            'INSERT INTO electric_charges
             (id, vehicle_id, date, kwh, price_per_kwh, total_price_gross, total_price,
              waylet_before, waylet_after, battery_percent, odometer, station_name, station_address, driving_mode, notes)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
        )->execute([
            $id, $vid,
            $b['date'], $b['kWh'], $b['pricePerKWh'],
            $b['totalPriceGross'] ?? $b['totalPrice'],
            $b['totalPrice'],
            isset($b['wayletBefore'])    ? (float)$b['wayletBefore']    : null,
            isset($b['wayletAfter'])     ? (float)$b['wayletAfter']     : null,
            isset($b['batteryPercent'])  ? (int)$b['batteryPercent']    : null,
            $b['odometer'],
            $b['stationName'], $b['stationAddress'],
            $b['drivingMode'] ?? null,
            $b['notes'] ?? null,
        ]);
    } catch (PDOException $e) {
        err('DB error (POST): ' . $e->getMessage());
    }
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
         date=?, kwh=?, price_per_kwh=?, total_price_gross=?, total_price=?,
         waylet_before=?, waylet_after=?, battery_percent=?,
         odometer=?, station_name=?, station_address=?, driving_mode=?, notes=?
         WHERE id=? AND vehicle_id=?'
    )->execute([
        $b['date'], $b['kWh'], $b['pricePerKWh'],
        $b['totalPriceGross'] ?? $b['totalPrice'],
        $b['totalPrice'],
        isset($b['wayletBefore'])   ? (float)$b['wayletBefore']   : null,
        isset($b['wayletAfter'])    ? (float)$b['wayletAfter']    : null,
        isset($b['batteryPercent']) ? (int)$b['batteryPercent']   : null,
        $b['odometer'],
        $b['stationName'], $b['stationAddress'],
        $b['drivingMode'] ?? null,
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
