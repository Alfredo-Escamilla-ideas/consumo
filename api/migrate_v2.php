<?php
// Run once to add vehicle baseline columns
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
setCors();

$db = getDB();
$results = [];

$columns = [
    // vehicles
    'vehicles.initial_odometer'   => ['table' => 'vehicles',       'sql' => "ALTER TABLE vehicles ADD COLUMN initial_odometer INT UNSIGNED NOT NULL DEFAULT 0"],
    'vehicles.initial_battery_pct'=> ['table' => 'vehicles',       'sql' => "ALTER TABLE vehicles ADD COLUMN initial_battery_pct TINYINT UNSIGNED NOT NULL DEFAULT 100"],
    'vehicles.initial_fuel_liters'=> ['table' => 'vehicles',       'sql' => "ALTER TABLE vehicles ADD COLUMN initial_fuel_liters DECIMAL(5,2) NOT NULL DEFAULT 60.00"],
    'vehicles.created_at'         => ['table' => 'vehicles',       'sql' => "ALTER TABLE vehicles ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"],
    // electric_charges
    'electric_charges.driving_mode' => ['table' => 'electric_charges', 'sql' => "ALTER TABLE electric_charges ADD COLUMN driving_mode VARCHAR(10) NULL"],
    'electric_charges.odometer'          => ['table' => 'electric_charges', 'sql' => "ALTER TABLE electric_charges ADD COLUMN odometer INT UNSIGNED NULL"],
    'electric_charges.waylet_before'     => ['table' => 'electric_charges', 'sql' => "ALTER TABLE electric_charges ADD COLUMN waylet_before DECIMAL(8,2) NULL"],
    'electric_charges.waylet_after'      => ['table' => 'electric_charges', 'sql' => "ALTER TABLE electric_charges ADD COLUMN waylet_after DECIMAL(8,2) NULL"],
    'electric_charges.total_price_gross' => ['table' => 'electric_charges', 'sql' => "ALTER TABLE electric_charges ADD COLUMN total_price_gross DECIMAL(8,2) NULL"],
    'electric_charges.battery_percent'   => ['table' => 'electric_charges', 'sql' => "ALTER TABLE electric_charges ADD COLUMN battery_percent TINYINT UNSIGNED NULL"],
    // fuel_refuels
    'fuel_refuels.driving_mode'     => ['table' => 'fuel_refuels',     'sql' => "ALTER TABLE fuel_refuels ADD COLUMN driving_mode VARCHAR(10) NULL"],
    'fuel_refuels.liters_in_tank'   => ['table' => 'fuel_refuels',     'sql' => "ALTER TABLE fuel_refuels ADD COLUMN liters_in_tank DECIMAL(5,2) NULL"],
];

foreach ($columns as $key => $def) {
    [, $colName] = explode('.', $key);
    $tableName = $def['table'];
    $sql = $def['sql'];
    $exists = $db->prepare(
        "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?"
    );
    $exists->execute([$tableName, $colName]);
    if ((int)$exists->fetchColumn() > 0) {
        $results[] = ['column' => $key, 'status' => 'skipped', 'msg' => 'ya existe'];
        continue;
    }
    try {
        $db->exec($sql);
        $results[] = ['column' => $key, 'status' => 'ok'];
    } catch (PDOException $e) {
        $results[] = ['column' => $key, 'status' => 'error', 'msg' => $e->getMessage()];
    }
}

// Copy odometer_end → odometer for existing records that don't have it yet
try {
    $rows = $db->exec("UPDATE electric_charges SET odometer = odometer_end WHERE odometer IS NULL AND odometer_end IS NOT NULL AND odometer_end > 0");
    $results[] = ['step' => 'copy_odometer_from_odometer_end', 'status' => 'ok', 'rows' => $rows];
} catch (PDOException $e) {
    $results[] = ['step' => 'copy_odometer_from_odometer_end', 'status' => 'error', 'msg' => $e->getMessage()];
}

// Allow old odometer_start / odometer_end to be NULL (no longer used)
foreach (['odometer_start', 'odometer_end'] as $col) {
    try {
        $db->exec("ALTER TABLE electric_charges MODIFY COLUMN $col INT UNSIGNED NULL DEFAULT NULL");
        $results[] = ['step' => "nullable_$col", 'status' => 'ok'];
    } catch (PDOException $e) {
        $results[] = ['step' => "nullable_$col", 'status' => 'error', 'msg' => $e->getMessage()];
    }
}

json(['results' => $results]);
