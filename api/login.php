<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
setCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') err('Método no permitido', 405);

$b = body();
$plate = strtoupper(preg_replace('/\s+/', '', $b['plate'] ?? ''));
$password = $b['password'] ?? '';

if (!$plate || !$password) err('Matrícula y contraseña requeridas');

$db = getDB();
$st = $db->prepare('SELECT id, password_hash, vehicle_model FROM vehicles WHERE plate = ?');
$st->execute([$plate]);
$v = $st->fetch();

if (!$v || !password_verify($password, $v['password_hash'])) {
    err('Matrícula o contraseña incorrectos', 401);
}

// Delete old expired sessions for this vehicle
$db->prepare('DELETE FROM sessions WHERE vehicle_id = ? AND expires_at <= NOW()')->execute([$v['id']]);

$token = bin2hex(random_bytes(32));
$expires = date('Y-m-d H:i:s', strtotime('+' . TOKEN_EXPIRY_DAYS . ' days'));
$db->prepare('INSERT INTO sessions (token, vehicle_id, expires_at) VALUES (?, ?, ?)')
   ->execute([$token, $v['id'], $expires]);

json(['token' => $token, 'plate' => $plate, 'vehicle_model' => $v['vehicle_model']]);
