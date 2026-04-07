<?php
require_once __DIR__ . '/helpers.php';
setCors();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') err('Método no permitido', 405);

$auth = requireAuth();
$vehicleId = (int)$auth['id'];

$db = getDB();

// Delete all data for this vehicle in order (child tables first)
$db->prepare('DELETE FROM electric_charges WHERE vehicle_id = ?')->execute([$vehicleId]);
$db->prepare('DELETE FROM fuel_refuels WHERE vehicle_id = ?')->execute([$vehicleId]);
$db->prepare('DELETE FROM sessions WHERE vehicle_id = ?')->execute([$vehicleId]);
$db->prepare('DELETE FROM vehicles WHERE id = ?')->execute([$vehicleId]);

json(['ok' => true]);
