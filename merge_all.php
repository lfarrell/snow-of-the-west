<?php
date_default_timezone_set('America/New_York');

$states = array('az', 'ca', 'co', 'id', 'mt', 'nv', 'nm', 'or', 'ut', 'wa', 'wy');
$fh = fopen('data/all.csv', "wb");
fputcsv($fh, ['location', 'snow_depth', 'snow_water', 'provider', 'month', 'year', 'elevation', 'el_level', 'state']);

foreach($states as $s) {
    $state = strtoupper($s);
    $files = scandir('data/' . $state);

    foreach($files as $file) {
        if (($handle = fopen('data/' . $state . '/' . $file, "r")) !== FALSE) {
            while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                if(!preg_match('/location/', $data[0]) && preg_match('/^0(1|2|3|4|5|6)/', $data[4])) {
                    $data[7] = elevationRange($data[6]);
                    $data[8] = $state;
                    fputcsv($fh, $data);
                }
            }
            fclose($handle);
        }
        echo $file . " processed\n";
    }
}

fclose($fh);

function elevationRange($elevation) {
    if($elevation >= 10000) {
        $range = 10;
    } elseif($elevation >= 9000) {
        $range = 9;
    } elseif($elevation >= 8000) {
        $range = 8;
    } elseif($elevation >= 7000) {
        $range = 7;
    } elseif($elevation >= 6000) {
        $range = 6;
    } elseif($elevation >= 5000) {
        $range = 5;
    } elseif($elevation >= 4000) {
        $range = 4;
    } else {
        $range = 3;
    }

    return $range;
}