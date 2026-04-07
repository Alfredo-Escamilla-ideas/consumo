<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
setCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') err('Método no permitido', 405);

$b = body();
$plate = strtoupper(preg_replace('/\s+/', '', $b['plate'] ?? ''));
$password = $b['password'] ?? '';
$model = trim($b['vehicle_model'] ?? 'Jaecoo 7 PHEV') ?: 'Jaecoo 7 PHEV';
$initialOdometer  = max(0, (int)($b['initial_odometer'] ?? 0));
$initialBattery   = min(100, max(0, (int)($b['initial_battery_pct'] ?? 100)));
$initialFuel      = max(0, (float)($b['initial_fuel_liters'] ?? 60.0));

if (strlen($plate) < 4) err('Matrícula inválida (mínimo 4 caracteres)');
if (strlen($password) < 4) err('Contraseña demasiado corta (mínimo 4 caracteres)');

$db = getDB();
$st = $db->prepare('SELECT id FROM vehicles WHERE plate = ?');
$st->execute([$plate]);
if ($st->fetch()) err('Esa matrícula ya está registrada');

$db->prepare('INSERT INTO vehicles (plate, password_hash, vehicle_model, initial_odometer, initial_battery_pct, initial_fuel_liters) VALUES (?, ?, ?, ?, ?, ?)')
   ->execute([$plate, password_hash($password, PASSWORD_DEFAULT), $model, $initialOdometer, $initialBattery, $initialFuel]);
$vehicleId = (int)$db->lastInsertId();

$token = bin2hex(random_bytes(32));
$expires = date('Y-m-d H:i:s', strtotime('+' . TOKEN_EXPIRY_DAYS . ' days'));
$db->prepare('INSERT INTO sessions (token, vehicle_id, expires_at) VALUES (?, ?, ?)')
   ->execute([$token, $vehicleId, $expires]);

json([
    'token' => $token,
    'plate' => $plate,
    'vehicle_model' => $model,
    'initial_odometer' => $initialOdometer,
    'initial_battery_pct' => $initialBattery,
    'initial_fuel_liters' => (float)$initialFuel,
    'created_at' => date('Y-m-d'),
]);
